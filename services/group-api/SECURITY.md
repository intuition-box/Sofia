# group-api — Security notes

Audit de sécurité + rotation des secrets, **2026-06-10**.

## Verdict injection / exfiltration BDD

- **Pas d'injection SQL possible** : tout passe par Prisma (requêtes paramétrées),
  aucun `$queryRaw`/concaténation. La requête indexer ([indexer.ts](src/indexer.ts))
  utilise une variable GraphQL `$termId`, pas d'interpolation. `answers` stocké en
  JSON via Prisma (échappé).
- Les vrais risques étaient l'**accès** (backdoor dev) et l'**exfiltration** (secrets
  exposés), pas l'injection.

## Correctifs appliqués

### 1. Backdoor dev désactivé de force en prod — [env.ts](src/env.ts)

`authMiddleware` ([auth.ts](src/auth.ts)) accepte une impersonation de wallet via les
en-têtes `x-dev-token` + `x-dev-wallet` quand `DEV_SEED_TOKEN` est défini. C'était une
clé maîtresse (lire/écrire la BDD comme n'importe quel wallet, se nommer OWNER via
`/dev/seed-owner`).
→ `devSeedToken` est maintenant forcé à `''` quand `NODE_ENV=production`. Le backdoor
est physiquement inexécutable en prod, même si la variable traîne dans l'environnement.
Un `DEV_SEED_TOKEN` présent en prod est loggé en erreur au boot.

### 2. Validation / plafond sur les écritures — [applications.ts](src/routes/applications.ts)

`sanitizeAnswers()` : rejette `answers` non-objet (400) ou > 8 Ko (413). `note` borné à
1000 caractères. Empêche un appelant authentifié de stocker des blobs arbitraires.

## Rotation des secrets (tous avaient été exposés en clair)

| Secret                | Gravité                               | État                                 |
| --------------------- | ------------------------------------- | ------------------------------------ |
| `DATABASE_URL` (Neon) | 🔴 critique (accès direct BDD)        | ✅ tournée                           |
| `PRIVY_APP_SECRET`    | 🟠 élevée (auth)                      | ✅ tourné                            |
| `ABLY_API_KEY`        | 🟡 faible (pub/sub notifs temps-réel) | ⏳ ancienne clé supprimée, à recréer |

Le `.env` est gitignoré et **n'a jamais été commité** (vérifié) — rotation par précaution
car les valeurs avaient transité dans une session d'assistance.

## Blocker connu : Ably Control API ne crée pas de clé sur ce compte

`POST https://control.ably.net/v1/apps/{app}/keys` renvoie **toujours `40022 "Invalid
resource"`**, quel que soit le body (testé : wildcard `*`, `notif:*`, `[*]*`, canal
concret, et copie exacte d'une clé existante). Les opérations `read`/`revoke` marchent.
→ Ce n'est ni le body ni la limite de clés : **restriction au niveau du plan/compte Ably**.

**Pour recréer une clé Ably :** passer par le **dashboard en fenêtre incognito**
(extensions désactivées — une extension wallet casse le formulaire avec le bug
`revocableTokens must be a boolean`). Capabilities : **Publish + Subscribe** uniquement.

## Sans clé Ably : dégradation gracieuse

`ABLY_API_KEY` vide → le push temps-réel est désactivé silencieusement
([ably.ts:28](src/ably.ts#L28)). Les notifs restent en base (`GET /me/notifications`),
visibles au refresh. Realtime = purement additif, pas vital.

## TODO restants

- [ ] Mettre `ABLY_API_KEY=` (vide) dans Coolify + redéployer (en attendant la nouvelle clé)
- [ ] Recréer une clé Ably propre (incognito, Publish+Subscribe) → `.env` + Coolify
- [ ] Supprimer le Control API token Ably sur https://ably.com/users/access_tokens
      (exposé en session — à faire **après** avoir recréé la clé)
- [ ] Confirmer côté Coolify prod que `DEV_SEED_TOKEN` est **absent**
