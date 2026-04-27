# Signal Fetchers — Plan d'implementation complet

> Date : 16 avril 2026
> Repo cible : `core/sofia-mastra/`
> Deploiement : Phala Cloud TEE (image Docker `maximesaintjoannis/sofia-mastra`)
> Consumer : Sofia Explorer (React frontend, repo separe `sofia-explorer/`)

---

## 1. Pourquoi on fait ca — le probleme

### Scoring actuel (Explorer)

L'Explorer a un systeme de reputation par topic (tech-dev, music, web3, etc.).
Le score d'un user est calcule dans `sofia-explorer/src/services/reputationScoreService.ts` :

```typescript
const POINTS_PER_PLATFORM = 10
// Score = nombre de plateformes connectees × 10 + bonus EthCC + trust boost
```

**C'est un compteur, pas un score de reputation.** Un user qui connecte GitHub avec 0 commit
a le meme score qu'un dev avec 5 ans de contributions.

### Ce qui existe mais n'est pas utilise

L'Explorer a 50 formules de scoring detaillees dans `sofia-explorer/src/config/signalMatrix.ts`
qui prennent en compte des metriques reelles (commits, followers, stream hours, etc.).
Mais AUCUN code ne fetch ces metriques depuis les APIs des plateformes.

### Le but final

Quand un user connecte GitHub, on veut :
1. Verifier son token (ca existe deja : `linkSocialWorkflow`)
2. **NOUVEAU : Stocker son token de maniere chiffree**
3. **NOUVEAU : Fetcher ses metriques reelles** (commits, repos, stars, streak)
4. L'Explorer applique les formules du signalMatrix pour calculer un vrai score

---

## 2. Architecture globale

```
Sofia Explorer (React, port 5173)          sofia-mastra (Mastra, port 4111)
─────────────────────────────────          ─────────────────────────────────

CONNEXION (existe deja) :
  User clique "Connect GitHub"
    → OAuth popup
    → Explorer recoit le code
    → Explorer appelle linkSocialWorkflow
      avec { walletAddress, platform, oauthToken }
    → Mastra verifie le token, cree le triple on-chain
    → NOUVEAU : Mastra stocke le token chiffre en DB

SCORING (nouveau) :
  User ouvre son dashboard
    → Explorer appelle signalFetcherWorkflow
      avec { platform: "github", walletAddress: "0x..." }
    → Mastra lit le token chiffre en DB
    → Mastra appelle GitHub API avec le token
    → Mastra retourne les metriques brutes
    → Explorer applique les formules du signalMatrix
    → Score reel affiche
```

### Pourquoi les fetchers sont dans Mastra (pas dans l'Explorer)

1. **Les tokens OAuth sont des secrets** — ils ne doivent jamais transiter par le frontend
2. **Rate limits** — les appels API doivent etre server-side avec cache
3. **Mastra gere deja les tokens** — `linkSocialWorkflow` recoit le token pour verification
4. **Phala TEE** — les tokens sont stockes dans un environnement securise hardware

---

## 3. Ce qui existe dans sofia-mastra

### Workflows existants

| Workflow | Fichier | Input | Ce qu'il fait |
|---|---|---|---|
| `linkSocialWorkflow` | `workflows/link-social-workflow.ts` | `{walletAddress, platform, oauthToken}` | Verifie le token OAuth, extrait userId/username, cree le triple on-chain `[wallet] [has verified {platform} id] [userId]` |
| `socialVerifierWorkflow` | `workflows/social-verifier-workflow.ts` | `{walletAddress, tokens: {youtube?, spotify?, discord?, twitch?, twitter?}}` | Verifie 5 tokens en parallele, cree triple attestation si 4/5+ valides |

### Comment l'Explorer appelle les workflows

```typescript
// Dans sofia-explorer/src/services/oauthService.ts :
const MASTRA_URL = import.meta.env.VITE_MASTRA_URL || 'http://localhost:4111'

// Appel au workflow :
fetch(`${MASTRA_URL}/api/workflows/linkSocialWorkflow/start-async`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    inputData: { walletAddress, platform, oauthToken }
  })
})

// Mastra retourne automatiquement :
// { result: { steps: { 'step-id': { output: {...} } } } }
```

### Plateformes supportees pour la verification OAuth

Le `linkSocialWorkflow` sait verifier : **YouTube, Spotify, Discord, Twitch, Twitter**.
Il appelle l'API de chaque plateforme pour valider le token et extraire le userId :

```typescript
// Endpoints de verification (dans link-social-workflow.ts) :
const OAUTH_ENDPOINTS = {
  youtube:  { url: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true' },
  spotify:  { url: 'https://api.spotify.com/v1/me' },
  discord:  { url: 'https://discord.com/api/users/@me' },
  twitch:   { url: 'https://api.twitch.tv/helix/users' },  // + TWITCH_CLIENT_ID header
  twitter:  { url: 'https://api.twitter.com/2/users/me' },
}
```

### Stockage actuel

- **LibSQL** via `@mastra/libsql` : `file:./data/mastra.db` (dev) ou `file:/dstack/data/mastra.db` (Phala)
- Tables gerees par Mastra (workflow runs, conversations, etc.)
- **AUCUNE table custom** — on peut en ajouter via `@libsql/client` directement

### Ce qui n'existe PAS (a creer)

1. **Stockage de tokens** — les tokens sont passes aux workflows et jetes apres usage
2. **Refresh tokens** — pas de mecanisme de renouvellement
3. **Signal fetchers** — aucun code ne fetch des metriques depuis les APIs des plateformes
4. **Routes OAuth** — les endpoints `/api/oauth/*` appeles par l'Explorer ne sont pas implementes dans mastra (le flow OAuth complet reste a clarifier, mais le linkSocialWorkflow recoit deja le token)

---

## 4. Deploiement Phala Cloud — ce qu'il faut savoir

### Image Docker actuelle

```
Image : maximesaintjoannis/sofia-mastra:v1.4.2
Base : node:22-slim
Supervisor lance 2 services :
  ├── MCP Server (port 3001)
  └── Mastra (port 4111)

Volume : /dstack/data → mastra.db (chiffre par le TEE Phala)
```

### Dockerfile (phala-deploy/Dockerfile)

Build depuis le repertoire `core/` :
```bash
docker build -f sofia-mastra/phala-deploy/Dockerfile -t sofia-mastra .
```

Le Dockerfile copie `sofia-mastra/` + `intuition-mcp-server/`, installe les deps, build, lance supervisor.

### Env vars actuelles

```
GAIANET_NODE_URL, GAIANET_MODEL, GAIANET_TEXT_MODEL_SMALL, GAIANET_TEXT_MODEL_LARGE
GAIANET_EMBEDDING_MODEL, GAIANET_EMBEDDING_URL, USE_EMBEDDINGS
DATABASE_URL=file:/dstack/data/mastra.db
MCP_SERVER_URL=http://127.0.0.1:3001/sse
BOT_PRIVATE_KEY=0x...
TWITCH_CLIENT_ID=pyz5o7...
```

### Apres implementation — changements de deploiement

```
Nouvelle env var : TOKEN_ENCRYPTION_KEY=<64 chars hex = 32 bytes random>
Generer avec : openssl rand -hex 32

Nouvelle image : maximesaintjoannis/sofia-mastra:v1.5.0

Pas de changement au Dockerfile (crypto est natif Node.js, pas de nouvelle dep).
La table oauth_tokens est creee automatiquement au premier boot.
Le volume /dstack/data persiste — pas de perte de donnees au redeploy.
```

---

## 5. Ce qu'on implemente — en detail

### 5.1 Module de stockage chiffre des tokens

**Fichier : `src/mastra/db/tokens.ts`**

**Concept :** On utilise le meme client LibSQL que Mastra (meme DB file) pour creer une table
`oauth_tokens`. Les tokens sont chiffres avec AES-256-GCM avant insertion. La cle de chiffrement
est dans `TOKEN_ENCRYPTION_KEY` (env var).

**Pourquoi AES-256-GCM :**
- GCM fournit chiffrement + authentification (on detecte si le ciphertext a ete modifie)
- AES-256 est le standard pour les donnees sensibles
- Node.js `crypto` le supporte nativement (pas de dep supplementaire)
- Chaque token a son propre IV (vecteur d'initialisation) → meme token chiffre differemment a chaque fois

**Schema de la table :**

```sql
CREATE TABLE IF NOT EXISTS oauth_tokens (
  wallet_address TEXT NOT NULL,
  platform TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,    -- AES-256-GCM chiffre, format: iv:authTag:ciphertext (hex)
  refresh_token_encrypted TEXT,            -- Meme format, nullable
  user_id TEXT,                            -- userId extrait de l'API (ex: UCxxxxx pour YouTube)
  username TEXT,                           -- Display name
  expires_at INTEGER,                      -- Timestamp d'expiration du access_token (nullable)
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (wallet_address, platform)
)
```

**Fonctions a exporter :**

```typescript
// Init — appeler au demarrage de Mastra
initTokenTable(): Promise<void>

// Stocker un token (chiffre automatiquement)
storeToken(walletAddress, platform, accessToken, refreshToken?, userId?, username?, expiresAt?): Promise<void>

// Lire un token (dechiffre automatiquement)
getToken(walletAddress, platform): Promise<TokenRecord | null>

// Lire tous les tokens d'un wallet
getAllTokens(walletAddress): Promise<TokenRecord[]>

// Supprimer un token
deleteToken(walletAddress, platform): Promise<void>
```

**Format de chiffrement :** `iv:authTag:ciphertext` (tout en hex, separe par `:`)

```typescript
function encrypt(plaintext: string): string {
  const key = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'hex') // 32 bytes
  const iv = crypto.randomBytes(12) // 96 bits pour GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

function decrypt(encoded: string): string {
  const [ivHex, authTagHex, ciphertextHex] = encoded.split(':')
  const key = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
  return decipher.update(ciphertextHex, 'hex', 'utf8') + decipher.final('utf8')
}
```

### 5.2 Modification de linkSocialWorkflow

**Fichier : `src/mastra/workflows/link-social-workflow.ts`**

**Modification :** Apres que `verifyAndGetUserId()` reussit (ligne ~257), AVANT la creation on-chain, ajouter :

```typescript
import { storeToken } from '../db/tokens'

// Dans executeLinkSocial, apres verification.valid :
await storeToken(
  walletAddress,
  platform,
  oauthToken,         // access_token
  undefined,          // refresh_token (pas dispo dans le flow actuel)
  verification.userId,
  verification.username,
)
```

**Pourquoi avant la creation on-chain :** Si la tx on-chain echoue, on a quand meme le token stocke.
Le user ne devra pas reconnecter la plateforme.

### 5.3 Signal Fetchers

**Dossier : `src/mastra/signals/`**

Chaque fetcher est une fonction pure : `(token: string, userId?: string) => Promise<Record<string, number>>`

Les fetchers ne font PAS de scoring — ils retournent des metriques brutes.
Le scoring est fait cote Explorer avec les formules du signalMatrix.

#### YouTube fetcher — `signals/youtube.ts`

```
API : YouTube Data API v3
Base URL : https://www.googleapis.com/youtube/v3
Auth : Bearer token (scope: youtube.readonly)

Endpoints appeles :
  GET /channels?part=statistics,snippet&mine=true
    → subscriberCount, videoCount, viewCount, publishedAt

  GET /search?forMine=true&type=video&order=date&publishedAfter={90j}&maxResults=50&part=id
    → nombre de videos recentes

Metriques retournees :
  videos_postees        → creation
  vues_totales          → community
  subscribers           → community
  videos_recentes_90j   → regularity
  anciennete_mois       → anciennete
```

#### Spotify fetcher — `signals/spotify.ts`

```
API : Spotify Web API
Base URL : https://api.spotify.com/v1
Auth : Bearer token (scopes: user-read-private, user-top-read, user-follow-read, playlist-read-private)

Endpoints appeles :
  GET /me/top/artists?time_range=medium_term&limit=50
    → top artists → extract unique genres

  GET /me/playlists?limit=50
    → playlists creees par le user

Metriques retournees :
  diversite_genres      → qualite d'ecoute
  playlists_creees      → creation
  top_artists_count     → diversite
```

#### Discord fetcher — `signals/discord.ts`

```
API : Discord API v10
Base URL : https://discord.com/api/v10
Auth : Bearer token (scopes: identify, guilds)

Endpoints appeles :
  GET /users/@me/guilds
    → liste des serveurs

Metriques retournees :
  serveurs_specialises  → community
  roles_obtenus         → serveurs ou le user a ADMINISTRATOR permission
```

#### Twitch fetcher — `signals/twitch.ts`

```
API : Twitch Helix API
Base URL : https://api.twitch.tv/helix
Auth : Bearer token + Client-Id header (scope: user:read:follows)

Endpoints appeles :
  GET /users
    → user info (created_at, broadcaster_type)

  GET /channels/followers?broadcaster_id={id}&first=1
    → follower count

  GET /videos?type=archive&first=100
    → past broadcasts → estimer heures de stream

Metriques retournees :
  heures_stream_mois    → regularity
  followers             → community
  anciennete_mois       → anciennete
  is_affiliate          → monetisation (0 ou 1)
  is_partner            → monetisation (0 ou 1)
```

#### GitHub fetcher — `signals/github.ts` (Phase 2)

```
API : GitHub REST API
Base URL : https://api.github.com
Auth : Bearer token (scopes: read:user, repo)
Note : les tokens GitHub n'expirent PAS (OAuth app tokens sont permanents)

Endpoints appeles :
  GET /user
    → login, public_repos, created_at

  GET /user/repos?sort=pushed&per_page=100
    → repos actifs, stars, langages

  GET /users/{login}/events/public?per_page=100
    → events recents (PushEvent) → streak, commits quotidiens

Metriques retournees :
  streak_jours          → regularity
  commits_moy_quotidien → creation
  repos_actifs          → creation (pushes dans les 90 derniers jours)
  stars_recus           → community
  anciennete_mois       → anciennete
  langages_distincts    → creation
  repos_total           → creation
```

#### Registry — `signals/registry.ts`

```typescript
import type { SignalFetcher } from './types'

export const SIGNAL_FETCHERS: Record<string, SignalFetcher> = {}

// Les fetchers sont ajoutes dynamiquement pour eviter d'importer
// des modules non necessaires au demarrage
export function registerFetcher(platform: string, fetcher: SignalFetcher) {
  SIGNAL_FETCHERS[platform] = fetcher
}
```

### 5.4 Signal Fetcher Workflow

**Fichier : `src/mastra/workflows/signal-fetcher-workflow.ts`**

```
Input :  { platform: string, walletAddress: string }
Output : { success: boolean, platformId: string, fetchedAt?: number, metrics?: Record<string, number>, error?: string }

Logique :
  1. Lire le token chiffre en DB via getToken(walletAddress, platform)
  2. Si pas de token → { success: false, error: "no_token" }
  3. Chercher le fetcher dans le registry
  4. Si pas de fetcher → { success: false, error: "no_fetcher" }
  5. Appeler le fetcher avec le token dechiffre
  6. Si 401/403 → { success: false, error: "token_expired" }
  7. Retourner les metriques brutes
```

### 5.5 Enregistrement dans Mastra

**Fichier modifie : `src/mastra/index.ts`**

```typescript
import { signalFetcherWorkflow } from './workflows/signal-fetcher-workflow'
import { initTokenTable } from './db/tokens'

// Ajouter au demarrage
initTokenTable().catch(err => console.error('[TokenDB] Init failed:', err))

export const mastra = new Mastra({
  workflows: {
    sofiaWorkflow, chatbotWorkflow, socialVerifierWorkflow,
    linkSocialWorkflow, signalFetcherWorkflow  // ← NOUVEAU
  },
  // ... reste inchange
})
```

---

## 6. Formules de scoring (reference — cote Explorer)

Ces formules sont dans `sofia-explorer/src/config/signalMatrix.ts`.
Les fetchers n'appliquent PAS ces formules — ils retournent les metriques brutes.
L'Explorer applique les formules. Mais il faut que les metriques retournees
correspondent aux variables des formules.

### Formules des plateformes Phase 0-1

```
YOUTUBE :
  formula = (videos_postees * 10) + (vues_totales / 1000) + (commentaires_pertinents * 2)
  weights = { creation: 10, regularity: 1.5, community: 2, monetization: 3, anciennete: 0.5 }
  burstPenalty = -0.2

SPOTIFY :
  formula = (diversite_genres * 2) + (playlists_creees * 3) + (heures_semaine * 1)
  weights = { creation: 1, regularity: 1.2, community: 1, monetization: 0, anciennete: 0.5 }
  burstPenalty = -0.1

DISCORD :
  formula = (serveurs_specialises * 3) + (roles_obtenus * 5)
  weights = { creation: 1, regularity: 1.5, community: 5, monetization: 0, anciennete: 0.5 }
  burstPenalty = -0.1

TWITCH :
  formula = (heures_stream_mois * 2) + (followers / 100) + (subs * 10)
  weights = { creation: 5, regularity: 2, community: 2, monetization: 4, anciennete: 0.5 }
  burstPenalty = -0.2

GITHUB :
  formula = (streak_jours * 1.5) + (commits_moy_quotidien * 3) + (repos_actifs * 2) - burst_malus
  weights = { creation: 3, regularity: 1.5, community: 2, monetization: 3, anciennete: 0.5 }
  burstPenalty = -0.2
```

### Principes de scoring (cote Explorer)

```
SINGLE_SOURCE_PENALTY = 0.5     → 1 seule plateforme par topic = score × 0.5
MULTI_SOURCE_BONUS = 1.5        → 3+ plateformes croisees = score × 1.5
ENS_BONUS = 15                  → +15 pts si le user a un ENS
ANCIENNETE_LOG_FACTOR = 0.5     → log(mois_actifs) × 0.5
CROSS_PLATFORM_MIN_CONFIDENCE = 0.3
```

### Topic scoring models (14 topics)

```
tech-dev:          regularityMultiplier=1.5, qualityMultiplier=2.0, monetizationMultiplier=3.0
design-creative:   regularityMultiplier=1.3, qualityMultiplier=2.0, monetizationMultiplier=3.0
music-audio:       regularityMultiplier=1.2, qualityMultiplier=2.5, monetizationMultiplier=4.0
video-cinema:      regularityMultiplier=1.5, qualityMultiplier=2.0, monetizationMultiplier=3.0
web3-crypto:       regularityMultiplier=1.4, qualityMultiplier=3.0, monetizationMultiplier=4.0
gaming:            regularityMultiplier=1.2, qualityMultiplier=2.0, monetizationMultiplier=3.0
science:           regularityMultiplier=2.0, qualityMultiplier=3.0, monetizationMultiplier=4.0
entrepreneurship:  regularityMultiplier=1.5, qualityMultiplier=2.0, monetizationMultiplier=5.0
sport-health:      regularityMultiplier=1.8, qualityMultiplier=1.5, monetizationMultiplier=3.0
performing-arts:   regularityMultiplier=1.3, qualityMultiplier=2.5, monetizationMultiplier=3.5
nature-environment:regularityMultiplier=1.5, qualityMultiplier=2.0, monetizationMultiplier=2.0
food-lifestyle:    regularityMultiplier=1.3, qualityMultiplier=2.0, monetizationMultiplier=3.0
literature:        regularityMultiplier=1.5, qualityMultiplier=2.5, monetizationMultiplier=3.0
personal-dev:      regularityMultiplier=1.5, qualityMultiplier=2.0, monetizationMultiplier=3.0
```

---

## 7. Contraintes

### Securite
- Les tokens sont des secrets — JAMAIS en clair dans les logs
- Chiffrement AES-256-GCM avec cle en env var
- Le TEE Phala chiffre aussi le volume disque au niveau hardware → double protection
- Les scopes OAuth sont read-only (on ne modifie jamais les comptes des users)

### Rate limits des APIs
- GitHub : 5000 req/h par token
- Spotify : ~180 req/min
- Discord : 50 req/s global
- Twitch : 800 req/min
- YouTube : 10000 unites/jour (1 unite = 1 req simple)

Mitigation : les metriques sont cachees cote Explorer (React Query staleTime = 1h).
Un user ne fetch ses signaux qu'une fois par session.

### Tokens et expiration
- GitHub : token permanent (OAuth app) → pas de refresh necessaire
- Spotify : access_token expire apres 1h, refresh_token = permanent
- Discord : access_token expire apres ~7 jours, refresh_token = permanent
- Twitch : access_token expire apres ~4h, refresh_token = permanent
- Twitter : access_token expire apres 2h, refresh_token = 6 mois

Pour le MVP : on stocke l'access_token au moment de la connexion.
Si le token a expire quand on fetch les signaux → erreur "token_expired" → l'Explorer
propose au user de reconnecter la plateforme.

Le refresh token sera implemente en V2.

### Fallback scoring
Si un fetcher echoue (token expire, API down, pas de fetcher) :
→ L'Explorer affiche "score unavailable" pour cette plateforme
→ PAS de fallback a 10 pts — le score doit representer la realite

---

## 8. Fichiers a creer

```
src/mastra/
├── db/
│   └── tokens.ts                          ← Stockage chiffre AES-256-GCM dans LibSQL
├── signals/
│   ├── types.ts                           ← Interfaces PlatformSignals, SignalFetcher
│   ├── registry.ts                        ← Map platformId → fetcher function
│   ├── utils.ts                           ← Helpers (monthsSince, calculateStreak)
│   ├── youtube.ts                         ← Fetcher YouTube Data API v3
│   ├── spotify.ts                         ← Fetcher Spotify Web API
│   ├── discord.ts                         ← Fetcher Discord API v10
│   ├── twitch.ts                          ← Fetcher Twitch Helix API
│   └── github.ts                          ← Fetcher GitHub REST API (Phase 2)
└── workflows/
    └── signal-fetcher-workflow.ts         ← Workflow Mastra pour fetch les metriques
```

## 9. Fichiers a modifier

```
src/mastra/index.ts
  → Importer signalFetcherWorkflow, l'ajouter dans workflows: {}
  → Appeler initTokenTable() au demarrage

src/mastra/workflows/link-social-workflow.ts
  → Apres verifyAndGetUserId() reussit (~ligne 257)
  → Ajouter : await storeToken(walletAddress, platform, oauthToken, undefined, userId, username)
```

## 10. Env vars a ajouter

```
TOKEN_ENCRYPTION_KEY=<64 chars hex>    # Generer : openssl rand -hex 32
```

A ajouter dans :
- `.env` local (dev)
- Phala Cloud dashboard (production)

## 11. Process de deploiement

```bash
# 1. Implementer les changements dans sofia-mastra/
# 2. Test local
cd sofia-mastra && pnpm run dev
# → Tester : POST /api/workflows/signalFetcherWorkflow/start-async
#   Body : { "inputData": { "platform": "youtube", "walletAddress": "0x..." } }

# 3. Build Docker (depuis core/)
cd core/
docker build -f sofia-mastra/phala-deploy/Dockerfile -t maximesaintjoannis/sofia-mastra:v1.5.0 .

# 4. Push
docker push maximesaintjoannis/sofia-mastra:v1.5.0

# 5. Phala Cloud dashboard :
#    - Mettre a jour le tag image → v1.5.0
#    - Ajouter env var TOKEN_ENCRYPTION_KEY
#    - Redeployer

# 6. Verifier
curl -X POST https://<phala-url>/api/workflows/signalFetcherWorkflow/start-async \
  -H "Content-Type: application/json" \
  -d '{"inputData":{"platform":"youtube","walletAddress":"0xTEST"}}'
# → Doit retourner { success: false, error: "no_token" } (normal, pas de token stocke)
```

## 12. Planning

| Jour | Tache | Livrable |
|---|---|---|
| J1 | `db/tokens.ts` — chiffrement AES-256-GCM + table LibSQL | Tokens stockables et lisibles |
| J1 | Modifier `link-social-workflow.ts` — stocker le token | Token persiste apres connexion |
| J2 | `signals/types.ts` + `signals/utils.ts` + `signals/registry.ts` | Infrastructure fetchers |
| J2 | `signals/youtube.ts` + `signals/spotify.ts` | 2 fetchers |
| J3 | `signals/discord.ts` + `signals/twitch.ts` | 2 fetchers |
| J3 | `signal-fetcher-workflow.ts` + modifier `index.ts` | Workflow fonctionnel |
| J4 | Test local complet + fix bugs | Flow end-to-end OK |
| J5 | `signals/github.ts` + build Docker + deploy Phala | 5 fetchers en prod |

## 13. Tests de verification

### Test 1 — Token storage
```
1. Demarrer mastra en dev
2. Appeler linkSocialWorkflow avec un vrai token YouTube
3. Verifier que le token est stocke en DB (chiffre)
4. Appeler getToken() → verifier que le token dechiffre est correct
```

### Test 2 — Signal fetcher
```
1. Avoir un token YouTube stocke en DB (test 1)
2. Appeler signalFetcherWorkflow avec { platform: "youtube", walletAddress: "0x..." }
3. Verifier que les metriques sont retournees (videos_postees, vues_totales, etc.)
```

### Test 3 — Token expire
```
1. Stocker un token expire en DB
2. Appeler signalFetcherWorkflow
3. Verifier que la reponse est { success: false, error: "token_expired" }
```

### Test 4 — Plateforme sans fetcher
```
1. Stocker un token pour une plateforme non supportee (ex: "figma")
2. Appeler signalFetcherWorkflow avec { platform: "figma" }
3. Verifier que la reponse est { success: false, error: "no_fetcher" }
```
