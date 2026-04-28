# OAuth Phase 1 — Credentials Setup Guide

> 6 nouvelles plateformes a connecter : Reddit, Strava, SoundCloud, Mixcloud, Product Hunt, ORCID
> Redirect URI a configurer partout :
>
> - Dev local : `http://localhost:5173/auth/callback`
> - Prod : `https://explorer.sofia.intuition.box/auth/callback`

---

## 1. Reddit

### Dashboard

https://www.reddit.com/prefs/apps

### Steps

1. Scroll en bas → **"Create App"** ou **"Create Another App"**
2. Remplir :
   - **Name** : `Sofia Explorer`
   - **Type** : selectionner **"web app"** (pas "script" ou "installed app")
   - **Description** : (optionnel) `Web3 reputation dashboard`
   - **About URL** : `https://explorer.sofia.intuition.box`
   - **Redirect URI** : `https://explorer.sofia.intuition.box/auth/callback`
     - Note : Reddit ne supporte qu'UNE SEULE redirect URI par app. Pour tester en dev, creer une 2e app dediee dev avec `http://localhost:5173/auth/callback`
3. Cliquer **"Create app"**
4. **Client ID** : la chaine courte juste sous "web app" (ex: `AbCdEfGhIj12345`)
5. **Client Secret** : le champ `secret`

### Env vars a ajouter

```
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
```

### Quirks

- Reddit exige un header `User-Agent` explicite sur tous les appels API (deja gere dans le code)
- Auth utilise Basic auth header (deja gere dans config.ts via `useBasicAuthHeader: true`)
- `duration=permanent` dans les params pour obtenir un refresh token (deja gere)

---

## 2. Strava

### Dashboard

https://www.strava.com/settings/api

### Steps

1. Si pas deja une app : scroll en bas du formulaire **"My API Application"**
2. Remplir :
   - **Application Name** : `Sofia Explorer`
   - **Category** : `Data Importer` ou `Visualizer`
   - **Club** : laisser vide
   - **Website** : `https://explorer.sofia.intuition.box`
   - **Authorization Callback Domain** : `explorer.sofia.intuition.box`
     - Note : Strava demande juste le DOMAINE (sans `https://` ni `/auth/callback`)
     - Pour le dev, Strava accepte `localhost` en Authorization Callback Domain
3. Upload une icone (optionnel mais recommande)
4. Cliquer **"Create"**
5. **Client ID** : visible en haut de la page
6. **Client Secret** : cliquer **"Show"** ou le champ est masque

### Env vars a ajouter

```
STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
```

### Quirks

- Strava utilise `,` comme separateur de scopes au lieu d'espace (deja gere dans config.ts via `scopeSeparator: ","`)
- Le refresh token Strava a une duree de vie limitee (6h pour l'access, 6 mois pour le refresh)
- Une seule "Authorization Callback Domain" par app — pour supporter dev + prod, creer 2 apps

---

## 3. SoundCloud

### Dashboard

https://soundcloud.com/you/apps

### Steps

⚠️ **IMPORTANT** : SoundCloud n'accepte plus de nouvelles API apps depuis 2020 sans raison commerciale forte. Si la demande est refusee :

- Option A : utiliser une app existante (si tu en as une)
- Option B : remplir le formulaire https://soundcloud.com/comments-feedback/apps en expliquant l'usage (reputation/scoring, lecture seule)
- Option C : skip SoundCloud jusqu'a approbation

### Si autorise :

1. **"Register a new application"**
2. Remplir :
   - **Name** : `Sofia Explorer`
   - **Description** : `Web3 reputation dashboard`
   - **Website** : `https://explorer.sofia.intuition.box`
   - **Redirect URI for Authentication Code Flow** : `https://explorer.sofia.intuition.box/auth/callback`
3. Sauvegarder → recuperer Client ID + Client Secret

### Env vars a ajouter

```
SOUNDCLOUD_CLIENT_ID=...
SOUNDCLOUD_CLIENT_SECRET=...
```

### Quirks

- SoundCloud utilise le header `Authorization: OAuth <token>` au lieu de `Bearer <token>` (deja gere dans verify.ts)
- Pas de scopes specifiques (on passe un array vide)

---

## 4. Mixcloud

### Dashboard

https://www.mixcloud.com/developers/

### Steps

1. Se connecter a Mixcloud
2. Cliquer **"Create a new application"**
3. Remplir :
   - **Name** : `Sofia Explorer`
   - **Description** : `Web3 reputation dashboard`
   - **Website** : `https://explorer.sofia.intuition.box`
   - **Redirect URI** : `https://explorer.sofia.intuition.box/auth/callback`
4. Sauvegarder → recuperer les credentials

### Env vars a ajouter

```
MIXCLOUD_CLIENT_ID=...
MIXCLOUD_CLIENT_SECRET=...
```

### Quirks

- Mixcloud accepte plusieurs redirect URIs (dev + prod sur la meme app)
- API tres stable, rarement de breaking changes
- Pas de scopes (array vide)

---

## 5. Product Hunt

### Dashboard

https://www.producthunt.com/v2/oauth/applications

### Steps

1. Cliquer **"Add an application"**
2. Remplir :
   - **Name** : `Sofia Explorer`
   - **Redirect URI** : `https://explorer.sofia.intuition.box/auth/callback`
   - **Description** : `Web3 reputation dashboard`
3. Cliquer **"Create application"**
4. Apres creation, la page affiche :
   - **API Key** (c'est le Client ID)
   - **API Secret** (c'est le Client Secret)
   - **Developer Token** (pas utilise pour OAuth, c'est pour les appels sans user)

### Env vars a ajouter

```
PRODUCTHUNT_CLIENT_ID=<API Key>
PRODUCTHUNT_CLIENT_SECRET=<API Secret>
```

### Quirks

- Product Hunt a UNE app = UNE redirect URI. Pour dev + prod, creer 2 apps
- L'API est GraphQL (deja gere dans le fetcher)
- Scope minimum `public` suffit pour lire le profil utilisateur

---

## 6. ORCID

### Dashboard

https://orcid.org/developer-tools

### Steps

1. Se connecter avec un compte ORCID (en creer un si besoin)
2. **"Register for the free ORCID public API"** → cliquer
3. Remplir :
   - **Name of your application** : `Sofia Explorer`
   - **Your website URL** : `https://explorer.sofia.intuition.box`
   - **Description** : `Web3 reputation dashboard`
   - **Redirect URIs** : ajouter les DEUX
     - `http://localhost:5173/auth/callback`
     - `https://explorer.sofia.intuition.box/auth/callback`
     - Note : ORCID accepte plusieurs redirect URIs sur la meme app
4. Sauvegarder → la page affiche :
   - **Client ID** : `APP-XXXXXXXXXXXXXXX`
   - **Client Secret** : `XXXXXXXX-...`

### Env vars a ajouter

```
ORCID_CLIENT_ID=APP-...
ORCID_CLIENT_SECRET=...
```

### Quirks

- ORCID retourne l'**orcid iD du user directement dans la reponse token exchange** (champ `orcid` dans le JSON). Pas besoin de faire un call supplementaire pour obtenir le userId.
- Scope `/authenticate` (literal, commence par un slash) suffit pour lire le profil
- L'access token est permanent (pas d'expiration)
- Possibilite d'etendre vers l'API Member (payante) plus tard pour ecriture

### Important

Le fetcher attend que `userId` soit l'ORCID iD (ex: `0000-0002-1825-0097`). Ca suppose que `exchange.ts` injecte l'ORCID iD dans le retour de l'exchange OU que linkSocialWorkflow le stocke. **A verifier** avant le deploy — sinon le fetcher throw "ORCID iD required to fetch metrics".

---

## Recap — 12 env vars a ajouter sur Phala Cloud

```
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
SOUNDCLOUD_CLIENT_ID=...
SOUNDCLOUD_CLIENT_SECRET=...
MIXCLOUD_CLIENT_ID=...
MIXCLOUD_CLIENT_SECRET=...
PRODUCTHUNT_CLIENT_ID=...
PRODUCTHUNT_CLIENT_SECRET=...
ORCID_CLIENT_ID=...
ORCID_CLIENT_SECRET=...
```

A ajouter aussi dans le `.env` local pour test dev.

---

## Checklist de deploiement

- [ ] Les 6 apps OAuth creees chez les providers
- [ ] Les 12 env vars ajoutees dans `.env` local
- [ ] `pnpm run dev` pour mastra → test local : `curl -I "http://localhost:4111/oauth/reddit/authorize?redirect_uri=http://localhost:5173/auth/callback&state=test"` → attendu `302 Found`
- [ ] Les 12 env vars ajoutees dans Phala Cloud dashboard
- [ ] Rebuild Docker image : `docker build -f sofia-mastra/phala-deploy/Dockerfile -t maximesaintjoannis/sofia-mastra:v1.8.0 .` (depuis `core/`)
- [ ] Push : `docker push maximesaintjoannis/sofia-mastra:v1.8.0`
- [ ] Phala dashboard → update image tag → redeploy
- [ ] Smoke test chaque plateforme :
  - [ ] Reddit
  - [ ] Strava
  - [ ] SoundCloud (si credentials)
  - [ ] Mixcloud
  - [ ] Product Hunt
  - [ ] ORCID
- [ ] Verifier signal fetcher sur chaque :
  ```
  curl -X POST "https://<phala>/api/workflows/signalFetcherWorkflow/start-async" \
    -H "Content-Type: application/json" \
    -d '{"inputData":{"platform":"reddit","walletAddress":"0x..."}}'
  ```

---

## ORCID — note technique sur l'userId

Le ORCID iD est retourne dans la reponse de l'exchange token, pas dans l'API `/me`. Regarde `exchange.ts` pour voir si le champ `orcid` du token response est propage comme `userId` dans `linkSocialWorkflow`. Si non, il faut ajouter un cas special :

```typescript
// Dans exchange.ts ou routes.ts, apres l'exchange ORCID :
if (platform === 'orcid' && data.orcid) {
  return {
    ...tokens,
    // inject orcid-id as userId for downstream use
    userIdHint: data.orcid,
  }
}
```

Et propager ce `userIdHint` jusqu'au `linkSocialWorkflow` qui le stocke comme `userId` dans la table `oauth_tokens`.

A tester apres le deploy — si ORCID fetcher retourne `"ORCID iD (userId) is required"`, c'est ce point qu'il faut fixer.
