# Sofia Core — Plan post-audit

État au lendemain du commit `e9eda77e` (branche `feat/oauth-monorepo`).
Tous les chantiers du sprint P1 audit sont mergés. Ce document liste ce qui
reste, par ordre de priorité.

---

## P0 — Bloquants ou correctifs immédiats

### `apps/landing` — Webpack `ProgressPlugin` schema crash

**Symptôme** : `bun run --filter landing start` plante après ~419 lignes
de stack trace Webpack se terminant par une erreur de validation de schéma
sur `ProgressPlugin`.

**Périmètre** :
- Inspecter [apps/landing/plugins/webpack-plugin.cjs](apps/landing/plugins/webpack-plugin.cjs)
  — plugin custom, schéma probablement obsolète depuis un bump Webpack.
- Vérifier la version Docusaurus (3.8.1, mise à jour 3.10.0 dispo).
- Tester `git stash push apps/landing/` puis relancer pour confirmer que
  la régression est antérieure à nos modifs (très probable).

**Effort** : 1-2 h de debug.

---

### Documenter le contrat API Mastra ↔ frontends

**Symptôme** : `apps/explorer` et `apps/extension` consomment les endpoints
Mastra (`/signal-fetcher`, `/chatbot`, OAuth callback…) via `fetch` brut
non typé. Si Mastra refactor un endpoint, les frontends cassent silencieusement.

**Action** :
- Créer `services/mastra/API_CONTRACT.md` listant chaque route + payload
  request/response.
- Idéalement : exposer les Zod schemas Mastra dans `packages/graphql` (ou
  un nouveau `packages/api-contracts`) et les consommer côté frontends
  pour parser les réponses.

**Effort** : 2-3 h (doc) + 1 j (Zod cross-app).

---

## P1 — Dette technique de l'audit initial

### Bump `viem` 3.x → supprimer le wrapper `ox`

**Contexte** : `viem` 2.x dépend de `ox` 0.14 qui publie son source en `.ts`
brut. `skipLibCheck` ne fonctionne pas sur les `.ts`, donc tsc remonte des
erreurs internes ox impossibles à fixer côté applicatif. Mitigé par
[apps/extension/scripts/typecheck.sh](apps/extension/scripts/typecheck.sh)
qui filtre les blocs d'erreur ox via awk.

**Action quand viem 3 sort** :
1. `bun add viem@3 --filter extension`
2. Tester `bun run --filter extension typecheck` sans le wrapper
3. Si OK → remettre `"typecheck": "tsc --noEmit"` dans
   [apps/extension/package.json](apps/extension/package.json)
4. Supprimer [apps/extension/scripts/typecheck.sh](apps/extension/scripts/typecheck.sh)

**Effort** : 30 min (post-release viem 3).

---

### Migrer `apps/extension` et `apps/landing` vers `@0xsofia/design-system`

**Contexte** : `apps/explorer` consomme massivement `@0xsofia/design-system`
(60+ imports). `apps/extension` et `apps/landing` ré-implémentent localement
les mêmes composants Radix-UI / Tailwind (Avatar, Modal, Card, etc.).
**~30% de CSS / composants dupliqués** entre les apps.

**Action** :
- Audit composants : recenser les doublons (Avatar, Modal, NavSidebar,
  InterestCard, etc.).
- Migration progressive **un composant à la fois** :
  1. Vérifier que la version design-system supporte tous les usages.
  2. Remplacer dans extension/landing.
  3. Supprimer le composant local.
- Préserver les overrides spécifiques via props `className` / variants.

**Effort** : 1-2 sprints, en background.

---

### Erreurs silencieuses dans les services explorer

**Symptôme** : plusieurs services (`profileService`, `circleService`, etc.)
ont des `try/catch` qui swallow l'erreur en retournant `0` ou `[]` sans log.
Quand l'indexer down ou l'utilisateur sans réseau, l'UI affiche `0` sans
explication.

**Exemples** :
- [apps/explorer/src/services/profileService.ts:49-56](apps/explorer/src/services/profileService.ts) — `fetchSignalsCount` → `catch { return 0 }`
- [apps/explorer/src/services/circleService.ts:103-105](apps/explorer/src/services/circleService.ts) — `fetchFollowingCount` → `catch { return 0 }`

**Action** :
- Créer `apps/explorer/src/utils/logger.ts` (équivalent de
  `services/mcp-server/lib/logger.ts` mais browser).
- Wrapper `try/catch` avec `logger.error('context', err)` minimum.
- Optionnellement : remonter une erreur dans React Query au lieu de masquer.

**Effort** : 2-3 h.

---

### Sentry frontend (`apps/explorer`)

**Symptôme** : aucune visibilité sur les erreurs en production. Les
`RouteErrorBoundary` loggent juste à `console.error` qui disparaît.

**Action** :
1. `bun add @sentry/react --filter explorer`
2. Init dans `main.tsx` avec DSN env var
3. Wrap `<App>` avec `<Sentry.ErrorBoundary>` (ou hooker
   `RouteErrorBoundary` existant)
4. Source maps upload via build script (Vite plugin `@sentry/vite-plugin`)

**Effort** : 2 h.

---

### Web Vitals tracking

**Symptôme** : aucune mesure objective du sentiment "fast" recherché.
Le code splitting et la virtualisation à venir doivent être mesurés.

**Action** :
- `bun add web-vitals --filter explorer`
- Mesurer LCP, FID, CLS, INP, TTFB
- Pousser vers Sentry (si activé) ou un endpoint analytics maison

**Effort** : 1 h.

---

### `React.memo` + virtualisation des longues listes

**Symptôme** : sur les pages avec listes (`Leaderboard`, `CirclesPage`,
`DashboardPage` feed), pas de mémoization → re-render cascade au moindre
changement parent. Pas de virtualisation → 1000+ items = DOM thrashing.

**Action** :
- Wrapper `React.memo` sur les composants d'item de liste (`Post`,
  `CircleCard`, `LeaderboardRow`...).
- Intégrer `@tanstack/react-virtual` sur les feeds longs.
- Préserver `key` stable.

**Effort** : 1 j.

---

### `.env.example` par app

**Symptôme** : aucun `.env.example` par app (sauf `services/mastra` et
`packages/graphql`). Un nouveau dev découvre les variables à utiliser au
fur et à mesure des erreurs au runtime.

**Action** : créer un `.env.example` dans :
- `apps/explorer/.env.example` (Privy, OG_BASE_URL, MCP_TRUST_URL)
- `apps/extension/.env.example` (Privy, network, Mastra URL)
- `apps/og/.env.example` (Vercel KV)

**Effort** : 30 min.

---

### Dependabot / Renovate

**Symptôme** : aucune surveillance automatique des CVE / outdated.
viem, React, Next, Privy bougent vite — on prend des bugs/risques
sans le savoir.

**Action** : créer `.github/dependabot.yml` avec :
- Scope `npm` au monorepo (workspaces auto-détectés)
- Cadence hebdo
- Group bumps mineurs ensemble (sinon spam de PR)

**Effort** : 30 min.

---

## P2 — Polish & qualité de vie

### Audit des autres apps non couvertes

L'audit initial s'est focalisé sur `apps/explorer`. À faire pour les autres :

- `apps/extension` — gros chantier (services / hooks / cart system /
  echoes / quests) — référence : [apps/extension/.claude/CLAUDE.md](apps/extension/.claude/CLAUDE.md)
- `apps/landing` — Docusaurus, plugins custom, OAuth pages
- `apps/og` — Next.js / Vercel KV / image gen

**Effort** : 1 j par app.

---

### ESLint racine

**Symptôme** : seul `packages/graphql` a un script `lint` (et il est no-op).
Aucune règle React hooks, exhaustive-deps, no-console, etc. partagée.

**Action** :
- `bun add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
  eslint-plugin-react-hooks eslint-plugin-react`
- `eslint.config.mjs` flat config v9 racine
- Ajouter scripts `lint` + `lint:fix` dans `package.json` racine
- Ajouter le job `lint` dans [.github/workflows/ci.yml](.github/workflows/ci.yml)

**Effort** : 3-4 h (flat config moderne demande de la réflexion).

---

### Découplage `extension` ↔ `services/mastra` OAuth

**Contexte** : extension passe par mastra pour l'OAuth (Spotify, YouTube,
etc.). Si mastra refactor une route, extension casse. Coverage typage
absent.

**Action** : wrapper côté extension (`apps/extension/lib/services/MastraOAuthService.ts`)
qui centralise les fetch + Zod parse, comme bouclier.

**Effort** : 4 h.

---

### Skeleton states cohérents partout

**Symptôme** : certaines pages ont un skeleton (`Leaderboard` ✓), d'autres
un spinner, d'autres rien (flash blanc).

**Action** :
- Composant `<PageSkeleton variant="profile" | "feed" | "list" />` dans
  `@0xsofia/design-system`
- Utiliser comme `fallback` du `<Suspense>` racine et dans chaque page
  pendant `isLoading`.

**Effort** : 1 j.

---

### Versioning du `@0xsofia/design-system`

**Symptôme** : `version: "0.0.0"` figé, toutes les apps en `workspace:*`.
Un changement breaking propage immédiatement à toutes les apps sans
warning.

**Action** :
- Adopter SemVer dès `0.1.0`
- Considérer `changesets` pour gérer les bumps automatiquement
- Apps consument `^0.1.0` (compatible) au lieu de `*`

**Effort** : 2 h.

---

### Décision Nx / Turbo

**Contexte** : monorepo bun workspaces actuellement. Build root =
build de toutes les apps même si rien n'a changé. Ça reste rapide
avec 4 apps mais ne scale pas.

**Critère de bascule** :
- 6+ apps **OU** temps de build CI > 5 min → migrer vers **Turbo**
  (léger, bun-compatible, zéro changement de workspace).
- **Pas Nx** (trop lourd pour ce projet).

**Effort** : 4 h le jour J.

---

## Idées long terme (backlog)

- **Migration vers PostgreSQL Mastra** quand on aura de la traction
  utilisateur réelle (actuellement SQLite local persistant via volume
  DStack côté Phala — ça suffit pour l'alpha).
- **Multi-stage Dockerfile** pour mcp-server + mastra (images ~700MB
  → ~300MB avec multi-stage build).
- **OpenTelemetry** côté Mastra + MCP pour tracing distribué une fois
  Sentry déployé.
- **Lighthouse CI** dans le workflow GitHub Actions pour catch les
  régressions de perf.
- **Performance budgets** avec `size-limit` sur le bundle explorer.

---

## Suivi

À mettre à jour quand un item est traité (cocher la case ou supprimer la
section). Ce fichier est destiné à vivre avec le projet — il n'est pas
figé.
