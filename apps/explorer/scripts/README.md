# Sofia Platform Atoms — Guide de creation

## Contexte

Chaque plateforme du dashboard Sofia doit exister comme un **atom** sur le protocole Intuition.
Chaque atom plateforme est ensuite lie a ses categories via des **triples** :

```
[atom plateforme] —has tag→ [atom categorie]
```

Le predicate "has tag" existe deja :
`0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5`

## Ce qui a ete fait

| Etape | Status |
|-------|--------|
| Catalog 142 plateformes avec `website` URL | Done |
| Favicons telecharges dans `public/favicons/` | Done |
| Champ `website` ajoute au type `PlatformConfig` | Done |
| Script `create-platform-atoms.mjs` | Done |
| Boutons contextuels dans PlatformGrid (Connect/Link Wallet/Add Username/Analyze) | Done |
| Trending agrege par plateforme | Done |
| Buy/Sell sur trending cards | En attente des atoms |
| P&L sur trending cards | En attente des atoms |

## Atoms a creer

### Categories (14 atoms)

| ID | Label |
|----|-------|
| tech-dev | Tech & Dev |
| design-creative | Design & Visual Arts |
| music-audio | Music & Audio |
| gaming | Gaming |
| web3-crypto | Web3 & Crypto |
| science | Science & Knowledge |
| sport-health | Sport & Health |
| video-cinema | Video & Cinema |
| entrepreneurship | Entrepreneurship & Business |
| performing-arts | Performing Arts |
| nature-environment | Nature & Environment |
| food-lifestyle | Food, Fashion & Lifestyle |
| literature | Literature & Writing |
| personal-dev | Personal Development |

### Plateformes (142 atoms)

Toutes les plateformes de `src/config/platformCatalog.ts`.
Chaque atom est pin sur IPFS avec : `name`, `description`, `image` (favicon), `url` (website).

### Triples (~250)

Chaque plateforme a 1 a 5 categories (`targetDomains`).
Un triple `[plateforme] has tag [categorie]` est cree pour chaque association.

## Marche a suivre

### 1. Estimer le cout

```bash
PRIVATE_KEY=0xTaClePrivee pnpm node scripts/create-platform-atoms.mjs --estimate
```

Affiche le cout total en TRUST (atoms + triples + fees).
Necessite du TRUST sur le wallet correspondant a la cle privee.

### 2. Dry run (pin IPFS sans transactions)

```bash
pnpm node scripts/create-platform-atoms.mjs --dry-run
```

Pin les 156 atoms (14 categories + 142 plateformes) sur IPFS.
Les URIs sont cachees dans `scripts/.pin-cache.json`.
Aucune transaction on-chain.

### 3. Creer les atoms et triples

```bash
PRIVATE_KEY=0xTaClePrivee pnpm node scripts/create-platform-atoms.mjs
```

Le script :
1. Pin sur IPFS (ou utilise le cache du dry-run)
2. Cree les atoms en batch de 20 via `createAtoms` sur le SofiaFeeProxy
3. Cree les triples en batch de 20 via `createTriples`
4. Cache les resultats dans `scripts/.pin-cache.json`

Si le script crash ou s'arrete : **relance-le**, il reprend ou il en etait grace au cache.

### 4. Options du script

| Option | Description |
|--------|-------------|
| `--dry-run` | Pin IPFS seulement, pas de transactions |
| `--estimate` | Calcule et affiche le cout total, puis s'arrete |
| `--skip-pin` | Skip le pinning IPFS (utilise le cache) |
| `--batch=N` | Taille des batches (defaut: 20) |

### 5. Apres la creation

Une fois les atoms crees :
- Les **Buy/Sell** buttons dans les trending cards fonctionneront (ils resolvent l'atom par label + creator_id)
- Le **P&L** s'affichera pour les utilisateurs qui ont des positions
- Le `domainTrendingService.ts` utilise `resolvePlatformAtom()` pour trouver le `termId` de chaque plateforme

## Architecture technique

```
pinThing(GraphQL) → IPFS URI
    ↓
stringToHex(uri) → encodedData
    ↓
SofiaFeeProxy.createAtoms(receiver, [data], [deposits], curveId)
    ↓
atomIds[] ← bytes32 IDs retournes
    ↓
SofiaFeeProxy.createTriples(receiver, [subjectIds], [predicateIds], [objectIds], [deposits], curveId)
```

| Parametre | Valeur |
|-----------|--------|
| RPC | `https://rpc.intuition.systems` |
| Chain ID | 1155 (Intuition Mainnet) |
| Token natif | TRUST |
| GraphQL | `https://mainnet.intuition.sh/v1/graphql` |
| SofiaFeeProxy | `0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c` |
| Predicate "has tag" | `0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5` |
| Curve ID | 1 (linear) |

## Fichiers importants

| Fichier | Role |
|---------|------|
| `scripts/create-platform-atoms.mjs` | Script de creation |
| `scripts/.pin-cache.json` | Cache des pins IPFS + atom IDs + triple IDs |
| `src/config/platformCatalog.ts` | Catalogue des 142 plateformes |
| `src/config/taxonomy.ts` | 14 domaines / 88 categories / 300+ niches |
| `src/types/reputation.ts` | Type `PlatformConfig` avec champ `website` |
| `src/services/domainTrendingService.ts` | Resolution des atoms pour Buy/Sell |
