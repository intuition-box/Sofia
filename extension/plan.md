# Feature: Support/Oppose buttons on TrendingTab

## Context

TrendingTab affiche les URLs les plus certifiees par categorie (music, work, fun...), groupees par domaine. On veut ajouter des boutons Support/Oppose (memes fleches que CircleFeedTab) sur chaque item.

**Contrainte cle** : le deposit doit cibler un **triple avec la plateforme** (domaine) comme objet, pas les pages individuelles. Ex: `I | visits for music | youtube.com` au lieu de `I | visits for music | youtube.com/watch?v=abc`.

**Probleme** : ces triples domaine n'existent pas forcement encore (les trending items sont des triples page-level). Il faut donc:
- **Support** : creer le triple domaine si besoin, ou deposer dessus s'il existe → `useCreateTripleOnChain`
- **Oppose** : deposer sur le counter vault du triple domaine → necessite que le triple existe deja

## Plan

### 1. Query GraphQL : `FindDomainTriples` dans `trending.graphql`

Cherche les triples domaine existants + positions user pour detecter l'etat voted.

```graphql
query FindDomainTriples(
  $predicateIds: [String!]!
  $domainLabels: [String!]!
  $address: String!
  $limit: Int = 500
) {
  triples(
    where: {
      predicate_id: { _in: $predicateIds }
      object: { label: { _in: $domainLabels } }
    }
    limit: $limit
  ) {
    term_id
    counter_term_id
    predicate_id
    object { term_id, label }
    positions(where: { account_id: { _ilike: $address }, shares: { _gt: "0" } }) {
      shares
    }
    counter_term {
      vaults(where: { curve_id: { _eq: "1" } }) {
        positions(where: { account_id: { _ilike: $address }, shares: { _gt: "0" } }) {
          shares
        }
      }
    }
  }
}
```

**Variables** : `predicateIds` = IDs des 8 predicats trending, `domainLabels` = tous les domaines uniques affiches, `address` = wallet user.

### 2. Codegen

```bash
cd extension/packages/graphql && pnpm codegen
```

### 3. Modifier `TrendingTab.tsx`

**Imports a ajouter** :
- `useCreateTripleOnChain` — pour Support (create/deposit)
- `useWeightOnChain` → `depositWithPool` — pour Oppose (deposit sur counter vault)
- `useWalletFromStorage` — wallet address
- `useFindDomainTriplesQuery` — generated, pour etat voted
- `WeightModal` — modal de confirmation
- `INTENTION_CONFIG` — deja importe, pour predicateLabel
- `questTrackingService`, `goldService` — tracking Gold/XP
- `PREDICATE_IDS` — pour la liste des predicateIds

**State a ajouter** :
```typescript
// Vote state
const [selectedItem, setSelectedItem] = useState<TrendingItem | null>(null)
const [selectedCategoryForVote, setSelectedCategoryForVote] = useState<IntentionType | null>(null)
const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null)
const [selectedAction, setSelectedAction] = useState<'Support' | 'Oppose'>('Support')
const [localVotes, setLocalVotes] = useState(() => new Map<string, 'support' | 'oppose'>())

// Modal state
const [isStakeModalOpen, setIsStakeModalOpen] = useState(false)
const [isProcessing, setIsProcessing] = useState(false)
const [transactionSuccess, setTransactionSuccess] = useState(false)
const [transactionError, setTransactionError] = useState<string | null>(null)
const [transactionHash, setTransactionHash] = useState<string | undefined>()
```

**Domain triple lookup** :
```typescript
// Collect unique domains across all categories
const allDomains = useMemo(() =>
  [...new Set(categories.flatMap(c => c.items.map(i => i.domain)))]
, [categories])

// Collect predicate IDs used in trending
const trendingPredicateIds = useMemo(() =>
  TRENDING_CATEGORIES.map(c => c.predicateId).filter(Boolean)
, [])

// Fetch existing domain triples + user positions
const { data: domainTriplesData } = useFindDomainTriplesQuery(
  { predicateIds: trendingPredicateIds, domainLabels: allDomains, address: checksumAddress, limit: 500 },
  { enabled: allDomains.length > 0 && !!checksumAddress }
)

// Build lookup: "domain:predicateId" → { termId, counterTermId, voteState }
const domainTripleMap = useMemo(() => {
  const map = new Map<string, { termId: string; counterTermId: string; vote: 'support' | 'oppose' | null }>()
  if (domainTriplesData?.triples) {
    for (const triple of domainTriplesData.triples) {
      const key = `${triple.object.label}:${triple.predicate_id}`
      const hasSupport = triple.positions?.some(p => BigInt(p.shares) > 0n)
      const hasOppose = triple.counter_term?.vaults?.some(v =>
        v.positions?.some(p => BigInt(p.shares) > 0n)
      )
      map.set(key, {
        termId: triple.term_id,
        counterTermId: triple.counter_term_id,
        vote: hasSupport ? 'support' : hasOppose ? 'oppose' : null
      })
    }
  }
  return map
}, [domainTriplesData, localVotes])
```

**Handlers** :
```typescript
const handleSupport = (e, item: TrendingItem, categoryType: IntentionType) => {
  e.stopPropagation()
  if (!address) return
  setSelectedItem(item)
  setSelectedAction('Support')
  setSelectedCategoryForVote(categoryType)
  setIsStakeModalOpen(true)
}

const handleOppose = (e, item: TrendingItem, categoryType: IntentionType) => {
  e.stopPropagation()
  if (!address) return
  const predicateId = TRENDING_CATEGORIES.find(c => c.type === categoryType)?.predicateId
  const tripleInfo = domainTripleMap.get(`${item.domain}:${predicateId}`)
  if (!tripleInfo?.counterTermId) return // Triple doesn't exist yet
  setSelectedItem(item)
  setSelectedVaultId(tripleInfo.counterTermId)
  setSelectedAction('Oppose')
  setSelectedCategoryForVote(categoryType)
  setIsStakeModalOpen(true)
}
```

**Submit** :
```typescript
const handleStakeSubmit = async (customWeights) => {
  if (!selectedItem || !selectedCategoryForVote) return
  const weight = customWeights?.[0] || BigInt(Math.floor(0.5 * 1e18))

  try {
    setIsProcessing(true)

    if (selectedAction === 'Support') {
      // Support = certify domain (creates triple if needed, deposits if exists)
      const config = INTENTION_CONFIG[selectedCategoryForVote]
      const domainUrl = `https://${selectedItem.domain}`
      const result = await createTripleOnChain(
        config.predicateLabel,
        { name: selectedItem.domain, url: domainUrl, image: getFaviconUrl(selectedItem.domain, 128) },
        weight
      )
      if (result.tripleVaultId) {
        setTransactionSuccess(true)
        setTransactionHash(result.txHash)
        setLocalVotes(prev => new Map(prev).set(
          `${selectedItem.domain}:${selectedCategoryForVote}`, 'support'
        ))
      }
    } else {
      // Oppose = deposit on counter vault
      const result = await depositWithPool(selectedVaultId, weight, 1n)
      if (result.success) {
        setTransactionSuccess(true)
        setTransactionHash(result.txHash)
        setLocalVotes(prev => new Map(prev).set(
          `${selectedItem.domain}:${selectedCategoryForVote}`, 'oppose'
        ))
      } else {
        setTransactionError(result.error || 'Transaction failed')
      }
    }

    // Track activity
    await questTrackingService.recordVoteActivity()
  } catch (error) {
    setTransactionError(error instanceof Error ? error.message : 'Transaction failed')
  } finally {
    setIsProcessing(false)
  }
}
```

**UI** (dans TrendingCard et detail list) :
```tsx
<div className="trending-card-actions">
  <button
    className={`circle-action-btn circle-support-btn ${voteState === 'support' ? 'voted' : ''}`}
    onClick={(e) => handleSupport(e, item, cat.type)}
    title="Support"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4l-8 8h5v8h6v-8h5z" />
    </svg>
  </button>
  <button
    className={`circle-action-btn circle-oppose-btn ${voteState === 'oppose' ? 'voted' : ''}`}
    onClick={(e) => handleOppose(e, item, cat.type)}
    disabled={!domainTripleExists}
    title="Oppose"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 20l8-8h-5V4H9v8H4z" />
    </svg>
  </button>
</div>
```

**WeightModal** (en bas du composant) :
```tsx
<WeightModal
  isOpen={isStakeModalOpen}
  triplets={selectedItem ? [{
    id: selectedItem.termId,
    triplet: {
      subject: 'I',
      predicate: INTENTION_CONFIG[selectedCategoryForVote].predicateLabel,
      object: selectedItem.domain
    },
    description: '',
    url: `https://${selectedItem.domain}`,
    intention: selectedCategoryForVote
  }] : []}
  isProcessing={isProcessing}
  transactionSuccess={transactionSuccess}
  transactionError={transactionError}
  transactionHash={transactionHash}
  estimateOptions={{
    isNewTriple: selectedAction === 'Support' && !domainTripleMap.has(`${selectedItem?.domain}:${predicateId}`),
    newAtomCount: 0
  }}
  submitLabel={selectedAction}
  showXpAnimation={true}
  onClose={handleStakeModalClose}
  onSubmit={handleStakeSubmit}
/>
```

### 4. CSS : extraire styles vote dans fichier partage

Les classes `.circle-action-btn`, `.circle-support-btn`, `.circle-oppose-btn`, `.voted` sont dans `CircleFeedTab.css`.
→ Extraire dans `components/styles/VoteButtons.css`, importe par les deux tabs.

### 5. Positionnement des boutons

- **Grid view** : fleches dans le footer de chaque `TrendingCard`, a cote du compteur certifiers
- **Detail view** : a droite de chaque item dans la liste, avant les stats

## Fichiers modifies

1. `extension/packages/graphql/src/queries/trending.graphql` — ajouter query `FindDomainTriples`
2. `extension/packages/graphql/src/generated/index.ts` — codegen auto
3. `extension/components/pages/resonance-tabs/TrendingTab.tsx` — vote logic + UI
4. `extension/components/styles/VoteButtons.css` — nouveau, styles partages
5. `extension/components/styles/TrendingTab.css` — ajuster layout pour boutons
6. `extension/components/styles/CircleFeedTab.css` — remplacer styles locaux par import VoteButtons.css

## Verification

1. `cd extension/packages/graphql && pnpm codegen` — doit passer sans erreur
2. `cd extension && pnpm dev` — build OK
3. Test manuel TrendingTab :
   - Boutons Support/Oppose visibles sur chaque item (grid + detail)
   - Cliquer Support → WeightModal s'ouvre → confirmer → tx passe → bouton vert
   - Cliquer Oppose (si triple domaine existe) → WeightModal → tx → bouton rouge
   - Oppose disabled si le triple domaine n'existe pas encore
   - Recharger → l'etat voted est detecte depuis on-chain
4. Verifier que CircleFeedTab fonctionne toujours (styles partages)
