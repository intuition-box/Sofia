# Plan — Plateformes non-OAuth (public, api_key, siwe, siwf, none)

> Date : 17 avril 2026
> Cible : `core/sofia-mastra/` + `sofia-explorer/`
> Prerequis : OAuth base fonctionne (cf. `plan-oauth-routes.md`)

---

## 1. Pourquoi ce plan

Sur 137 plateformes au catalogue, **53 ne sont PAS OAuth** :

- **24 public** — APIs publiques (chess.com, ens, wikipedia, etc.)
- **5 api_key** — cle d'API backend (opensea, itch.io, etc.)
- **2 siwe** — Sign-In with Ethereum (wallet-siwe, lens)
- **1 siwf** — Sign-In with Farcaster (farcaster)
- **18 none** — auto-connect ou pas d'API utile (netflix, bandcamp, etc.)

Chaque type necessite sa propre strategie. Ce plan definit ce qui doit exister pour chaque.

---

## 2. Deux familles de plateformes publiques

Parmi les 24 plateformes `public`, il y a **deux sous-familles** qui necessitent des strategies differentes :

### 2.1 — Verification on-chain (pas de challenge)

Le user a deja un wallet connecte. Ces plateformes lisent des donnees blockchain — on n'a besoin de RIEN du user (ni username, ni bio challenge).

| Plateforme | ID          | Source on-chain                                 |
| ---------- | ----------- | ----------------------------------------------- |
| ENS        | `ens`       | Mainnet Ethereum — lookup `resolver.name(addr)` |
| Lido       | `lido`      | Mainnet — wstETH/stETH balance                  |
| Aave       | `aave`      | Multi-chain — Aave subgraph                     |
| Uniswap    | `uniswap`   | The Graph subgraphs                             |
| Snapshot   | `snapshot`  | Snapshot Hub GraphQL `/graphql`                 |
| The Graph  | `the-graph` | Custom subgraphs                                |

**Stratégie** : Connexion = auto-connect (comme `authType: none`), backend va direct chercher les donnees avec `walletAddress`.

**Implementation** :

- Ajouter un fetcher par plateforme qui prend juste `walletAddress` au lieu d'un token
- Ajouter ces plateformes dans `SIGNAL_FETCHERS` registry avec une signature differente : `(walletAddress: string) => Promise<Metrics>`
- Cote Explorer : bouton "Connect" fait juste un `updateConnection(platformId, { status: 'connected' })` sans popup

### 2.2 — Verification username + challenge (proof of ownership)

Le user doit prouver qu'il est bien proprietaire du compte. Deux patterns :

#### Pattern A — Challenge code dans la bio

Pour les plateformes ou le user peut editer sa bio/profil :

- chess.com, leetcode, letterboxd, duolingo, openstreetmap, etc.

**Flow existant (deja dans `oauthService.ts`)** :

1. User clique "Connect" + entre son username
2. `requestChallenge(platformId, username)` → backend genere un code unique
3. User colle le code dans sa bio sur la plateforme
4. `verifyChallengeCode(platformId)` → backend check la bio → confirme

**MAIS** : pas de routes mastra pour ca ! Il faut les creer.

#### Pattern B — Pas de challenge (username suffit)

Pour les plateformes ou le username expose deja des donnees publiques utiles sans risque d'usurpation :

- Wikipedia (`user contributions` visible publiquement)
- HackerNews (pas d'impact si on "vole" un username — les donnees sont agregees)
- arxiv, pubmed, google-scholar (publications liees au nom)
- OpenFoodFacts, openlibrary (contributions)

**Strategie** : demander juste le username, pas de challenge, juste stocker pour fetch ulterieur.

**Tradeoff** : moins securise (on ne verifie pas que le user possede vraiment le compte), mais ok pour un MVP car l'impact de l'usurpation est faible.

---

## 3. Implementation par type

### 3.1 — Public on-chain (6 plateformes)

**Plateformes** : ens, lido, aave, uniswap, snapshot, the-graph

**Fichiers a creer cote mastra** :

```
src/mastra/signals/
├── ens.ts           — lookup ENS via viem
├── lido.ts          — stETH balance via viem
├── aave.ts          — subgraph query
├── uniswap.ts       — The Graph query
├── snapshot.ts      — GraphQL /graphql
└── the-graph.ts     — custom subgraph queries
```

**Modification du workflow** :

Le `signalFetcherWorkflow` actuel cherche un token via `getToken(wallet, platform)`. Pour les on-chain, il faut bypass le lookup token.

```typescript
// Dans signal-fetcher-workflow.ts
const ONCHAIN_PLATFORMS = new Set([
  'ens',
  'lido',
  'aave',
  'uniswap',
  'snapshot',
  'the-graph',
])

if (ONCHAIN_PLATFORMS.has(platform)) {
  // Pas de token necessaire
  const fetcher = ONCHAIN_FETCHERS[platform]
  const metrics = await fetcher(walletAddress)
  return { success: true, platformId: platform, metrics, fetchedAt: Date.now() }
}

// Flow existant avec token
const tokenRow = await getToken(walletAddress, platform)
// ...
```

**Cote Explorer** :

Ajouter ces plateformes dans `usePlatformConnections.ts` dans la branche "auto" :

```typescript
// Dans connect() :
if (strategy === 'auto' || ONCHAIN_AUTOCONNECT.has(platformId)) {
  updateConnection(platformId, {
    status: 'connected',
    connectedAt: Date.now(),
    userId: wallet?.address,
  })
  return
}
```

**Pas de bouton Connect a modifier** — les user n'ont rien a faire, le backend fetche tout seul avec leur adresse wallet.

### 3.2 — Public avec challenge (12 plateformes)

**Plateformes** : chess-com, leetcode, letterboxd, duolingo, openstreetmap, (et autres ou le user peut editer sa bio)

**Fichiers a creer cote mastra** :

```
src/mastra/challenge/
├── types.ts         — types Challenge, ChallengeResult
├── storage.ts       — table challenges (code, wallet, platform, expires_at)
├── routes.ts        — POST /platforms/:id/challenge, POST /platforms/:id/verify
├── verify.ts        — logique de verification bio par plateforme
└── fetchers/        — fetchers qui utilisent le username stocke
    ├── chess-com.ts
    ├── leetcode.ts
    └── ...
```

**Table challenges** (nouvelle) :

```sql
CREATE TABLE IF NOT EXISTS challenges (
  wallet_address TEXT NOT NULL,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  challenge_code TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL,  -- 10 minutes
  verified_at INTEGER,
  PRIMARY KEY (wallet_address, platform)
)
```

**Table usernames** (nouvelle, pour les verifies) :

```sql
CREATE TABLE IF NOT EXISTS platform_usernames (
  wallet_address TEXT NOT NULL,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  verified_at INTEGER NOT NULL,
  PRIMARY KEY (wallet_address, platform)
)
```

**Routes Mastra** (via `registerApiRoute` comme OAuth) :

```
POST /platforms/:platform/challenge
  Body: { walletAddress, username }
  Action:
    1. Generer code (6 chars alphanumeriques genre "SF8K2X")
    2. Stocker { wallet, platform, username, code, expires: now+10min }
    3. Retourner { challengeCode, platformId, username, instruction: "Paste SF8K2X in your bio on X" }

POST /platforms/:platform/verify
  Body: { walletAddress }
  Action:
    1. Lire le challenge en cours pour (wallet, platform)
    2. Verifier expires_at > now
    3. Fetch la bio/profil de la plateforme pour `username`
    4. Chercher le code dans la bio
    5. Si trouve → deplacer vers platform_usernames, supprimer challenge
    6. Retourner { success, platformId, userId, username }
```

**Exemple verify.ts pour chess.com** :

```typescript
export async function verifyChessChallenge(
  username: string,
  code: string,
): Promise<boolean> {
  const res = await fetch(`https://api.chess.com/pub/player/${username}`)
  if (!res.ok) return false
  const data = await res.json()
  return (
    (data.location || '').includes(code) || (data.name || '').includes(code)
  )
}
```

**Fetcher avec username** :

Le `signalFetcherWorkflow` doit savoir quels platforms utilisent username (pas token) :

```typescript
const USERNAME_PLATFORMS = new Set(['chess-com', 'leetcode', ...])

if (USERNAME_PLATFORMS.has(platform)) {
  const row = await getUsername(walletAddress, platform)
  if (!row) return { error: 'not_connected' }
  const fetcher = USERNAME_FETCHERS[platform]
  return { success: true, metrics: await fetcher(row.username) }
}
```

**Cote Explorer** :

Le code existe deja (`requestChallenge`, `verifyChallengeCode` dans `oauthService.ts`, `usePlatformConnections.startChallenge`, `verifyChallengeCode`). Juste corriger les URLs :

```typescript
// Dans oauthService.ts
;`${MASTRA_URL}/api/platforms/${platformId}/challenge` // ← garder /api ? non
`${MASTRA_URL}/platforms/${platformId}/challenge` // ← prefixe custom (comme /oauth/*)
```

Le prefixe `/platforms/*` est dispo (pas reserve par Mastra comme `/api/*`).

### 3.3 — Public sans challenge (6 plateformes)

**Plateformes** : wikipedia, hacker-news, arxiv, pubmed, google-scholar, openfoodfacts, openlibrary

**Strategie** : demander juste le username, pas de verification.

**Flow** :

1. User entre son username dans l'input
2. Frontend POST vers `/platforms/:id/link-username` avec `{ walletAddress, username }`
3. Backend stocke directement dans `platform_usernames`
4. Fetcher utilise le username

**Warning UI** : afficher "Anyone can submit any username here. This is public data only, no ownership verification."

**Simple et rapide a implementer** une fois que Pattern B (challenge) est en place.

### 3.4 — API key (5 plateformes)

**Plateformes** : opensea, itch.io, rawg, semantic-scholar, tracker-gg

**Strategie** : le backend stocke SA PROPRE API key (env var), le user fournit juste son username/wallet.

**Implementation** :

```typescript
// Dans oauth/config.ts, ajouter une section api_key_providers
export const API_KEY_PROVIDERS = {
  opensea: {
    apiKey: process.env.OPENSEA_API_KEY!,
    profileUrl: (addr: string) =>
      `https://api.opensea.io/api/v2/accounts/${addr}`,
    headers: (key: string) => ({ 'X-API-KEY': key }),
  },
  // ...
}
```

**Fetcher** :

```typescript
export async function fetchOpenSeaSignals(
  walletAddress: string,
): Promise<Metrics> {
  const config = API_KEY_PROVIDERS.opensea
  const res = await fetch(config.profileUrl(walletAddress), {
    headers: config.headers(config.apiKey),
  })
  const data = await res.json()
  return {
    nfts_owned: data.owned_count || 0,
    collections: data.collections?.length || 0,
    // ...
  }
}
```

**UI** : meme flow que les on-chain — auto-connect si wallet connecte.

### 3.5 — SIWE / SIWF (3 plateformes)

**Plateformes** : wallet-siwe (Ethereum), lens (Lens Protocol), farcaster

**Strategie** : signature de message avec wallet via Privy.

**Flow** :

```
1. User clique Connect SIWE
2. Frontend demande un nonce au backend
   POST /platforms/:id/siwe/nonce { walletAddress } → { nonce, message }
3. User signe le message avec Privy (signMessage)
4. Frontend envoie signature au backend
   POST /platforms/:id/siwe/verify { walletAddress, signature, message } → { success, userId }
5. Backend verifie signature (viem.verifyMessage)
6. Backend stocke dans platform_usernames: userId = walletAddress
7. Fetcher utilise walletAddress pour fetch
```

**Routes mastra a ajouter** :

```
POST /platforms/:platform/siwe/nonce
POST /platforms/:platform/siwe/verify
```

**Cote Explorer** : `connectWithSIWE` existe deja dans `oauthService.ts`, il faut juste l'appeler depuis le hook.

**Farcaster (SIWF)** : similar mais utilise Farcaster signer au lieu d'une cle Ethereum.

### 3.6 — None (18 plateformes)

**Plateformes** : netflix, disney+, crunchyroll, apple-music, amazon, coursera, udemy, goodreads, substack, researchgate, playstation, xbox, nintendo, imdb, rotten-tomatoes, nike-run-club, bandcamp, telegram

**Strategie** : DEUX sous-cas :

**Sub-case A — Public API dispo (5 plateformes)** :
Bandcamp, Telegram (bots), Udemy, Apple Music, Goodreads (deprecated mais fonctionne)
→ Traiter comme "public" mais sans meme demander username (derivable d'autre chose OU pas de signal utile).

**Sub-case B — Pas d'API (13 plateformes)** :
Netflix, Disney+, Crunchyroll, Amazon, Coursera, ResearchGate, PlayStation, Xbox, Nintendo, IMDb, Rotten Tomatoes, Nike Run Club
→ **N'afficher meme pas de bouton Connect** dans PlatformGrid. Retirer du catalogue OU afficher "Scanning via extension" (si l'extension Chrome Sofia scrape ces sites).

**Action** : audit de ces 13 plateformes — soit les retirer, soit voir si l'extension Sofia peut les couvrir differemment (tracking de navigation).

---

## 4. Resume des efforts

| Categorie             | Plateformes | Priorite                                  | Effort                             |
| --------------------- | ----------- | ----------------------------------------- | ---------------------------------- |
| Public on-chain       | 6           | **Haute** (impact web3)                   | 3-4 jours                          |
| Public avec challenge | 12          | **Haute** (chess.com, leetcode)           | 2 jours infra + 0.5j/plateforme    |
| Public sans challenge | 6           | Moyenne (edu/wiki)                        | 1 jour (reutilise infra challenge) |
| API key               | 5           | Moyenne (opensea = web3 crucial)          | 0.5 jour/plateforme                |
| SIWE/SIWF             | 3           | **Haute** (lens, farcaster = web3 social) | 2 jours infra                      |
| None A (API dispo)    | 5           | Basse                                     | skip ou MVP simple                 |
| None B (pas d'API)    | 13          | **Retirer du catalogue** ou via extension | 0 jour (cleanup)                   |

**Total MVP non-OAuth** : ~10 jours pour couvrir 32 plateformes (on-chain + challenge + SIWE + API key).

---

## 5. Ordre de priorite recommande

1. **SIWE + on-chain public** (wallet-siwe, ens, aave, uniswap, lido, the-graph, snapshot, lens) — 5 jours
   → Web3 natif, pas besoin d'apps tierces, impact immediat sur le scoring "web3-crypto"
2. **Challenge flow + chess.com + leetcode** — 3 jours
   → Tres demandes par les users (dev et gaming)
3. **API key + opensea** — 0.5 jour
   → NFT market cap signal
4. **Farcaster (SIWF)** — 1 jour
   → Web3 social
5. **Cleanup plateformes sans API** — retirer 13 plateformes du catalogue
   → Zero effort, UI plus claire

---

## 6. Fichiers a creer cote mastra

```
src/mastra/
├── challenge/
│   ├── types.ts
│   ├── storage.ts           — tables challenges + platform_usernames
│   ├── routes.ts            — /platforms/:id/challenge, /verify, /link-username
│   ├── verify.ts            — verification bio par plateforme
│   └── fetchers/            — fetchers username-based (chess-com, leetcode, etc.)
├── siwe/
│   ├── types.ts
│   ├── routes.ts            — /platforms/:id/siwe/nonce, /verify
│   └── verify.ts            — verification signature
├── onchain/
│   ├── types.ts
│   └── fetchers/            — fetchers wallet-based (ens, aave, etc.)
└── oauth/
    └── config.ts            — ajouter API_KEY_PROVIDERS section
```

## 7. Fichiers a modifier

**Mastra** :

- `src/mastra/index.ts` — ajouter les nouvelles routes dans `server.apiRoutes`
- `src/mastra/workflows/signal-fetcher-workflow.ts` — brancher les differents patterns (token vs username vs walletAddress)
- `src/mastra/signals/registry.ts` — 3 types de fetchers : tokenBased, usernameBased, walletBased

**Explorer** :

- `src/services/oauthService.ts` — corriger les URLs `/api/platforms/*` → `/platforms/*` (comme on a fait pour OAuth)
- `src/hooks/usePlatformConnections.ts` — brancher SIWE, auto-connect pour on-chain, integrer le challenge flow complet
- `src/components/profile/PlatformGrid.tsx` — deja UI prete, juste connecter le bon `onConnect` par authType
- `src/config/platformCatalog.ts` — retirer les 13 plateformes sans API OU les marquer `hidden: true`
- `src/services/reputationScoreService.ts` — ajouter METRIC_COMPONENTS pour les nouvelles plateformes

---

## 8. Schema final du flow (multi-pattern)

```
User clique Connect
      │
      ├─ authType: oauth2 → plan-oauth-routes.md (existant)
      │
      ├─ authType: public (on-chain) → auto-connect, backend utilise walletAddress
      │
      ├─ authType: public (challenge) → username input → challenge code → bio verify
      │
      ├─ authType: public (no challenge) → username input → direct link
      │
      ├─ authType: api_key → auto-connect, backend utilise son API key + walletAddress
      │
      ├─ authType: siwe → Privy signMessage → verify signature → store
      │
      ├─ authType: siwf → Farcaster signer → verify → store
      │
      └─ authType: none → soit retirer, soit auto-connect sans fetch

Puis toutes passent par :
  signalFetcherWorkflow(platform, walletAddress)
    → resolve la strategie fetcher (token/username/wallet)
    → renvoie metrics
```

---

## 9. Decision pour avancer

**Recommendation** :

1. **D'abord** nettoyer les 13 plateformes sans API du catalogue (ou les cacher) — 30 min
2. **Ensuite** implementer le SIWE + on-chain (fort impact, pas de challenge complexe)
3. **Puis** le challenge flow + chess.com comme premier test
4. Les OAuth2 restantes (Phase 1 de `plan-oauth-extension.md`) peuvent avancer en parallele

Les trois chantiers (OAuth extension, challenge flow, SIWE/on-chain) sont **independants** et peuvent etre implementes en parallele par differents devs.
