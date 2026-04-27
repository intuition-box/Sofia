# Plan d'implementation — Routes OAuth dans sofia-mastra

> Date : 16 avril 2026
> Cible : `core/sofia-mastra/`
> Deploiement : Phala Cloud TEE
> Consumer : Sofia Explorer (frontend React)

---

## 1. Pourquoi on fait ca

L'Explorer a des boutons "Connect" pour chaque plateforme (Spotify, YouTube, Discord, etc.).
Le flow OAuth2 necessite un serveur pour :
1. **Redirect** : construire l'URL OAuth du provider avec le `client_id`
2. **Exchange** : echanger le `code` d'autorisation contre un `access_token` (necessite `client_secret`)
3. **Store** : stocker le token chiffre pour les signal fetchers

Le frontend ne peut PAS faire l'exchange lui-meme car le `client_secret` ne doit jamais etre
expose dans le JS bundle.

Actuellement, le frontend appelle `${MASTRA_URL}/api/oauth/spotify/authorize` → 404 car ces
routes n'existent pas encore dans mastra.

---

## 2. Ce qui existe deja — IMPORTANT a comprendre

### Cote Explorer (frontend) — TOUT le flow est code

**`src/services/oauthService.ts`** (verifie par agent explorer) :

1. `startOAuthFlow(platformId)` :
   - Genere un `state` CSRF
   - Ouvre un popup vers `${MASTRA_URL}/api/oauth/${platformId}/authorize?redirect_uri=...&state=...`
   - Ecoute les `postMessage` depuis le popup (type: 'oauth_callback')
   - Retourne le `code` d'autorisation

2. `OAuthCallbackPage.tsx` (route `/auth/callback`) :
   - Extrait `code`, `state`, `error` des query params
   - `window.opener.postMessage({ type: 'oauth_callback', code, state, error })`
   - Affiche "Connecting... you can close this window"

3. `exchangeOAuthCode(platformId, code)` :
   - POST vers `${MASTRA_URL}/api/oauth/${platformId}/callback`
   - Body : `{ code, redirectUri }`
   - Recoit `{ success, userId, username }`

4. `linkPlatformToWallet(walletAddress, platformId, oauthToken)` :
   - POST vers `${MASTRA_URL}/api/workflows/linkSocialWorkflow/start-async`
   - Cree le triple on-chain

**`src/config/platformCatalog.ts`** — contient deja les URLs OAuth par plateforme :

| Plateforme | authUrl | tokenUrl | scopes |
|---|---|---|---|
| YouTube | `https://accounts.google.com/o/oauth2/v2/auth` | `https://oauth2.googleapis.com/token` | `youtube.readonly` |
| Spotify | `https://accounts.spotify.com/authorize` | `https://accounts.spotify.com/api/token` | `user-read-private, user-top-read, user-follow-read, playlist-read-private` |
| Discord | `https://discord.com/api/oauth2/authorize` | `https://discord.com/api/oauth2/token` | `identify, guilds` |
| Twitch | `https://id.twitch.tv/oauth2/authorize` | `https://id.twitch.tv/oauth2/token` | `user:read:follows` |
| GitHub | non defini (utilise les defaults GitHub) | non defini | `read:user, repo` |

### Cote Mastra (backend) — DEJA implemente (verifie par agent)

**Token storage** :
- `db/tokens.ts` : chiffrement AES-256-GCM, table `oauth_tokens`, fonctions
  `storeToken(walletAddress, platform, accessToken, refreshToken?, userId?, username?, expiresAt?)`
  et `getToken(walletAddress, platform)`
- `TOKEN_ENCRYPTION_KEY` definie en env var
- `initTokenTable()` appele au demarrage dans `index.ts`

**Workflows** :
- `link-social-workflow.ts` : appelle deja `storeToken()` apres verification OAuth.
  Contient `verifyAndGetUserId(platform, token, clientId?)` qui appelle l'API du provider pour
  extraire `{ userId, username }`
- `signal-fetcher-workflow.ts` : lit les tokens via `getToken()` et appelle les fetchers

### Ce qui MANQUE

Les routes HTTP `/api/oauth/{platform}/authorize` et `/api/oauth/{platform}/callback`
n'existent pas dans mastra. **C'est le seul maillon manquant.**

---

## 3. Contrainte Mastra : pas de routes `/api/*`

Verifie directement dans le code source `@mastra/core/dist/server/index.js` :

```
Error: MASTRA_SERVER_API_PATH_RESERVED
Path must not start with "/api", it's reserved for internal API routes
```

Le prefixe `/api` est reserve pour les routes auto-generees (`/api/workflows/*`, `/api/agents/*`).
Les routes custom doivent utiliser un prefixe different.

**Decision : utiliser `/oauth/*`** au lieu de `/api/oauth/*`.

Impact cote Explorer : une seule modification dans `oauthService.ts` pour changer le prefixe
des 2 endpoints appeles.

---

## 4. API Mastra pour routes custom

Verifie dans `@mastra/core/dist/server/index.d.ts` (source de verite) :

```typescript
import { registerApiRoute } from '@mastra/core/server'

registerApiRoute('/path/:param', {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'ALL',
  handler: (c: Context) => c.json({ ... }),  // Hono Context
  middleware?: MiddlewareHandler | MiddlewareHandler[],
  requiresAuth?: boolean,  // default true
})
```

Le handler recoit un **Context Hono standard** : `c.req.param()`, `c.req.query()`,
`c.req.json()`, `c.json()`, `c.redirect()`.

Les routes sont enregistrees via `server.apiRoutes` dans la config Mastra :

```typescript
new Mastra({
  workflows: { ... },
  server: {
    apiRoutes: [
      registerApiRoute('/oauth/:platform/authorize', { method: 'GET', handler: ... }),
      registerApiRoute('/oauth/:platform/callback', { method: 'POST', handler: ... }),
    ]
  }
})
```

---

## 5. Architecture des routes

### Routes a creer

```
GET  /oauth/:platform/authorize    → 302 Redirect vers le provider OAuth
POST /oauth/:platform/callback     → Exchange code contre token, stocke le token
```

### Flow detaille

#### GET /oauth/:platform/authorize

```
Input (query params) :
  redirect_uri : URL de callback du frontend (ex: http://localhost:5173/auth/callback)
  state        : Token CSRF genere par le frontend

Steps :
  1. Lire platform depuis c.req.param('platform')
  2. Lire redirect_uri et state depuis c.req.query()
  3. Chercher la config OAuth du provider dans OAUTH_PROVIDERS[platform]
  4. Si provider inconnu → return 404 { error: 'unsupported_platform' }
  5. Construire l'URL d'autorisation du provider :

     https://accounts.spotify.com/authorize?
       client_id=<SPOTIFY_CLIENT_ID>
       &response_type=code
       &redirect_uri=<redirect_uri>
       &scope=<scopes joined>
       &state=<state>
       &<...extraAuthParams>

  6. return c.redirect(authorizeUrl, 302)
```

Note : le **redirect_uri** passe au provider DOIT correspondre EXACTEMENT a celui configure
dans le dashboard du provider, sinon echec de l'exchange a l'etape callback.

#### POST /oauth/:platform/callback

```
Input (JSON body) :
  code         : Code d'autorisation recu du provider
  redirectUri  : Le meme redirect_uri qu'a l'authorize (requis par certains providers)

Steps :
  1. Lire platform depuis c.req.param('platform')
  2. Lire { code, redirectUri } depuis c.req.json()
  3. Chercher la config OAuth du provider
  4. Construire la requete d'echange selon les quirks du provider (voir section 7)
  5. POST <tokenUrl> → recevoir { access_token, refresh_token?, expires_in?, token_type }
  6. Si erreur → return 400 { error: 'exchange_failed', details }
  7. Verifier le token en appelant l'API du provider via verifyAndGetUserId()
     → extrait { userId, username }
  8. Si pas de walletAddress dans la requete, on ne peut pas storeToken (la requete vient
     du popup OAuth, on n'a pas encore le wallet).
     → Retourner le token au frontend qui appellera linkSocialWorkflow
     → OU : faire le storeToken + linkSocialWorkflow ici (a decider — voir section 6)

  9. return c.json({ success: true, platformId, userId, username, accessToken, refreshToken? })
```

---

## 6. Decision critique : quand/ou stocker le token ?

Il y a 2 approches possibles :

### Approche A : Token retourne au frontend, storeToken via linkSocialWorkflow

```
1. GET /oauth/spotify/authorize → redirect provider
2. Provider redirect → /auth/callback → postMessage code au parent
3. Frontend POST /oauth/spotify/callback { code, redirectUri }
   → Backend echange code contre token
   → Backend retourne { accessToken, refreshToken, userId, username } au frontend
4. Frontend POST /api/workflows/linkSocialWorkflow/start-async
   { walletAddress, platform, oauthToken: accessToken, refreshToken }
   → Workflow appelle storeToken() + cree le triple on-chain
```

**Avantages** : separation claire des responsabilites, le token passe par le frontend mais
dans un fetch local (pas expose). Cohorent avec le code actuel.

**Inconvenients** : le token transite temporairement par le frontend. Dans un XSS il serait
exposable. Mais il est deja passe au postMessage et au exchangeOAuthCode.

### Approche B : Backend fait tout (exchange + store + triple)

```
1. GET /oauth/spotify/authorize → redirect provider
2. Provider redirect → /auth/callback → postMessage code + walletAddress au parent
3. Frontend POST /oauth/spotify/callback { code, redirectUri, walletAddress }
   → Backend echange code, verifie, storeToken, cree le triple on-chain
   → Backend retourne { success, userId, username, txHash }
```

**Avantages** : token ne transite jamais par le frontend. Un seul aller-retour.

**Inconvenients** : le backend fait l'on-chain → tx qui peut echouer. Si elle echoue, le token
est quand meme stocke (ce qui est OK car reutilisable pour retry).

### Decision recommandee : **Approche A** (plus simple, cohorent avec existant)

Raison : le code de `linkSocialWorkflow` est deja deploye et teste. Il stocke le token ET
cree le triple. On ne duplique pas cette logique.

Le flow devient :
```
1. startOAuthFlow → GET /oauth/spotify/authorize → redirect
2. callback → exchangeOAuthCode(POST /oauth/spotify/callback) → { accessToken, userId }
3. linkPlatformToWallet → POST /api/workflows/linkSocialWorkflow/start-async → store + triple
```

La route `/oauth/:platform/callback` ne fait QUE l'echange et la verification du token.
Elle retourne le token au frontend qui le passe au linkSocialWorkflow existant.

---

## 7. Config OAuth par plateforme

### Structure

```typescript
// src/mastra/oauth/config.ts

export interface OAuthProviderConfig {
  clientId: string
  clientSecret: string
  authUrl: string
  tokenUrl: string
  scopes: string[]
  /** Extra params for the authorize URL (ex: Google needs access_type=offline) */
  extraAuthParams?: Record<string, string>
  /** Token exchange headers override */
  tokenRequestHeaders?: Record<string, string>
  /** Use Basic auth header instead of client_secret in body (Spotify) */
  useBasicAuthHeader?: boolean
}

export function getOAuthProvider(platform: string): OAuthProviderConfig | null {
  return OAUTH_PROVIDERS[platform] ?? null
}
```

### Config des 5 plateformes

```typescript
export const OAUTH_PROVIDERS: Record<string, OAuthProviderConfig> = {
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID!,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET!,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
    extraAuthParams: {
      access_type: 'offline',      // Necessaire pour obtenir un refresh_token
      prompt: 'consent',            // Force le consentement pour le refresh_token
    },
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    authUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    scopes: ['user-read-private', 'user-top-read', 'user-follow-read', 'playlist-read-private'],
    useBasicAuthHeader: true,       // Spotify veut Authorization: Basic base64(id:secret)
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    scopes: ['identify', 'guilds'],
  },
  twitch: {
    clientId: process.env.TWITCH_CLIENT_ID!,
    clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    authUrl: 'https://id.twitch.tv/oauth2/authorize',
    tokenUrl: 'https://id.twitch.tv/oauth2/token',
    scopes: ['user:read:follows'],
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['read:user', 'repo'],
    tokenRequestHeaders: {
      Accept: 'application/json',   // Force GitHub a retourner du JSON
    },
  },
}
```

### Quirks par provider — details critiques

**YouTube (Google)** :
- `access_type=offline` + `prompt=consent` → pour obtenir un `refresh_token`
- Sans ces params, Google ne retourne QUE un access_token qui expire en 1h sans possibilite
  de refresh. Les signal fetchers ne marcheront plus apres 1h.

**Spotify** :
- L'exchange veut un header `Authorization: Basic base64(clientId:clientSecret)` au lieu
  d'inclure clientId/clientSecret dans le body.
- access_token expire en 1h, refresh_token est permanent.

**Discord** :
- Standard, aucun quirk.
- access_token expire en 7 jours.

**Twitch** :
- `TWITCH_CLIENT_ID` est deja en env var (utilise par le verifier).
- Ajouter `TWITCH_CLIENT_SECRET`.
- access_token expire en ~4h.

**GitHub** :
- Retourne du `application/x-www-form-urlencoded` par defaut.
- Ajouter `Accept: application/json` dans le header pour avoir du JSON.
- access_token permanent (pas d'expiration).

---

## 8. Verification du token (userId extraction)

La fonction `verifyAndGetUserId()` existe deja dans `link-social-workflow.ts` (lignes ~140-220).
Elle :
1. Appelle l'API du provider avec le token
2. Parse la reponse selon le format de chaque provider
3. Extrait `{ userId, username }`

**Action** : extraire cette fonction dans `src/mastra/oauth/verify.ts` pour pouvoir la
reutiliser depuis les routes OAuth sans duplication.

```typescript
// src/mastra/oauth/verify.ts
export type Platform = 'discord' | 'youtube' | 'spotify' | 'twitch' | 'twitter' | 'github'

export interface OAuthVerificationResult {
  valid: boolean
  userId?: string
  username?: string
  error?: string
}

export async function verifyAndGetUserId(
  platform: Platform,
  token: string,
  clientId?: string,
): Promise<OAuthVerificationResult> {
  // Logique actuelle de link-social-workflow.ts
  // Ajouter le support GitHub (actuellement pas dans OAUTH_ENDPOINTS)
}
```

**Ajout GitHub** : la fonction actuelle ne supporte pas GitHub. Ajouter :
```typescript
github: {
  url: 'https://api.github.com/user',
  authHeader: (token) => `Bearer ${token}`,
},
// Extraction :
case 'github':
  userId = data.id ? String(data.id) : undefined
  username = data.login ? String(data.login) : undefined
  break
```

---

## 9. Logique d'echange code → token

```typescript
// src/mastra/oauth/exchange.ts

import { getOAuthProvider } from './config'

export interface TokenExchangeResult {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  tokenType?: string
}

export async function exchangeCodeForToken(
  platform: string,
  code: string,
  redirectUri: string,
): Promise<TokenExchangeResult> {
  const provider = getOAuthProvider(platform)
  if (!provider) {
    throw new Error(`unsupported_platform: ${platform}`)
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    ...provider.tokenRequestHeaders,
  }

  if (provider.useBasicAuthHeader) {
    // Spotify : Authorization: Basic base64(clientId:clientSecret)
    const basic = Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString('base64')
    headers.Authorization = `Basic ${basic}`
  } else {
    // Standard : clientId + clientSecret dans le body
    body.append('client_id', provider.clientId)
    body.append('client_secret', provider.clientSecret)
  }

  const res = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers,
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`token_exchange_failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  }
}
```

---

## 10. Les routes

```typescript
// src/mastra/oauth/routes.ts

import { registerApiRoute } from '@mastra/core/server'
import { getOAuthProvider } from './config'
import { exchangeCodeForToken } from './exchange'
import { verifyAndGetUserId } from './verify'

export const oauthRoutes = [
  registerApiRoute('/oauth/:platform/authorize', {
    method: 'GET',
    requiresAuth: false,
    handler: async (c) => {
      const platform = c.req.param('platform')
      const redirectUri = c.req.query('redirect_uri')
      const state = c.req.query('state')

      if (!redirectUri || !state) {
        return c.json({ error: 'missing_params' }, 400)
      }

      const provider = getOAuthProvider(platform)
      if (!provider) {
        return c.json({ error: 'unsupported_platform' }, 404)
      }

      const params = new URLSearchParams({
        client_id: provider.clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: provider.scopes.join(' '),
        state,
        ...provider.extraAuthParams,
      })

      return c.redirect(`${provider.authUrl}?${params.toString()}`, 302)
    },
  }),

  registerApiRoute('/oauth/:platform/callback', {
    method: 'POST',
    requiresAuth: false,
    handler: async (c) => {
      const platform = c.req.param('platform')
      const { code, redirectUri } = await c.req.json()

      if (!code || !redirectUri) {
        return c.json({ success: false, error: 'missing_params' }, 400)
      }

      try {
        // 1. Exchange code for token
        const tokens = await exchangeCodeForToken(platform, code, redirectUri)

        // 2. Verify token + extract userId
        const verification = await verifyAndGetUserId(
          platform as Platform,
          tokens.accessToken,
        )

        if (!verification.valid) {
          return c.json({
            success: false,
            platformId: platform,
            error: verification.error || 'verification_failed',
          }, 400)
        }

        // 3. Return token + userId to frontend (frontend will call linkSocialWorkflow)
        return c.json({
          success: true,
          platformId: platform,
          userId: verification.userId,
          username: verification.username,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return c.json({
          success: false,
          platformId: platform,
          error: message,
        }, 500)
      }
    },
  }),
]
```

---

## 11. Modifications necessaires

### Fichiers a creer (mastra)

```
src/mastra/oauth/
├── config.ts       ← OAUTH_PROVIDERS map + getOAuthProvider()
├── verify.ts       ← verifyAndGetUserId() (extrait de link-social-workflow.ts)
├── exchange.ts     ← exchangeCodeForToken() avec gestion des quirks
└── routes.ts       ← Les 2 routes registerApiRoute
```

### Fichiers a modifier (mastra)

**`src/mastra/index.ts`** :

```typescript
import { oauthRoutes } from './oauth/routes'
// ... existing imports

export const mastra = new Mastra({
  workflows: { ... },
  agents: { ... },
  storage: ...,
  logger: ...,
  server: {                    // ← NOUVEAU
    apiRoutes: oauthRoutes,
  },
})
```

**`src/mastra/workflows/link-social-workflow.ts`** :
- Extraire `verifyAndGetUserId` vers `oauth/verify.ts`
- Importer depuis la au lieu de le redefinir

### Fichier a modifier (Explorer)

**`src/services/oauthService.ts`** :

```diff
- const url = `${MASTRA_URL}/api/oauth/${platformId}/authorize?${params}`
+ const url = `${MASTRA_URL}/oauth/${platformId}/authorize?${params}`

- const response = await fetch(`${MASTRA_URL}/api/oauth/${platformId}/callback`, {
+ const response = await fetch(`${MASTRA_URL}/oauth/${platformId}/callback`, {
```

Mettre a jour aussi le commentaire au debut du fichier :
```diff
- * through sofia-mastra backend at MASTRA_URL/api/oauth/*
+ * through sofia-mastra backend at MASTRA_URL/oauth/*
```

Le `linkPlatformToWallet` garde `${MASTRA_URL}/api/workflows/linkSocialWorkflow/start-async`
(route auto-generee, prefixe `/api` ok).

---

## 12. Env vars a ajouter

### .env local (pour dev)

```
# OAuth Client Credentials
YOUTUBE_CLIENT_ID=xxx
YOUTUBE_CLIENT_SECRET=xxx
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
DISCORD_CLIENT_ID=xxx
DISCORD_CLIENT_SECRET=xxx
TWITCH_CLIENT_SECRET=xxx    # TWITCH_CLIENT_ID existe deja
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

### Phala Cloud dashboard

Ajouter les memes variables en production.

### Comment obtenir les credentials

| Provider | Dashboard | Redirect URI a configurer |
|---|---|---|
| YouTube | https://console.cloud.google.com/apis/credentials | Les deux : `http://localhost:5173/auth/callback` ET `https://0xsofia.com/auth/callback` |
| Spotify | https://developer.spotify.com/dashboard | Les deux |
| Discord | https://discord.com/developers/applications | Les deux |
| Twitch | https://dev.twitch.tv/console/apps | Les deux |
| GitHub | https://github.com/settings/developers | Les deux |

Chaque provider permet d'enregistrer plusieurs redirect URIs. Enregistrer les 2 (dev + prod).

---

## 13. Planning

| Jour | Tache | Livrable |
|---|---|---|
| **J1 matin** | Creer les 5 OAuth apps + obtenir clientId/clientSecret | Credentials dans .env |
| **J1 apres-midi** | `oauth/config.ts` + `oauth/verify.ts` (extrait de link-social-workflow) | Config testable, verify reutilisable |
| **J2 matin** | `oauth/exchange.ts` avec gestion des quirks par provider | Exchange testable en isolation |
| **J2 apres-midi** | `oauth/routes.ts` + modifier `index.ts` | Routes montees et accessibles |
| **J3 matin** | Modifier Explorer `oauthService.ts` (prefixe `/oauth`) | Frontend branche sur nouveau endpoint |
| **J3 apres-midi** | Test E2E : connecter Spotify depuis Explorer dev local | Flow complet marche |
| **J4** | Tester les 5 plateformes + fix quirks + rebuild Docker + deploy Phala | Tout live en prod |

---

## 14. Tests de verification

### Test 1 — Route authorize (curl)

```bash
curl -I "http://localhost:4111/oauth/spotify/authorize?redirect_uri=http://localhost:5173/auth/callback&state=test123"

# Attendu :
# HTTP/1.1 302 Found
# Location: https://accounts.spotify.com/authorize?client_id=xxx&response_type=code&...
```

### Test 2 — Route callback (curl, avec un vrai code)

```bash
# D'abord obtenir un code en completant le flow dans le browser
curl -X POST http://localhost:4111/oauth/spotify/callback \
  -H "Content-Type: application/json" \
  -d '{"code":"AQD...", "redirectUri":"http://localhost:5173/auth/callback"}'

# Attendu :
# { "success": true, "platformId": "spotify", "userId": "xxx", "username": "xxx",
#   "accessToken": "BQD...", "refreshToken": "AQD...", "expiresIn": 3600 }
```

### Test 3 — Flow complet dans l'Explorer

```
1. Ouvrir http://localhost:5173 (Explorer en dev)
2. Se connecter avec Privy
3. Aller sur Profile → Platforms (ou Interest page avec topic)
4. Cliquer sur "Connect" pour Spotify
5. Popup s'ouvre vers Spotify
6. Autoriser
7. Popup se ferme, statut Spotify passe a "Connected"
8. Le token est stocke en DB mastra
9. Le Triple on-chain est cree
10. Aller sur Profile → le score reputation utilise les metriques Spotify reelles
```

### Test 4 — Token persiste et utilisable par signal fetcher

```bash
curl -X POST http://localhost:4111/api/workflows/signalFetcherWorkflow/start-async \
  -H "Content-Type: application/json" \
  -d '{"inputData":{"platform":"spotify","walletAddress":"0x..."}}'

# Attendu :
# {
#   "result": {
#     "success": true,
#     "platformId": "spotify",
#     "fetchedAt": 1776...,
#     "metrics": {
#       "diversite_genres": 12,
#       "playlists_creees": 5,
#       "top_artists_count": 50
#     }
#   }
# }
```

---

## 15. Gestion des erreurs

| Scenario | Comportement attendu |
|---|---|
| Platform inconnue dans le redirect | 404 `{ error: 'unsupported_platform' }` |
| Credentials manquants (env var) | 500 `{ error: 'missing_credentials' }` au moment de l'exchange |
| Code d'authorization invalide | 400 `{ error: 'token_exchange_failed', details }` |
| Token retourne mais API provider rejette | 400 `{ error: 'verification_failed' }` |
| Rate limit sur provider | 500 avec message du provider |
| Refresh token manquant (pour YouTube notamment) | OK mais warning log — le user devra reconnecter dans 1h |

---

## 16. Securite

- `client_secret` **jamais** expose au frontend → uniquement en env var cote mastra
- Tokens chiffres AES-256-GCM **avant** stockage en DB via storeToken() existant
- State CSRF valide cote frontend (sessionStorage) — pas de validation cote backend
  (le frontend est le seul a connaitre le state, on ne peut pas le valider cote backend)
- Redirect URI valide cote provider (whitelist sur chaque dashboard)
- Routes OAuth avec `requiresAuth: false` car le user n'est pas encore authentifie au moment
  du redirect (c'est le but du flow OAuth)
- Le callback verifie le token en appelant l'API du provider avant de le retourner au frontend
- Tokens transitent en HTTPS uniquement (TEE Phala = HTTPS par defaut)

---

## 17. Apres le MVP — Phase V2

Choses a ajouter **apres** que les 5 plateformes marchent :

1. **Refresh token automatique** : job periodique qui refresh les tokens avant expiration
2. **Revocation** : endpoint pour deconnecter une plateforme (DELETE /oauth/:platform)
3. **Gestion multi-device** : aujourd'hui un token par (wallet, platform) → si le user se
   connecte depuis 2 devices, le dernier ecrase
4. **Audit log** : tracer les connexions/deconnexions pour debug
5. **Plateformes supplementaires** : Reddit, Strava, chess.com, ORCID (Phase 1 du signalMatrix)

---

## 18. Deploiement Phala

### Process

```bash
# 1. Implementation terminee, test local OK
cd core/sofia-mastra && pnpm run dev
# → curl test des routes /oauth/*

# 2. Build Docker depuis core/
cd core/
docker build -f sofia-mastra/phala-deploy/Dockerfile -t maximesaintjoannis/sofia-mastra:v1.6.0 .

# 3. Push
docker push maximesaintjoannis/sofia-mastra:v1.6.0

# 4. Phala Cloud dashboard :
#    - Mettre a jour tag image → v1.6.0
#    - Ajouter les 9 nouvelles env vars (CLIENT_ID/SECRET pour 5 providers)
#    - Redeployer (volume /dstack/data persiste → tokens existants gardes)

# 5. Verifier
curl -I https://<phala-url>/oauth/spotify/authorize?redirect_uri=https://0xsofia.com/auth/callback&state=test
# → Doit retourner 302 vers Spotify
```

### Impact ressources Phala — **negligeable**

| Metrique | Impact |
|---|---|
| CPU | 0 au repos, ~50ms par connexion OAuth (1 fetch HTTP) |
| RAM | ~0 MB (handlers dans le meme process Hono) |
| Disque | ~1 KB par token stocke en SQLite |
| Reseau | 1 requete HTTP sortante par connexion |
| Nouveau process | **Aucun** |

Les routes OAuth sont des handlers HTTP legers dans le serveur Hono qui tourne deja.
Pas de nouveau service, pas de nouveau port. Moins consommateur qu'un workflow Mastra.
