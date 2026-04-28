# Plan d'extension — OAuth2 roadmap complet (79 plateformes)

> Date : 17 avril 2026
> Cible : `core/sofia-mastra/` + `sofia-explorer/`
> Prerequis : `plan-oauth-routes.md` est implemente (routes /oauth/\* fonctionnelles)
> Etat actuel : 5 plateformes live (GitHub, Spotify, Discord, Twitch, YouTube)

---

## 1. Pourquoi ce plan

Le systeme OAuth marche (v1.6.0+ en prod). Il reste **79 plateformes OAuth2** et **3 plateformes OAuth1** a connecter.

**Chaque nouvelle plateforme = meme schema** :

1. Creer l'app OAuth sur le dashboard du provider
2. Obtenir `CLIENT_ID` + `CLIENT_SECRET`
3. Ajouter ces env vars sur Phala
4. Ajouter la config dans `OAUTH_PROVIDERS` (`oauth/config.ts`)
5. Ajouter le fetcher de metriques (`signals/<platform>.ts`)
6. Ajouter le support dans `verifyAndGetUserId` (`oauth/verify.ts`)
7. Enregistrer dans `METRIC_COMPONENTS` cote Explorer (`reputationScoreService.ts`)

Le travail est **repetitif mais simple**. Ce plan priorise les plateformes par phase.

---

## 2. Phases

### Phase 1 — Quick Wins (7 plateformes OAuth2)

Plateformes grand public, APIs stables, impact rapide sur le scoring.

| Plateforme   | ID            | Scopes proposes                           | Complexite                                      |
| ------------ | ------------- | ----------------------------------------- | ----------------------------------------------- |
| Reddit       | `reddit`      | `identity, read, mysubreddits`            | Facile — Bearer token classique                 |
| Strava       | `strava`      | `read, activity:read`                     | Facile — endpoints clairs                       |
| SoundCloud   | `soundcloud`  | (lecture publique)                        | Moyen — SoundCloud restreint les nouvelles apps |
| Last.fm      | `lastfm`      | (API key-based en fait — auth differente) | Moyen — pas vraiment OAuth2 standard            |
| Mixcloud     | `mixcloud`    | (lecture publique)                        | Facile                                          |
| Product Hunt | `producthunt` | (GraphQL API)                             | Moyen — GraphQL au lieu de REST                 |
| ORCID        | `orcid`       | `/authenticate`                           | Facile — standard academique                    |

### Phase 2 — Domaines cles (7 plateformes OAuth2)

Plateformes tech/creative qui enrichissent le scoring dev/design.

| Plateforme   | ID            | Scopes                     | Complexite                                   |
| ------------ | ------------- | -------------------------- | -------------------------------------------- |
| Figma        | `figma`       | `files:read`               | Facile                                       |
| Hugging Face | `huggingface` | (lecture profil + modeles) | Facile                                       |
| Kaggle       | `kaggle`      | (API key-based historique) | Moyen                                        |
| Steam        | `steam`       | OpenID                     | Moyen — pas OAuth2 classique, utilise OpenID |
| Duolingo     | `duolingo`    | (API non-officielle)       | Difficile — pas d'OAuth officiel             |
| Vercel       | `vercel`      | (read)                     | Facile                                       |
| Unsplash     | `unsplash`    | `public read_photos`       | Facile                                       |

### Phase 3 — Web3 natif (3 OAuth2 + 1 OAuth1)

Plateformes web3 avec OAuth.

| Plateforme | ID          | Stratégie                                 |
| ---------- | ----------- | ----------------------------------------- |
| Coinbase   | `coinbase`  | OAuth2 `wallet:user:read`                 |
| OpenSea    | `opensea`   | **api_key** — voir plan-non-oauth         |
| Lens       | `lens`      | **siwe** — voir plan-non-oauth            |
| Farcaster  | `farcaster` | **siwf** — voir plan-non-oauth            |
| The Graph  | `the-graph` | **public** on-chain — voir plan-non-oauth |

### Phase 4 — Difficile mais fort (4 plateformes OAuth2)

APIs restrictives ou partenariats necessaires.

| Plateforme | ID         | Obstacle                                            |
| ---------- | ---------- | --------------------------------------------------- |
| Behance    | `behance`  | API deprecated, peut retourner a la connexion Adobe |
| 500px      | `500px`    | API payante pour acces complet                      |
| LeetCode   | `leetcode` | GraphQL non-officiel stable                         |
| Bandcamp   | `bandcamp` | Pas d'OAuth officiel — voir plan-non-oauth          |

### Phase 5 — Partenariats requis (2 plateformes OAuth2)

| Plateforme | Obstacle                                           |
| ---------- | -------------------------------------------------- |
| Blizzard   | Partenariat Blizzard + Battle.net OAuth            |
| Riot Games | RSO (Riot Sign-On) — approbation explicite requise |

### Phase 6 — OAuth2 residuel (65 plateformes)

Toutes les autres OAuth2 du catalogue :

**Dev/Tech** : gitlab, bitbucket, stackoverflow, devto, hashnode, hackerrank, codepen, replit, netlify, notion, linear, todoist, medium, slack

**Creative** : dribbble, deviantart, sketchfab

**Video/Media** : vimeo, dailymotion, twitch, wattpad

**Music** : deezer, listenbrainz, musicbrainz, tidal, genius

**Social** : mastodon, bluesky, pinterest, x-twitter, linkedin, facebook, instagram, tiktok, snapchat

**Gaming** : lichess, riot-games, epic-games, gog, myanimelist, anilist, trakt

**Sport/Health** : garmin, polar, wahoo, komoot, fitbit, myfitnesspal

**Food/Lifestyle** : untappd, vivino, yelp, librarything, pocket, feedly, inaturalist, alltrails, openstreetmap, wikiloc, meetup, eventbrite

**Education** : khan-academy

**Commerce** : etsy, shopify

---

## 3. OAuth1 (3 plateformes) — non prioritaire

`discogs`, `flickr`, `tumblr`

OAuth1 est plus complexe (request token + verifier). **Recommendation : skip sauf demande specifique d'un user**. Ces plateformes ont peu d'impact pour un produit web3/dev.

Si un jour on les fait, ajouter un flow separe `/oauth1/:platform/authorize` avec echange en 3 etapes.

---

## 4. Template a suivre pour chaque nouvelle plateforme OAuth2

### Etape 1 — Creer l'app OAuth chez le provider

| Provider     | Dashboard                                         | Redirect URI a configurer                                                                    |
| ------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Reddit       | https://www.reddit.com/prefs/apps                 | `https://explorer.sofia.intuition.box/auth/callback` + `http://localhost:5173/auth/callback` |
| Strava       | https://www.strava.com/settings/api               | idem                                                                                         |
| Figma        | https://www.figma.com/developers/apps             | idem                                                                                         |
| Hugging Face | https://huggingface.co/settings/applications/new  | idem                                                                                         |
| Unsplash     | https://unsplash.com/oauth/applications           | idem                                                                                         |
| Vercel       | https://vercel.com/account/tokens → OAuth         | idem                                                                                         |
| Product Hunt | https://api.producthunt.com/v2/oauth/applications | idem                                                                                         |
| ORCID        | https://orcid.org/developer-tools                 | idem                                                                                         |
| ...          | ...                                               | idem                                                                                         |

Noter CLIENT_ID + CLIENT_SECRET (sans les coller dans le chat).

### Etape 2 — Ajouter env vars Phala

Ajouter dans le dashboard Phala :

```
REDDIT_CLIENT_ID=xxx
REDDIT_CLIENT_SECRET=xxx
```

### Etape 3 — Ajouter provider config

Dans `core/sofia-mastra/src/mastra/oauth/config.ts` :

```typescript
export const OAUTH_PROVIDERS: Record<string, OAuthProviderConfig> = {
  // existants (github, spotify, discord, twitch, youtube)
  // ...

  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    authUrl: 'https://www.reddit.com/api/v1/authorize',
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    scopes: ['identity', 'read', 'mysubreddits'],
    useBasicAuthHeader: true, // Reddit veut Basic auth
    extraAuthParams: { duration: 'permanent' }, // pour refresh token
  },

  strava: {
    clientId: process.env.STRAVA_CLIENT_ID!,
    clientSecret: process.env.STRAVA_CLIENT_SECRET!,
    authUrl: 'https://www.strava.com/oauth/authorize',
    tokenUrl: 'https://www.strava.com/oauth/token',
    scopes: ['read', 'activity:read'],
  },

  // ...
}
```

### Etape 4 — Ajouter au `verifyAndGetUserId`

Dans `core/sofia-mastra/src/mastra/oauth/verify.ts` :

```typescript
const OAUTH_ENDPOINTS = {
  // existants...
  reddit: {
    url: 'https://oauth.reddit.com/api/v1/me',
    authHeader: (token) => `Bearer ${token}`,
    // Reddit requiert User-Agent
    extraHeaders: { 'User-Agent': 'sofia-reputation/1.0' },
  },
  strava: {
    url: 'https://www.strava.com/api/v3/athlete',
    authHeader: (token) => `Bearer ${token}`,
  },
  // ...
}

// Ajouter la logique d'extraction du userId/username par plateforme :
case 'reddit':
  userId = data.id ? String(data.id) : undefined
  username = data.name ? String(data.name) : undefined
  break
case 'strava':
  userId = data.id ? String(data.id) : undefined
  username = data.username ? String(data.username) : undefined
  break
```

### Etape 5 — Creer le fetcher de metrics

Dans `core/sofia-mastra/src/mastra/signals/reddit.ts` :

```typescript
export async function fetchRedditSignals(
  token: string,
): Promise<Record<string, number>> {
  const headers = {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'sofia-reputation/1.0',
  }

  const [me, subs] = await Promise.all([
    fetch('https://oauth.reddit.com/api/v1/me', { headers }).then((r) =>
      r.json(),
    ),
    fetch('https://oauth.reddit.com/subreddits/mine/subscriber?limit=100', {
      headers,
    }).then((r) => r.json()),
  ])

  return {
    comment_karma: me.comment_karma || 0,
    link_karma: me.link_karma || 0,
    subreddits_actifs: subs.data?.children?.length || 0,
    anciennete_mois: monthsSince(new Date(me.created_utc * 1000)),
  }
}
```

Et register dans `signals/registry.ts` :

```typescript
import { fetchRedditSignals } from './reddit'

export const SIGNAL_FETCHERS = {
  // existants...
  reddit: fetchRedditSignals,
}
```

### Etape 6 — Ajouter au `METRIC_COMPONENTS` cote Explorer

Dans `sofia-explorer/src/services/reputationScoreService.ts` :

```typescript
const METRIC_COMPONENTS = {
  // existants...
  reddit: {
    comment_karma: 'community',
    link_karma: 'community',
    subreddits_actifs: 'community',
    anciennete_mois: 'anciennete',
  },
}
```

### Etape 7 — Deploy

1. Commit cote mastra
2. Rebuild Docker image (nouveau tag)
3. Push
4. Phala Cloud dashboard → update tag + add env vars
5. Redeploy

### Etape 8 — Smoke test

```bash
# Connect depuis Explorer
# Puis curl :
curl -s -X POST "https://<phala>/api/workflows/signalFetcherWorkflow/start-async" \
  -H "Content-Type: application/json" \
  -d '{"inputData":{"platform":"reddit","walletAddress":"0x..."}}'
# Verifier que metrics sont presentes
```

---

## 5. Automatisation — ce qu'on peut industrialiser

Apres quelques plateformes, on peut :

1. **Generator de fetcher** — script qui prompte "platformId, authUrl, tokenUrl, scopes..." et genere la config + un fetcher skeleton
2. **Fetcher template par pattern** — la plupart des fetchers suivent le meme pattern (GET /me + GET /stats). On peut avoir une factory `createSimpleFetcher({ profileEndpoint, metricsConfig })` pour reduire le boilerplate.
3. **Script de scaffold** — `scripts/add-platform.ts reddit` qui fait toutes les etapes 3-6 automatiquement.

---

## 6. Planning estime

| Phase             | Plateformes               | Effort par plateforme      | Total     |
| ----------------- | ------------------------- | -------------------------- | --------- |
| 1 (Quick Wins)    | 7                         | 1-2h chacune               | 1-2 jours |
| 2 (Domaines cles) | 7                         | 2-3h (API plus complexes)  | 2 jours   |
| 3 (Web3)          | 1 OAuth + reste non-OAuth | 1h chacune                 | 0.5 jour  |
| 4 (Difficile)     | 4                         | 3-4h                       | 1-2 jours |
| 5 (Partenariats)  | 2                         | Variable (attente externe) | —         |
| 6 (Residuel)      | 65                        | 1h chacune avec script     | 5-7 jours |

**Total MVP etendu (Phases 1-3)** : ~5 jours de travail concentre.

---

## 7. Quirks notables par provider

- **Reddit** : Basic auth header pour l'exchange, User-Agent obligatoire partout, `duration=permanent` pour obtenir un refresh token
- **Strava** : refresh token expire tous les 6 mois, il faut retester regulierement
- **ORCID** : token permanent, pas de refresh necessaire
- **Steam** : pas OAuth2 classique — utilise OpenID 2.0 (different flow)
- **Mastodon** : federalise, chaque instance a son propre OAuth — probleme de config (pas 1 seule `authUrl`)
- **Hugging Face** : token personnel (PAT) fonctionne aussi, pas obligatoirement OAuth
- **LinkedIn** : acces tres restrictif, scope `r_basicprofile` deprecated
- **Instagram/Facebook/TikTok** : Meta/Instagram Graph API demande une review Facebook, process long

---

## 8. Ce qui bloque certaines plateformes

| Plateforme                | Blocker              | Workaround                                                                |
| ------------------------- | -------------------- | ------------------------------------------------------------------------- |
| Steam                     | OpenID 2.0           | Implementer OpenID separement                                             |
| Mastodon                  | Instance-specific    | Permettre au user de choisir son instance, ou federer via une passerelle  |
| Duolingo                  | Pas d'OAuth officiel | API non-officielle via `www.duolingo.com/api/1/users/show` avec sessionid |
| Facebook/Instagram/TikTok | App review Meta      | Attendre approbation ou passer via API publique limitee                   |
| Blizzard, Riot            | Partenariat requis   | Skip pour MVP                                                             |

---

## 9. Decision — comment avancer

**Recommendation** :

1. **Faire Phase 1** (7 OAuth + chess.com en public = 8 plateformes) — a peu de jours de travail
2. **Tester l'impact** sur le scoring (regarder si les scores sont plus diversifies)
3. **Faire Phase 2** si Phase 1 montre de la valeur
4. **Automatiser** avant Phase 6 (script de scaffold)
5. **Skip** Phases 4/5 jusqu'a besoin utilisateur concret

Phase 3 est couvert dans `plan-non-oauth-platforms.md`.
