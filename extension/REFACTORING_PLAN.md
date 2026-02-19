# Plan de Refactoring: Extraction de la logique metier des Hooks

## Contexte

L'audit de 56 hooks dans `extension/hooks/` a revele des violations architecturales significatives. Les hooks doivent uniquement orchestrer les services et gerer l'etat React Query. Or, beaucoup contiennent de la logique metier, des calculs complexes, des operations blockchain et des utilitaires dupliques.

**Problemes identifies:**
- **6+ hooks** redefinissent les memes constantes de predicats (IDs, labels, mappings)
- **3 implementations** differentes de `extractDomain()` / `normalizeDomain()`
- **3 services** dupliquent `getKey()` alors que `getWalletKey` existe deja (incomplet)
- **useCreateAtom** (623 lignes) et **useCreateTripleOnChain** (766 lignes) = logique blockchain pure
- **useFavicon** reimplemente `getFaviconUrl` au lieu d'utiliser l'utilitaire existant

---

## Phase 1 — Quick Wins: Deduplication des utilitaires

### 1.1 Creer `lib/utils/domainUtils.ts`

**Code duplique a consolider:**

| Fichier source | Fonctions | Lignes |
|---|---|---|
| `hooks/useIntentionGroups.ts` | `normalizeDomain`, `shouldExcludeDomain` | 23-41 |
| `hooks/useOnChainIntentionGroups.ts` | `normalizeDomain`, `extractDomain` | 95-126 |
| `hooks/useTrendingCertifications.ts` | `extractDomain` (variante `new URL()`) | 56-62 |
| `lib/utils/circleInterestUtils.ts` | `normalizeDomain`, `extractDomain` | 38-57 |

**Analyse des differences entre implementations:**

3 sur 4 sont **identiques** (useOnChainIntentionGroups, useIntentionGroups, circleInterestUtils) :
- Retirent le protocole via regex, split sur `/`, valident avec `.includes('.')`
- `normalizeDomain` retire 6 prefixes : `www.`, `open.`, `m.`, `mobile.`, `app.`, `web.`
- Retournent `string | null`

1 est **differente** — `useTrendingCertifications.ts:56-62` :
```typescript
function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return url.split('/')[0] || url }
}
```
- Utilise `new URL()` (parsing strict) au lieu de regex
- Ne retire que `www.` (pas `open.`, `m.`, `mobile.`, etc.)
- Retourne toujours `string` (jamais `null`)

**Conclusion :** La difference n'est PAS intentionnelle. Consequence concrete : dans Trending, `open.spotify.com` et `m.youtube.com` restent tels quels, alors que dans Echoes ils sont normalises en `spotify.com` / `youtube.com`. Le meme site peut apparaitre sous des noms differents selon l'onglet.

**Decision :** Migrer `useTrendingCertifications` vers `extractDomain()` (normalisation complete) pour un comportement coherent. Garder `extractHostname()` comme utilitaire separe pour les cas ou on veut le hostname brut sans normalisation avancee.

**Nouveau fichier — 4 fonctions exportees:**

```typescript
// lib/utils/domainUtils.ts
import { EXCLUDED_URL_PATTERNS } from '~/background/constants'

export function normalizeDomain(domain: string): string {
  const lower = domain.toLowerCase()
  const prefixes = ['www.', 'open.', 'm.', 'mobile.', 'app.', 'web.']
  for (const prefix of prefixes) {
    if (lower.startsWith(prefix)) return lower.slice(prefix.length)
  }
  return lower
}

export function extractDomain(label: string): string | null {
  if (!label) return null
  try {
    const cleaned = label.replace(/^https?:\/\//, '')
    const domain = cleaned.split('/')[0]
    if (domain && domain.includes('.')) return normalizeDomain(domain)
    return null
  } catch { return null }
}

export function extractHostname(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return url.split('/')[0] || url }
}

export function shouldExcludeDomain(domain: string): boolean {
  return EXCLUDED_URL_PATTERNS.some(p => domain.toLowerCase().includes(p.toLowerCase()))
}
```

**Modifications dans les 4 fichiers sources:** Supprimer les fonctions locales, ajouter `import { normalizeDomain, extractDomain, shouldExcludeDomain } from "~/lib/utils"`

### 1.2 Creer `lib/config/predicateConstants.ts`

**Code duplique a consolider (6 fichiers):**

| Fichier source | Constantes definies | Lignes |
|---|---|---|
| `hooks/useOnChainIntentionGroups.ts` | `INTENTION_PREDICATE_IDS`, `OAUTH_PREDICATE_IDS`, `TRUST_PREDICATE_IDS`, `ALL_PREDICATE_IDS`, `PREDICATE_TO_CERTIFICATION` | 18-67 |
| `hooks/useUserCertifications.ts` | `INTENTION_PREDICATE_LABELS`, `OAUTH_PREDICATE_LABELS`, `TRUST_PREDICATE_LABELS`, `ALL_PREDICATE_LABELS`, `ALL_PREDICATE_IDS`, `TRUST_LABEL_TO_TYPE`, `PREDICATE_LABEL_TO_INTENTION` | 19-86 |
| `hooks/useDiscoveryScore.ts` | `CERTIFICATION_PREDICATE_LABELS`, `INTENTION_PREDICATE_LABELS`, `PREDICATE_LABEL_TO_INTENTION`, `PREDICATE_LABEL_TO_TRUST` | 35-70 |
| `hooks/usePageIntentionStats.ts` | `PREDICATE_TO_INTENTION`, `INTENTION_PREDICATE_IDS` | 17-26 |
| `hooks/useInterestAnalysis.ts` | `WEB_ACTIVITY_PREDICATES` | 166-173 |
| `lib/utils/circleInterestUtils.ts` | `INTENTION_PREDICATE_IDS`, `PREDICATE_ID_TO_LABEL` | 16-32 |

**Nouveau fichier — single source of truth:**

```typescript
// lib/config/predicateConstants.ts
import type { IntentionPurpose } from '~/types/discovery'
import { PREDICATE_IDS, PREDICATE_NAMES } from '~/lib/config/chainConfig'

// ── ID Groups ──
export const INTENTION_PREDICATE_IDS = [
  PREDICATE_IDS.VISITS_FOR_WORK, PREDICATE_IDS.VISITS_FOR_LEARNING,
  PREDICATE_IDS.VISITS_FOR_FUN, PREDICATE_IDS.VISITS_FOR_INSPIRATION,
  PREDICATE_IDS.VISITS_FOR_BUYING, PREDICATE_IDS.VISITS_FOR_MUSIC
].filter(Boolean)

export const OAUTH_PREDICATE_IDS = [
  PREDICATE_IDS.FOLLOW, PREDICATE_IDS.MEMBER_OF, PREDICATE_IDS.OWNER_OF,
  PREDICATE_IDS.TOP_ARTIST, PREDICATE_IDS.TOP_TRACK
].filter(Boolean)

export const TRUST_PREDICATE_IDS = [PREDICATE_IDS.TRUSTS, PREDICATE_IDS.DISTRUST].filter(Boolean)
export const ALL_PREDICATE_IDS = [...INTENTION_PREDICATE_IDS, ...OAUTH_PREDICATE_IDS, ...TRUST_PREDICATE_IDS]

// ── Label Groups ──
export const INTENTION_PREDICATE_LABELS = [
  'visits for work', 'visits for learning', 'visits for fun',
  'visits for inspiration', 'visits for buying', 'visits for music'
]
export const INTENTION_PREDICATE_LABELS_WITH_LEGACY = [
  ...INTENTION_PREDICATE_LABELS.slice(0, 2), 'visits for learning ',  // trailing space legacy
  ...INTENTION_PREDICATE_LABELS.slice(2)
]
export const OAUTH_PREDICATE_LABELS: string[] = [
  PREDICATE_NAMES.FOLLOW, PREDICATE_NAMES.MEMBER_OF, PREDICATE_NAMES.OWNER_OF,
  PREDICATE_NAMES.CREATED_PLAYLIST, PREDICATE_NAMES.TOP_TRACK,
  PREDICATE_NAMES.TOP_ARTIST, PREDICATE_NAMES.AM
].filter(Boolean)
export const TRUST_PREDICATE_LABELS = [PREDICATE_NAMES.TRUSTS, PREDICATE_NAMES.DISTRUST].filter(Boolean)
export const ALL_PREDICATE_LABELS = [...INTENTION_PREDICATE_LABELS_WITH_LEGACY, ...OAUTH_PREDICATE_LABELS, ...TRUST_PREDICATE_LABELS]
export const CERTIFICATION_PREDICATE_LABELS = [...INTENTION_PREDICATE_LABELS_WITH_LEGACY, 'trusts', 'distrust']

// ── Mappings: Label → Type ──
export const PREDICATE_LABEL_TO_INTENTION: Record<string, IntentionPurpose> = {
  'visits for work': 'for_work', 'visits for learning': 'for_learning',
  'visits for learning ': 'for_learning',  // legacy trailing space
  'visits for fun': 'for_fun', 'visits for inspiration': 'for_inspiration',
  'visits for buying': 'for_buying', 'visits for music': 'for_music'
}
export const PREDICATE_LABEL_TO_TRUST: Record<string, 'trusted' | 'distrusted'> = {
  'trusts': 'trusted', 'distrust': 'distrusted'
}
export const TRUST_LABEL_TO_TYPE: Record<string, string> = {
  [PREDICATE_NAMES.TRUSTS]: 'trusted', [PREDICATE_NAMES.DISTRUST]: 'distrusted'
}

// ── Mappings: ID → Type (build dynamically for testnet where IDs may be empty) ──
export const PREDICATE_ID_TO_CERTIFICATION: Record<string, string> = {}
// ... intention, oauth, trust mappings built with if(PREDICATE_IDS.X) guards

export const PREDICATE_ID_TO_INTENTION: Record<string, IntentionPurpose> = {}
// ... built from PREDICATE_IDS.VISITS_FOR_*

export const PREDICATE_ID_TO_LABEL: Record<string, string> = {}
// ... built from PREDICATE_IDS → PREDICATE_NAMES
```

**Modifications dans les 6 fichiers sources:** Supprimer toutes les constantes locales, importer depuis `~/lib/config/predicateConstants`

### 1.3 Corriger `useFavicon.ts` → utiliser `getFaviconUrl`

**Source existante:** `lib/utils/formatters.ts:20-31` — `getFaviconUrl(domainOrUrl, size)` deja exporte

**Reimplementations a remplacer:**

| Fichier | Ligne | Code actuel | Remplacement |
|---|---|---|---|
| `hooks/useFavicon.ts` | 26 | `` `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32` `` | `getFaviconUrl(url, 32)` |
| `hooks/useIntentionCertify.ts` | 100 | `` `https://www.google.com/s2/favicons?domain=${hostname}&sz=128` `` | `getFaviconUrl(url, 128)` |
| `hooks/useEchoPublishing.ts` | 55, 98 | `` `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128` `` | `getFaviconUrl(triplet.url, 128)` |

### 1.4 Corriger `getWalletKey` + remplacer `getKey()` prives

**Utilitaire existant:** `lib/utils/storageKeyUtils.ts` — `getWalletKey(baseKey, walletAddress)` **sans** `.toLowerCase()`

**Action 1:** NE PAS modifier `getWalletKey` (il est deja utilise sans lowercase ailleurs). A la place, les services doivent passer l'adresse deja lowercased.

**Action 2:** Remplacer les `getKey()` prives par `getWalletKey`:

| Service | Ligne | Methode privee a supprimer |
|---|---|---|
| `lib/services/GoldService.ts` | 53-54 | `private getKey(baseKey, wallet)` |
| `lib/services/XPService.ts` | 33-35 | `private getKey(baseKey, wallet)` |
| `lib/services/CurrencyMigrationService.ts` | 34-36 | `function getKey(baseKey, wallet)` |

Chaque appel `this.getKey(KEY, wallet)` → `getWalletKey(KEY, wallet.toLowerCase())`

### 1.5 Extraire `formatBalance` dans `formatters.ts`

**Source:** `hooks/useBondingCurveData.ts:8-15`

```typescript
function formatBalance(value: bigint, decimals: number = 18, precision: number = 6): string {
  const divisor = BigInt(10 ** decimals)
  const integerPart = value / divisor
  const fractionalPart = value % divisor
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(0, precision)
  return `${integerPart}.${fractionalStr}`
}
```

**Action:** Deplacer dans `lib/utils/formatters.ts`, exporter, importer dans le hook.

### 1.6 Ajouter `calculateDominantCertification` et `sumCertifications` a `certificationHelpers.ts`

**Code duplique:**

| Fichier | Lignes | Logique |
|---|---|---|
| `lib/services/GroupManager.ts` | 177-187 | Boucle for/of + maxCount |
| `lib/services/LevelUpService.ts` | 219-234 | Meme boucle + texte |
| `components/ui/GroupBentoCard.tsx` | 56-58 | `.filter().sort()[0]` |
| `lib/services/LevelUpService.ts` | 144, 220 | `Object.values(...).reduce(sum)` (2x) |

**Ajouter a `lib/utils/certificationHelpers.ts`:**

```typescript
export function calculateDominantCertification(
  breakdown: Record<string, number>
): { type: string; count: number } | null {
  let maxCount = 0, dominant: string | null = null
  for (const [cert, count] of Object.entries(breakdown)) {
    if (count > maxCount) { maxCount = count; dominant = cert }
  }
  return dominant ? { type: dominant, count: maxCount } : null
}

export function sumCertifications(breakdown: Record<string, number>): number {
  return Object.values(breakdown).reduce((sum, count) => sum + count, 0)
}
```

---

## Phase 2 — Services Blockchain (Impact maximal)

### 2.1 Creer `lib/services/AtomService.ts`

**Source:** `hooks/useCreateAtom.ts` (623 lignes) → service (~500 lignes) + hook (~50 lignes)

**Principe:** Le code est DEPLACE, pas supprime. Chaque fonction du hook est copiee telle quelle dans le service, sauf les 2 appels React (`usePinThingMutation`, `useWalletFromStorage`) qui restent dans le hook et sont passes en parametre.

**Constantes a deplacer dans le service (lignes 15-20):**
```typescript
const CREATION_CURVE_ID = 1n       // bonding curve lineaire
const MIN_ATOM_DEPOSIT = 0n        // pas de depot requis
```

**Type a deplacer (lignes 22-27):**
```typescript
export interface PinnedAtomData {
  atomData: AtomIPFSData
  ipfsUri: string
  encodedData: `0x${string}`
}
```

**Methode 1 — `ensureProxyApproval(address)` (lignes 36-79, copie exacte):**
- Lit `chrome.storage.local.get(proxy_approved_${address.toLowerCase()})` — si deja approuve, return
- Catch non-fatal sur storage read (log + continue)
- Appelle `BlockchainService.requestProxyApproval()` → `waitForApprovalConfirmation(txHash)`
- Detecte rejet utilisateur: `message.includes('rejected') || message.includes('denied')`
- Cache le resultat dans `chrome.storage.local.set()` — catch non-fatal
- **Erreurs preservees:** "No wallet connected", "Proxy approval failed", user rejection message

**Methode 2 — `pinAtomToIPFS(atomData, pinningFn)` (lignes 85-111, copie exacte):**
- `pinningFn` = la mutation GraphQL passee en parametre par le hook
- Valide que `pinningFn` existe, sinon throw
- Appelle `pinningFn({ name, description: atomData.description || "Contenu visite par l'utilisateur.", image: atomData.image || "", url })` — description French par defaut
- Valide `pinResult.pinThing?.uri`, sinon throw
- Encode `stringToHex(ipfsUri)` → retourne `PinnedAtomData`

**Methode 3 — `createAtomsFromPinned(pinnedAtoms, address)` (lignes 117-277, copie exacte):**
- Return `{}` si array vide
- `Promise.all` pour check existence de chaque atom via `BlockchainService.checkAtomExists(ipfsUri)`
- Separe existing (→ result direct `txHash: 'existing'`) et newAtoms
- Calcule couts: `getAtomCost()` x count → `getTotalCreationCost(0, 0n, total)`
- **Simulation** via `publicClient.simulateContract()` sur `SofiaFeeProxyAbi.createAtoms`
- **Execution** via `walletClient.writeContract()` → `waitForTransactionReceipt()` → check `status === 'success'`
- Map vault IDs depuis le resultat de simulation
- **FALLBACK CRITIQUE (lignes 220-273):** Si batch echoue avec `MultiVault_AtomExists` ou `AtomExists`:
  - Boucle individuelle sur chaque atom
  - Simulate individuellement → execute → wait receipt
  - Si "AtomExists" en individuel: `BlockchainService.calculateAtomId(ipfsUri)` pour recuperer l'ID existant
  - Re-throw pour toute autre erreur

**Methode 4 — `createAtomDirect(atomData, pinnedData, address)` (lignes 279-461, copie exacte):**
- `ensureProxyApproval(address)` en premier
- Pin + validate IPFS URI
- Console.log debug (lignes 307-320, 349-356) — **GARDER tel quel** pour le moment
- `getAtomCost()` + `getTotalCreationCost()`
- Check `checkAtomExists()` → return early si deja la
- `calculateAtomId(ipfsUri)` pour comparaison pre/post simulation
- Simulate → execute (avec `gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS`) → wait receipt
- **Detection mismatch** simulated vs expected vault ID (log info, pas d'erreur)
- **Fallback AtomExists** dans simulation: `calculateAtomId()` → return `txHash: 'existing'`
- Catch externe: wrap dans `ERROR_MESSAGES.ATOM_CREATION_FAILED`

**Methode 5 — `createAtomsBatch(atomsData, address, pinningFn)` (lignes 463-613, copie exacte):**
- `ensureProxyApproval()` en premier
- Pin tous en parallele via `Promise.all(atomsData.map(a => pinningFn(...)))`
- Check existence en parallele
- **Traitement SEQUENTIEL** (pas batch): boucle for...of sur newAtoms
  - Chaque atom: encode hex → simulate single → execute single → wait receipt
  - Fallback `AtomExists`: `calculateAtomId()`
- Log counts final

**Ce qui reste dans le hook (lignes 29-32, 615-622):**
```typescript
export const useCreateAtom = () => {
  const { mutateAsync: pinThing } = usePinThingMutation()  // React Query
  const { walletAddress: address } = useWalletFromStorage() // React hook
  return {
    ensureProxyApproval: () => atomService.ensureProxyApproval(address),
    pinAtomToIPFS: (data) => atomService.pinAtomToIPFS(data, pinThing),
    createAtomsFromPinned: (pinned) => atomService.createAtomsFromPinned(pinned, address),
    createAtomWithMultivault: async (data) => {
      const pinned = await atomService.pinAtomToIPFS(data, pinThing)
      return atomService.createAtomDirect(data, pinned, address)
    },
    createAtomsBatch: (dataList) => atomService.createAtomsBatch(dataList, address, pinThing)
  }
}
```

**Dependencies du service (pas de React):**
- `getClients` (viem), `stringToHex` (viem)
- `MultiVaultAbi`, `SofiaFeeProxyAbi`
- `SELECTED_CHAIN`, `BLOCKCHAIN_CONFIG`, `ERROR_MESSAGES`
- `BlockchainService` (singleton)
- `chrome.storage.local` (API browser)
- `createServiceLogger`

---

### 2.2 Creer `lib/services/TripleService.ts`

**Source:** `hooks/useCreateTripleOnChain.ts` (766 lignes) → service (~650 lignes) + hook (~80 lignes)

**Constantes a deplacer dans le service (lignes 15-19):**
```typescript
const MIN_TRIPLE_DEPOSIT = 10000000000000000n  // 0.01 TRUST (16 decimals)
const CREATION_CURVE_ID = 1n                    // linear bonding curve (creation)
// Note: deposits utilisent curveId = 2n (progressive) — hardcode dans les methodes deposit
```

**Methode statique 1 — `getUserAtom(address)` (lignes 31-43, copie exacte):**
- Valide `address` exists, sinon throw "No wallet connected"
- Return `{ vaultId: SUBJECT_IDS.I, success: true, ipfsUri: '', name: 'I' }`

**Methode statique 2 — `getPredicateIdIfExists(predicateName)` (lignes 46-83, copie exacte):**
- Chain de `if` sur le nom du predicat:
  - `'follow'` → `PREDICATE_IDS.FOLLOW`
  - `'trusts'` → `PREDICATE_IDS.TRUSTS`
  - `'distrust'` → `PREDICATE_IDS.DISTRUST || null`
  - 6 intentions: `'visits for work'` → `PREDICATE_IDS.VISITS_FOR_WORK`, etc.
  - `'like'` → `PREDICATE_IDS.LIKE || null`
  - `'dislike'` → `PREDICATE_IDS.DISLIKE || null`
  - default → `null`

**Methode privee 3 — `executeTransaction(txParams)` (lignes 86-96, copie exacte):**
- Cast `address`/`account` en Viem `Address`
- `getClients()` → `walletClient.writeContract(viemParams)`
- Return `Hash`

**Methode 4 — `createTripleOnChain(subjectId, predicateId, objectId, address, customWeight?)` (lignes 98-337):**
- **NOTE:** Dans le service, les IDs sont deja resolus (pas de pin/create). Le hook resout les IDs avant d'appeler le service.
- Check `BlockchainService.checkTripleExists(subjectId, predicateId, objectId)`
- **Path A — Triple existe (deposit, lignes 175-241):**
  - `getClients()`, `getContractAddress()`, `getTripleCost()`
  - `depositAmount = customWeight ?? feeCost`
  - `curveId = 2n` (progressive, PAS `CREATION_CURVE_ID`)
  - `getTotalDepositCost(depositAmount)` — inclut Sofia fees
  - Simulate `SofiaFeeProxyAbi.deposit([address, tripleVaultId, curveId, minShares=0n])`
  - Execute avec `maxFeePerGas`, `maxPriorityFeePerGas` depuis `BLOCKCHAIN_CONFIG`
  - Wait receipt → check `status === 'success'`
  - Return `{ source: 'deposit', tripleVaultId, ... }`
- **Path B — Triple n'existe pas (create, lignes 242-331):**
  - `tripleCost = getTripleCost()`
  - `depositAmount = customWeight ?? MIN_TRIPLE_DEPOSIT`
  - `multiVaultCost = tripleCost + depositAmount`
  - `totalCost = getTotalCreationCost(1, depositAmount, multiVaultCost)`
  - Pre-calcul `tripleId` via `publicClient.readContract(MultiVaultAbi.calculateTripleId)`
  - Console.log debug (lignes 267-275, 287, 289) — **GARDER tel quel**
  - Simulate `SofiaFeeProxyAbi.createTriples([address, [subjectId], [predicateId], [objectId], [depositAmount], CREATION_CURVE_ID])`
  - Execute via `executeTransaction()` → wait receipt → check status
  - Return `{ source: 'created', tripleVaultId: tripleId, ... }`
- **Error catch (lignes 332-336):** Wrap dans `ERROR_MESSAGES.TRIPLE_CREATION_FAILED`

**Methode 5 — `createTriplesBatch(resolvedTriples, address)` (lignes 340-760):**
- **Input change:** Recoit des `{ subjectId, predicateId, objectId, customWeight? }[]` au lieu de `BatchTripleInput[]`
- **Deduplication O(1)** via `Set<string>` avec cle `${sub}-${pred}-${obj}`
- Check existence de chaque triple via `BlockchainService.checkTripleExists()`
- Separe en `triplesToCreate[]` et `triplesToDeposit[]`
- **Batch create (lignes 499-668):**
  - Build arrays: `subjectIds[]`, `predicateIds[]`, `objectIds[]`, `depositAmounts[]`
  - `depositAmount[i] = customWeight || MIN_TRIPLE_DEPOSIT` pour chacun
  - Cost: `(tripleCost x count) + totalDeposit` → `getTotalCreationCost(depositCount, totalDeposit, multiVaultCost)`
  - Simulate batch → execute → wait receipt → extract tripleIds from simulation result
  - **FALLBACK TripleExists (lignes 575-667):** Si batch echoue avec `MultiVault_TripleExists`:
    - Boucle individuelle: `calculateTripleId()` → `getTotalDepositCost()` → simulate deposit → execute → wait receipt
    - Chaque triple convertie en deposit individuel
    - Re-throw si l'erreur n'est PAS TripleExists
- **Individual deposits (lignes 672-741):**
  - Boucle sequentielle sur `triplesToDeposit`
  - `curveId = 2n` (progressive)
  - `depositAmount = customWeight || MIN_TRIPLE_DEPOSIT`
  - Simulate → execute → wait receipt pour chacun
- **Return:** `BatchTripleResult { success, results[], txHash, failedTriples: [], createdCount, depositCount }`

**Ce qui reste dans le hook:**
```typescript
export const useCreateTripleOnChain = () => {
  const { pinAtomToIPFS, createAtomsFromPinned, ensureProxyApproval } = useCreateAtom()
  const { walletAddress: address } = useWalletFromStorage()

  // Resolution des atoms (utilise les hooks React de useCreateAtom)
  const resolvePredicateId = async (name) => {
    const existing = tripleService.getPredicateIdIfExists(name)
    if (existing) return existing
    const pinned = await pinAtomToIPFS({ name, description: `Predicate: ${name}`, url: '' })
    const atoms = await createAtomsFromPinned([pinned])
    return atoms[name].vaultId
  }

  const resolveObjectId = async (objectData) => {
    const pinned = await pinAtomToIPFS(objectData)
    const atoms = await createAtomsFromPinned([pinned])
    return atoms[objectData.url || objectData.name].vaultId
  }

  return {
    createTripleOnChain: async (predicateName, objectData, customWeight?) => {
      await ensureProxyApproval()
      const userAtom = tripleService.getUserAtom(address)
      const predicateId = await resolvePredicateId(predicateName)
      const objectId = await resolveObjectId(objectData)
      return tripleService.createTripleOnChain(userAtom.vaultId, predicateId, objectId, address, customWeight)
    },
    createTriplesBatch: async (inputs) => {
      await ensureProxyApproval()
      const userAtom = tripleService.getUserAtom(address)
      // Collect + dedup unique atoms, pin + create
      const uniquePredicates = new Set(inputs.map(i => i.predicateName))
      const uniqueObjects = new Map(inputs.map(i => [i.objectData.url || i.objectData.name, i.objectData]))
      // ... resolution des atoms (meme logique que lignes 375-430)
      const resolvedTriples = inputs.map(i => ({
        subjectId: userAtom.vaultId,
        predicateId: resolvedPredicateIds.get(i.predicateName),
        objectId: resolvedObjectIds.get(i.objectData.url || i.objectData.name),
        customWeight: i.customWeight
      }))
      return tripleService.createTriplesBatch(resolvedTriples, address)
    }
  }
}
```

**Dependencies du service (pas de React):**
- `getClients` (viem)
- `MultiVaultAbi`, `SofiaFeeProxyAbi`
- `SELECTED_CHAIN`, `BLOCKCHAIN_CONFIG`, `ERROR_MESSAGES`, `PREDICATE_IDS`, `SUBJECT_IDS`
- `BlockchainService` (singleton)
- `createServiceLogger`

---

### 2.3 Simplifier `useVoteOnTriple.ts` (274 lignes → ~80 lignes)

**Logique qui DELEGUE au TripleService (copie supprimee du hook):**

| Lignes source | Logique actuelle | Remplacement |
|---|---|---|
| 83-101 | Resolution predicate like/dislike | `tripleService.getPredicateIdIfExists(voteType)` — si null, pin+create via `useCreateAtom` |
| 105-106 | Subject=I, Object=tripleTermId | `tripleService.getUserAtom(address).vaultId` + `tripleTermId` directement |
| 109-113 | Check triple exists | Delegue a `tripleService.createTripleOnChain()` qui fait le check en interne |
| 118-173 | Deposit path (simulate+execute+receipt) | Delegue a `tripleService.createTripleOnChain()` path A |
| 174-239 | Create path (simulate+execute+receipt) | Delegue a `tripleService.createTripleOnChain()` path B |

**ATTENTION — Differences a preserver:**
- **`VOTE_STAKE = 1000000000000000000n`** (1 TRUST) vs `MIN_TRIPLE_DEPOSIT = 10000000000000000n` (0.01 TRUST). Le vote utilise un montant different → passer comme `customWeight` au service
- **Deposit curveId = 1n** dans vote (ligne 133) vs **curveId = 2n** dans tripleService. **A verifier dans le code source actuel** pour decider si c'est intentionnel.

**Ce qui RESTE dans le hook (React + side effects):**
```typescript
// 4 useState: loading, error, success, votingTripleId
// useCallback vote() qui:
//   1. Set loading state
//   2. ensureProxyApproval()
//   3. Resolve predicate ID (via getPredicateIdIfExists ou pin+create)
//   4. tripleService.createTripleOnChain(subjectId, predicateId, tripleTermId, address, VOTE_STAKE)
//   5. questTrackingService.recordVoteActivity()  ← side effect
//   6. goldService.addVoteGold(address, dailyCount) ← side effect
//   7. Set success/error/loading states
// useCallback reset() qui clear tous les states
```

---

## Phase 3 — Service MCP et Analyse d'Interets

**Source:** `hooks/useInterestAnalysis.ts` (582 lignes) → 2 services + hook (~70 lignes)

### 3.1 Creer `lib/services/MCPService.ts` (~120 lignes)

**Logique reseau/protocole extraite, copiee telle quelle:**

**Constante:**
```typescript
private readonly serverUrl = process.env.PLASMO_PUBLIC_MCP_URL || 'http://localhost:3001'
```

**Methode privee 1 — `parseSSEResponse(text)` (lignes 191-208, copie exacte):**
- Split par newline, cherche lignes `"data: "`
- Parse JSON du contenu apres `"data: "` (line.slice(6))
- Return premier parse reussi ou null

**Methode privee 2 — `parseResponse(response)` (lignes 213-229, copie exacte):**
- `response.text()` d'abord
- Si commence par `"event:"` ou contient `"\ndata:"` → appelle `parseSSEResponse()`
- Sinon → `JSON.parse(text)`
- Throw si format inconnu (affiche les 100 premiers chars)

**Methode 3 — `initSession()` (lignes 234-263, copie exacte):**
- POST `${serverUrl}/mcp` avec body JSON-RPC 2.0:
  ```
  { jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {},
              clientInfo: { name: 'sofia-extension', version: '1.0.0' } } }
  ```
- Headers: `Content-Type: application/json`, `Accept: application/json, text/event-stream`
- Check `response.ok`, throw si non
- Extrait `sessionId` depuis `response.headers.get('mcp-session-id')`
- Throw si pas de session ID
- Return `{ sessionId }`

**Methode 4 — `callTool(sessionId, toolName, args)` (lignes 268-323, copie exacte):**
- POST `${serverUrl}/mcp` avec header `mcp-session-id: sessionId`
- Body JSON-RPC 2.0: `{ method: 'tools/call', params: { name: toolName, arguments: args } }`
- Check `response.ok`, throw avec status + text si non
- `parseResponse()` pour gerer JSON/SSE
- Extraction du resultat par priorite:
  1. `result.result.content[]` → cherche `type: 'resource'` → `resource.text`
  2. → cherche `type: 'text'` → `text`
  3. Fallback: `result.result` brut
- Return JSON parse ou resultat brut

**Methode 5 — `fetchAccountActivity(accountId)` (lignes 328-343, copie exacte):**
- `initSession()` → `callTool(sessionId, 'get_account_activity', { account_id, predicate_filter: WEB_ACTIVITY_PREDICATES, group_by: 'domain', limit: 500 })`
- Return `AccountActivityResponse`

**`WEB_ACTIVITY_PREDICATES` (ligne 166-173) a importer depuis `predicateConstants.ts` (Phase 1.2)**

### 3.2 Creer `lib/services/InterestAnalysisService.ts` (~150 lignes)

**Logique metier d'analyse extraite, copiee telle quelle:**

**Constante:**
```typescript
const CACHE_KEY_PREFIX = 'sofia_interest_'
```

**Methode 1 — `getCacheKey(accountId)` (lignes 39-41):**
- Return `${CACHE_KEY_PREFIX}${accountId.toLowerCase()}`

**Methode 2 — `loadCachedInterest(accountId)` (lignes 46-57, copie exacte):**
- `localStorage.getItem(getCacheKey(accountId))`
- `JSON.parse()` → return `CachedInterestData | null`
- Catch: log warning, return null (NE PAS throw)

**Methode 3 — `saveCachedInterest(accountId, data)` (lignes 62-69, copie exacte):**
- `localStorage.setItem(getCacheKey(accountId), JSON.stringify(data))`
- Log count
- Catch: log warning (NE PAS throw)

**Methode 4 — `areInterestNamesSimilar(n1, n2)` (lignes 75-93, copie exacte):**
- Lowercase les deux
- Check 1: `n1 === n2` → true
- Check 2: `n1.includes(n2) || n2.includes(n1)` → true (substring)
- Check 3: Premier mot de chaque, si egaux ET longueur > 4 → true
- Sinon → false

**Methode 5 — `findSimilarInterestIndex(interests, newName)` (lignes 99-106):**
- Boucle sur interests[], return premier index ou `areInterestNamesSimilar` → true
- Return -1 si aucun

**Methode 6 — `mergeInterests(cached, newInterests)` (lignes 114-163, copie exacte):**
- Demarre avec `[...cached]`
- Pour chaque newInterest:
  - `findSimilarInterestIndex()` dans merged
  - **Si trouve:**
    - Merge domains: `[...new Set([...existing.domains, ...new.domains])]`
    - Merge certifications: `Math.max()` par categorie (work, learning, fun, inspiration, buying, music)
    - Recalcule: `totalCerts = sum(breakdown)`, `xp = totalCerts * XP_PER_CERTIFICATION`, `level = calculateLevel(xp)`
    - Garde le nom le plus court: `existing.name.length <= new.name.length ? existing : new`
  - **Si pas trouve:** Push tel quel
- Return merged

**Methode 7 — `mapPredicatesToCertifications(predicates)` (lignes 348-359, copie exacte):**
- Map: `'visits for work'` → `work`, `'visits for learning'` + `'visits for learning '` (legacy) → `learning`, etc.
- Return `CertificationBreakdown`

**Methode 8 — `analyzeWithAgent(activityData)` (lignes 364-416, copie exacte):**
- Prepare input: map groups → `{ key, count, predicates }`
- `callMastraAgent('skillsAnalysisAgent', JSON.stringify(agentInput))`
- Pour chaque skill retourne par l'agent:
  - Init empty certifications
  - Pour chaque domain du skill → trouve le group correspondant → `mapPredicatesToCertifications()` → sum
- Return `{ skills, summary }`

**Ce qui reste dans le hook (~70 lignes):**
```typescript
// useState: interests, summary, totalPositions, isLoading, error, analyzedAt, currentAccountId
// loadFromCache(accountId) → interestAnalysisService.loadCachedInterest() → set state
// analyzeInterests(accountId):
//   1. loadFromCache pour etat initial
//   2. mcpService.fetchAccountActivity(accountId)
//   3. interestAnalysisService.analyzeWithAgent(activityData)
//   4. enrichInterest() sur chaque skill
//   5. interestAnalysisService.mergeInterests(cached, enriched)
//   6. interestAnalysisService.saveCachedInterest()
//   7. Set state final
// reset() → clear state
// useEffect pour init cache au mount
```

---

## Phase 4 — Utilitaires de calcul

### 4.1 Creer `lib/utils/discoveryUtils.ts` (~120 lignes)

**Source:** `hooks/useDiscoveryScore.ts` lignes 188-279 — fonctions pures de calcul

**Fonction 1 — `buildPagePositionMap(allTriples)` (lignes 188-214, copie exacte):**
- Cree `Map<objectTermId, { accountId: string, createdAt: string }[]>`
- Pour chaque triple dans allTriples:
  - `objectId = triple.object?.term_id`
  - Itere les positions, ajoute `{ accountId: pos.account_id?.toLowerCase(), createdAt: pos.created_at }`
  - Check unicite par `accountId` (pas de doublons par page)
- Trie chaque array par `createdAt` ASC (meme si deja trie par GraphQL)
- Return la Map

**Fonction 2 — `calculateDiscoveryRanking(userTriples, pagePositionMap, userAddress)` (lignes 216-260, copie exacte):**
- Init compteurs: `pioneerCount=0, explorerCount=0, contributorCount=0`
- Init breakdowns:
  - `intentionBreakdown: Record<IntentionPurpose, number>` (for_work, for_learning, etc. = 0)
  - `trustBreakdown: { trusted: 0, distrusted: 0 }`
- `processedPages = new Set<string>()` pour eviter double-comptage
- Pour chaque triple dans userTriples:
  - `objectId = triple.object?.term_id`, `predicateLabel = triple.predicate?.label`
  - **Intention mapping:** `PREDICATE_LABEL_TO_INTENTION[predicateLabel]` → increment breakdown
  - **Trust mapping:** `PREDICATE_LABEL_TO_TRUST[predicateLabel]` → increment breakdown
  - Skip si `processedPages.has(objectId)` (deja compte)
  - `pagePositions = pagePositionMap.get(objectId) || []`
  - `userRank = pagePositions.findIndex(p => p.accountId === userAddress) + 1`
  - `rank === 1` → pioneer++, `rank <= 10` → explorer++, `rank > 0` → contributor++
- Return `{ pioneerCount, explorerCount, contributorCount, totalCertifications: processedPages.size, intentionBreakdown, trustBreakdown }`
- **Utilise `PREDICATE_LABEL_TO_INTENTION` et `PREDICATE_LABEL_TO_TRUST` de Phase 1.2**

**Fonction 3 — `calculateDiscoveryGold(ranking)` (lignes 262-279, copie exacte):**
- `fromPioneer = ranking.pioneerCount * DISCOVERY_GOLD_REWARDS.PIONEER` (50)
- `fromExplorer = ranking.explorerCount * DISCOVERY_GOLD_REWARDS.EXPLORER` (20)
- `fromContributor = ranking.contributorCount * DISCOVERY_GOLD_REWARDS.CONTRIBUTOR` (10)
- Return `{ fromPioneer, fromExplorer, fromContributor, total: sum }`

**Fonction 4 — `buildDiscoveryStats(ranking, gold)` (lignes 266-279):**
- Assemble `UserDiscoveryStats` complet = ranking + discoveryGold
- Return l'objet final

### 4.2 Creer `lib/utils/streakUtils.ts` (~100 lignes)

**Source:** `hooks/useStreakLeaderboard.ts` — fonctions pures de calcul

**Fonction 1 — `toDateStr(date)` (ligne 77-79):**
- `d.toISOString().slice(0, 10)` — format YYYY-MM-DD

**Fonction 2 — `calculateStreaks(deposits)` (lignes 32-75, copie exacte):**
- Group par user: `Map<accountId, Set<dateStr>>`
- Pour chaque deposit: `toDateStr(new Date(deposit.created_at))` → ajoute au Set du user
- Pour chaque user: calcule streak en comptant jours consecutifs **backwards** depuis aujourd'hui
  - Commence a `today`, decremente d'un jour, check si dans le Set
  - Arrete au premier jour manquant
- Return `Map<accountId, number>` (streak length)

**Fonction 3 — `buildLeaderboardEntries(positions, ethPrice, streakMap, termIdMap)` (lignes 200-223, copie exacte):**
- Map chaque position → `LeaderboardEntry`
- Calcule valeur en USD: `shares x ethPrice / 10^18`
- Lookup streak dans streakMap, term_id dans termIdMap
- Return `LeaderboardEntry[]`

**Fonction 4 — `filterAndSortByStreak(entries, verifiedWallets)` (lignes 225-246, copie exacte):**
- Filtre: garder seulement les wallets dans verifiedWallets Set
- Trie par streak descendant, puis par valeur descendant
- Return `LeaderboardEntry[]` filtres et tries

---

## Phase 5 — Conversion Singleton Store → Service

### 5.1 Creer `lib/services/DiscoveryScoreService.ts` (~220 lignes)

**Source:** `hooks/useDiscoveryScore.ts` (389 lignes) — le module-level state (lignes 90-134) + toute la logique (lignes 123-375) migrent dans la classe service. Les fonctions pures de calcul (Phase 4.1) sont importees.

**Etat migre dans la classe (actuellement module-level, lignes 90-100):**
```typescript
private sharedState: DiscoveryState = { stats: null, loading: false, error: null, claimedDiscoveryGold: 0 }
private listeners = new Set<() => void>()
private fetchInFlight = false
private currentWallet: string | null = null
private initialized = false
```

**Methode 1 — `subscribe(listener)` (lignes 110-114, copie exacte):**
- Ajoute listener au Set
- Appelle `initializeStore()` si pas encore initialized
- Return fonction unsubscribe

**Methode 2 — `getSnapshot()` (lignes 106-108):**
- Return `this.sharedState`

**Methode 3 — `updateState(partial)` (lignes 116-119):**
- `this.sharedState = { ...this.sharedState, ...partial }`
- Notify tous les listeners

**Methode 4 — `fetchDiscoveryScore(walletAddress)` (lignes 123-307, copie exacte SAUF calculs extraits):**
- Guard `fetchInFlight` — return si deja en cours
- Set `fetchInFlight=true, loading=true`
- **Fetch pagine** via `Promise.all()`:
  - `intuitionGraphqlClient.fetchAllPages(UserIntentionTriplesDocument, { predicateLabels: CERTIFICATION_PREDICATE_LABELS, userAddress })` — limit 100, max 100 pages
  - `intuitionGraphqlClient.fetchAllPages(AllIntentionTriplesDocument, { predicateLabels: CERTIFICATION_PREDICATE_LABELS })` — limit 100, max 100 pages
- Console.log debug (lignes 156-180) — **GARDER tel quel**
- **DELEGUE aux utils Phase 4.1:**
  - `buildPagePositionMap(allTriples)` → Map
  - `calculateDiscoveryRanking(userTriples, map, userAddress.toLowerCase())` → ranking
  - `calculateDiscoveryGold(ranking)` → gold
  - `buildDiscoveryStats(ranking, gold)` → stats
- **Sync Gold (lignes 281-291):** `goldService.setDiscoveryGold(wallet, computedTotal)` si `computedTotal >= storedGold`
- Update state avec stats
- Finally: `fetchInFlight=false`
- **Utilise `CERTIFICATION_PREDICATE_LABELS` de Phase 1.2**

**Methode 5 — `loadClaimedGold(walletAddress)` (lignes 311-321, copie exacte):**
- `chrome.storage.local.get([discovery_gold_${walletAddress}])`
- Update `claimedDiscoveryGold` dans state

**Methode 6 — `claimGold(goldAmount)` (lignes 323-331, copie exacte):**
- Return current claimed si pas de wallet
- `newTotal = current + goldAmount`
- `chrome.storage.local.set({ [key]: newTotal })`
- Update state
- Return newTotal

**Methode 7 — `initializeStore()` (lignes 335-354, copie exacte):**
- Guard `initialized` — return si deja fait
- Set `initialized=true`
- Read wallet depuis `chrome.storage.session.get('walletAddress')`
- `handleWalletChange(wallet)` avec la valeur lue
- Register `chrome.storage.onChanged` listener:
  - Filtre `area === 'session'` et `changes.walletAddress`
  - Appelle `handleWalletChange(changes.walletAddress.newValue)`

**Methode 8 — `handleWalletChange(wallet)` (lignes 356-368, copie exacte):**
- Normalize lowercase, compare avec `currentWallet`
- Si change:
  - Si null: reset state (stats=null, gold=0)
  - Si wallet: `loadClaimedGold()` + `fetchDiscoveryScore()`

**Methode 9 — `refetch()` (lignes 372-375):**
- Return si pas de `currentWallet`
- `fetchDiscoveryScore(currentWallet)`

**Ce qui reste dans le hook (~15 lignes):**
```typescript
export const useDiscoveryScore = () => {
  const state = useSyncExternalStore(
    discoveryScoreService.subscribe.bind(discoveryScoreService),
    discoveryScoreService.getSnapshot.bind(discoveryScoreService)
  )
  return {
    ...state,
    refetch: discoveryScoreService.refetch.bind(discoveryScoreService),
    claimDiscoveryGold: discoveryScoreService.claimGold.bind(discoveryScoreService)
  }
}
```

**Dependencies du service:**
- `intuitionGraphqlClient` + `UserIntentionTriplesDocument` + `AllIntentionTriplesDocument`
- `goldService` (singleton)
- `CERTIFICATION_PREDICATE_LABELS`, `PREDICATE_LABEL_TO_INTENTION`, `PREDICATE_LABEL_TO_TRUST` (de Phase 1.2)
- `buildPagePositionMap`, `calculateDiscoveryRanking`, `calculateDiscoveryGold`, `buildDiscoveryStats` (de Phase 4.1)
- `DISCOVERY_GOLD_REWARDS` (constantes)
- Chrome APIs: `storage.local`, `storage.session`, `storage.onChanged`
- `createServiceLogger`

---

### 5.2 Creer `lib/services/UserCertificationsService.ts` (~280 lignes)

**Source:** `hooks/useUserCertifications.ts` (375 lignes) — le module-level state (lignes 117-147) + toute la logique (lignes 149-325) migrent dans la classe.

**Etat migre dans la classe (actuellement module-level):**
```typescript
private storeState: StoreState = {
  certifications: new Map(),
  loading: false,
  error: null,
  lastFetchedAt: null,
  walletAddress: null
}
private listeners = new Set<() => void>()
private isFetching = false
```

**Methode 1 — `emitChange()` / `subscribe(listener)` / `getSnapshot()`:**
- Identique au pattern DiscoveryScoreService

**Methode 2 — `fetchCertifications(walletAddress)` (lignes 149-308, copie exacte):**
- Guards: pas de wallet → clear cache; pas de predicates → clear; deja fetching → skip
- Set `isFetching=true, loading=true`
- **Fetch pagine:**
  - `intuitionGraphqlClient.fetchAllPages(UserAllCertificationsDocument, { predicateIds: ALL_PREDICATE_IDS, predicateLabels: ALL_PREDICATE_LABELS, userAddress: walletAddress.toLowerCase() })`
  - limit 100, max 100 pages
- **Processing de chaque triple (lignes 200-272, LOGIQUE CRITIQUE a preserver exactement):**
  - `objectLabel = triple.object?.label || ''`
  - `predicateLabel = triple.predicate?.label || ''`
  - Classification: `intention = PREDICATE_LABEL_TO_INTENTION[predicateLabel]`, `isOAuth = OAUTH_PREDICATE_LABELS.includes(predicateLabel)`, `isTrust = predicateLabel in TRUST_LABEL_TO_TYPE`
  - Skip si pas d'objectLabel OU aucun type ne match
  - **Normalisation URL (lignes 216-238) — preservee exactement:**
    - Priorite: `triple.object?.value?.thing?.url` (new atoms) → sinon objectLabel (old atoms)
    - Si URL: `normalizeUrl(objectUrl)` avec catch → fallback manual:
      - `replace(/^https?:\/\//)`, `replace(/^www\./)`, `replace(/\/$/)`, lowercase
    - `isRootDomain = !normalizedLabel.includes('/')`
  - Build `TripleDetail { tripleTermId, shares, predicateLabel }`
  - **Merge dans Map (lignes 248-271):**
    - Si entry existe: push intention/oauth/trust dans arrays si pas deja present + push tripleDetail
    - Si pas d'entry: cree `CertificationEntry { label, intentions[], oauthPredicates[], trustPredicates[], isRootDomain, triples[] }`
- Update state avec `certifications Map, loading=false, lastFetchedAt=Date.now(), walletAddress`
- Debug logging (lignes 283-298)
- Finally: `isFetching=false, emitChange()`
- **Utilise `ALL_PREDICATE_IDS`, `ALL_PREDICATE_LABELS`, `PREDICATE_LABEL_TO_INTENTION`, `OAUTH_PREDICATE_LABELS`, `TRUST_LABEL_TO_TYPE` de Phase 1.2**

**Methode 3 — `clearCache()` (lignes 310-319, copie exacte):**
- Reset tous les champs du state a leurs valeurs par defaut
- `emitChange()`

**Methode statique 4 — `getCertificationForUrl(certifications, url)` (lignes 363-373, copie exacte):**
- `normalizeUrl(url)` → lookup dans Map
- Return `CertificationEntry | null`
- Catch: return null

**Ce qui reste dans le hook (~30 lignes):**
```typescript
export const useUserCertifications = (walletAddress?: string) => {
  const state = useSyncExternalStore(
    userCertificationsService.subscribe.bind(userCertificationsService),
    userCertificationsService.getSnapshot.bind(userCertificationsService)
  )
  const storeWalletRef = useRef(state.walletAddress)
  storeWalletRef.current = state.walletAddress

  useEffect(() => {
    if (walletAddress && walletAddress !== storeWalletRef.current) {
      userCertificationsService.fetchCertifications(walletAddress)
    } else if (!walletAddress && storeWalletRef.current) {
      userCertificationsService.clearCache()
    }
  }, [walletAddress])

  const refetch = useCallback(async () => {
    if (walletAddress) await userCertificationsService.fetchCertifications(walletAddress)
  }, [walletAddress])

  return { ...state, refetch }
}
// Export helper
export const getCertificationForUrl = UserCertificationsService.getCertificationForUrl
```

**Dependencies du service:**
- `intuitionGraphqlClient` + `UserAllCertificationsDocument`
- `normalizeUrl` (de `~/lib/utils`)
- `ALL_PREDICATE_IDS`, `ALL_PREDICATE_LABELS`, `PREDICATE_LABEL_TO_INTENTION`, `OAUTH_PREDICATE_LABELS`, `TRUST_LABEL_TO_TYPE` (de Phase 1.2)
- `createServiceLogger`

---

## Resume des fichiers

### Nouveaux fichiers (10)

| Fichier | Phase | Lignes estimees |
|---|---|---|
| `lib/utils/domainUtils.ts` | 1.1 | ~40 |
| `lib/config/predicateConstants.ts` | 1.2 | ~120 |
| `lib/utils/discoveryUtils.ts` | 4.1 | ~100 |
| `lib/utils/streakUtils.ts` | 4.2 | ~80 |
| `lib/services/AtomService.ts` | 2.1 | ~450 |
| `lib/services/TripleService.ts` | 2.2 | ~600 |
| `lib/services/MCPService.ts` | 3.1 | ~100 |
| `lib/services/InterestAnalysisService.ts` | 3.2 | ~120 |
| `lib/services/DiscoveryScoreService.ts` | 5.1 | ~200 |
| `lib/services/UserCertificationsService.ts` | 5.2 | ~250 |

### Fichiers modifies (15+)

| Fichier | Phase | Changement |
|---|---|---|
| `lib/utils/formatters.ts` | 1.5 | + `formatBalance()` |
| `lib/utils/certificationHelpers.ts` | 1.6 | + `calculateDominantCertification()`, `sumCertifications()` |
| `lib/utils/index.ts` | toutes | + barrel exports nouveaux utils |
| `lib/services/index.ts` | 2-5 | + barrel exports nouveaux services |
| `lib/services/GoldService.ts` | 1.4 | Supprimer `getKey()`, utiliser `getWalletKey` |
| `lib/services/XPService.ts` | 1.4 | Supprimer `getKey()`, utiliser `getWalletKey` |
| `lib/services/CurrencyMigrationService.ts` | 1.4 | Supprimer `getKey()`, utiliser `getWalletKey` |
| `lib/services/GroupManager.ts` | 1.6 | Utiliser `calculateDominantCertification` |
| `lib/services/LevelUpService.ts` | 1.6 | Utiliser `calculateDominantCertification`, `sumCertifications` |
| `hooks/useCreateAtom.ts` | 2.1 | 623 → ~50 lignes |
| `hooks/useCreateTripleOnChain.ts` | 2.2 | 766 → ~80 lignes |
| `hooks/useVoteOnTriple.ts` | 2.3 | 274 → ~60 lignes |
| `hooks/useInterestAnalysis.ts` | 3 | 582 → ~60 lignes |
| `hooks/useDiscoveryScore.ts` | 5.1 | 389 → ~15 lignes |
| `hooks/useUserCertifications.ts` | 5.2 | 375 → ~30 lignes |
| 6+ hooks (Phase 1) | 1.1-1.2 | Supprimer constantes locales |

---

## Verification et commits

Apres **chaque phase**, on fait une pause :
1. `cd extension && pnpm dev` — verifier la compilation
2. Tester manuellement les fonctionnalites impactees dans l'extension
3. Verifier les barrel file imports (`~/lib/utils`, `~/lib/services`, `~/lib/config`)
4. **Commit** avec un message descriptif
5. **Attendre la validation** avant de passer a la phase suivante

### Messages de commit prevus

| Phase | Message de commit |
|---|---|
| Phase 1 | `refactor: deduplicate utils — domainUtils, predicateConstants, getFaviconUrl, getWalletKey, formatBalance, certificationHelpers` |
| Phase 2 | `refactor: extract blockchain logic to AtomService and TripleService, simplify useCreateAtom, useCreateTripleOnChain, useVoteOnTriple` |
| Phase 3 | `refactor: extract MCPService and InterestAnalysisService from useInterestAnalysis` |
| Phase 4 | `refactor: extract pure calculation utils — discoveryUtils, streakUtils` |
| Phase 5 | `refactor: convert singleton stores to services — DiscoveryScoreService, UserCertificationsService` |

---

## Ordre d'execution

1. **Phase 1** — Quick wins, zero risque, extractions de fonctions pures → commit + pause
2. **Phase 2** — Plus gros impact (2000+ lignes), tester blockchain ops → commit + pause
3. **Phase 4** — Extractions de calculs purs (peut etre fait en parallele) → commit + pause
4. **Phase 3** — Service MCP + interets, tester le flow end-to-end → commit + pause
5. **Phase 5** — Singleton stores → services (le plus delicat) → commit + pause
