# `@0xsofia/design-system` — Integration Plan

> Living document tracking the integration of the proto-explorer design into the Sofia monorepo.
>
> - **Branch**: `feat/design-system-package`
> - **Base**: `origin/dev`
> - **Owner**: Samuel (implementation), Maxime (architecture review)
> - **Status**: IN PROGRESS

---

## 1. Context

`proto-explorer` (vanilla TS + Vite, repo outside the monorepo) was built as the **new UI/UX direction** for the Sofia Explorer app. It is treated as a **Figma design reference** — not a library we import. The integration turns that reference into a shared React package inside the monorepo that both `apps/explorer` and (later) `apps/extension` consume.

### Scope of this wave
- Scaffold `packages/design-system/` as workspace `@0xsofia/design-system`.
- Consolidate duplicated taxonomy (intentions, level thresholds) into the package.
- Migrate **one** explorer component (`LastActivitySection`) to validate the pattern end-to-end.
- **OUT OF SCOPE**: touching `apps/extension/**`. Extension adoption is a separate wave after explorer validation.

### Guiding principles
1. **Proto = design reference only.** No copy-paste of vanilla template-literal functions into React. We rewrite the JSX, reuse the CSS classes and the pure TS helpers.
2. **Keep existing explorer file names + data hooks.** Replace the rendering only — protects GraphQL / Privy / chain wiring.
3. **Single source of truth.** Taxonomy lives in `packages/design-system`; apps consume from there.
4. **Peer deps, not direct deps, for shared runtime libs (React, three).** Prevents bundle duplication.
5. **One component at a time.** `LastActivitySection` ships fully before the next migration starts.

---

## 2. Architecture decisions (research-backed — April 2026)

Full research report archived in §10. TL;DR of what's baked into the scaffold:

### 2.1 Ship raw TypeScript source (no pre-build)

Matches the `@0xsofia/graphql` pattern already in the monorepo. Both consumers (Vite + Plasmo/Parcel) transpile TS natively, so no dist/build step is needed. Faster dev reloads, zero build coupling.

Migration path when publishing externally: drop in `tsup`, flip `exports` to `./dist/*`, bump version. Consumers on `workspace:*` auto-resolve — no code change required on their side.

### 2.2 Peer dependencies for `react`, `react-dom`, `three`

```json
{
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "three": ">=0.180.0"
  },
  "peerDependenciesMeta": {
    "three": { "optional": true }
  }
}
```

Why peer and not direct:
- Root `package.json` already has `"overrides": { "react": "18.2.0" }` that forces the entire dependency graph to 18.2.0. Peer range `^18.2.0` only advertises compatibility.
- Bun ≥1.3 honours `peerDependenciesMeta.optional` correctly ([bug fix #24272, Nov 2025](https://github.com/oven-sh/bun/pull/24272)).
- Prevents bundle duplication in both Vite and Parcel output.

**Three.js peer range is `>=0.180.0` (not `^0.183.0`)** so the current extension install (`three: ^0.180.0`) does not trigger a peer-dep warning. The proto was built against `0.183.x` — once extension adopts the design system we'll bump extension to match, but during the interim both apps need to resolve cleanly.

### 2.3 `sideEffects: ["**/*.css"]`

`"sideEffects": false` would drop unused imports too aggressively (including CSS). `sideEffects: ["**/*.css"]` keeps CSS imports while allowing tree-shaking of TS components. Vite treats CSS as side-effectful regardless ([vite #4389](https://github.com/vitejs/vite/issues/4389)), but the declaration is required for Parcel and future webpack consumers.

### 2.4 Ship raw CSS — never pre-compiled Tailwind

The 2026 rule for Tailwind v4 in monorepos:

> "Never ship compiled CSS from a package. Each app compiles its own Tailwind."

We export:
- `theme.css` — CSS custom properties as a plain `:root { --color-…: …; }` block PLUS a `[data-theme="dark"] { --color-…: …; }` override, usable with or without Tailwind.
- `styles/*.css` — component CSS using `var(--…)` tokens — plain selector-based (no Tailwind directives, no `@apply`).

**First-wave strategy = Option B (no Tailwind coupling).** Explorer currently ships Tailwind v4.1.3 as **pre-compiled CSS baked into `apps/explorer/src/index.css`** — Tailwind itself is not in `devDependencies`. So we do NOT assume Tailwind processing in the consumer. The design-system ships pure class-selector CSS that works regardless of whether the consumer runs Tailwind.

```css
/* apps/explorer/src/index.css — first-wave consumer pattern */
@import "@0xsofia/design-system/theme.css";
@import "@0xsofia/design-system/styles/bento.css";
```

If a later wave wires Tailwind v4 into explorer properly (Option A: add `tailwindcss` + `@tailwindcss/vite` to deps, rewrite `index.css` to `@import "tailwindcss"` + `@source`), the design-system keeps working without change — tokens are plain CSS vars either way.

### 2.5 Own `tsconfig.json` extending `tsconfig.base.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "jsx": "react-jsx" },
  "include": ["src/**/*"]
}
```

No Vitest config initially — tests added only when we introduce them. `typecheck` script runs `tsc --noEmit`.

### 2.6 Versioning

- Internal: `"version": "0.0.0"`, `"private": true`
- Consumer dependency form: `"@0xsofia/design-system": "workspace:*"`
- When publishing to npm later: flip `private`, add `publishConfig`, bump version, `bun publish`. Consumers need no change.

### 2.7 ManifestV3 CSP safety

Design-system will be CSP-neutral by construction:
- No `eval` / `new Function` in code.
- No inline `<script>` injection (we ship React components, not HTML templates).
- Three.js is used with pre-compiled shaders, safe under strict CSP.
- Style-src via inline `style={}` attributes is allowed by MV3 defaults.

### 2.8 Plasmo + Bun workspace gotchas to watch for (extension wave)

These do NOT affect explorer, but must be addressed when the extension consumes the package:

| Issue | Mitigation |
|-------|-----------|
| Plasmo can't find React if only in root package.json | `apps/extension/package.json` must list `react`, `react-dom`, `three` as direct deps |
| Parcel struggles with symlinked virtual stores | Add `.parcelrc` with `@parcel/resolver-default` if resolution fails |
| Empty `.d.ts` for workspace React components | Fallback: pre-build types with `tsup` |

---

## 3. Branch & commit strategy

### Preflight (must be done before commit #1)

1. **Rebase after Wave 3 merges.** Wave 3 (services/og/landing move) is landing before this branch. When Wave 3 is merged to `dev`, rebase `feat/design-system-package` onto latest `dev`. Zero conflicts expected (Wave 3 touches `services/` + new apps, this branch touches `packages/design-system/` + `apps/explorer/`), but the branch state must be current.
2. **GraphQL package rename.** `@0xsofia/dashboard-graphql` was renamed to `@0xsofia/graphql` in Wave 2b. Any import of shared GraphQL types in the design-system (if we end up needing them) must use the new name.
3. **Tailwind strategy confirmed = Option B.** Explorer ships Tailwind v4.1.3 as pre-compiled CSS baked into `src/index.css`; Tailwind itself is NOT in its deps. Design-system ships plain class-selector CSS that works without Tailwind processing. If a later wave installs `tailwindcss` + `@tailwindcss/vite` (Option A) the design-system requires no change.
4. **Three.js peer range** = `>=0.180.0` (matches extension's current `^0.180.0`). Bump extension to `0.183.x` only when it adopts the design-system.
5. **Atom IDs consolidation** — confirmed as §5 includes `apps/extension/lib/config/topicConfig.ts` (derived from explorer's `atomIds.ts`). Target single source in `src/taxonomy/atom-ids.ts`.
6. **Visual preview before merge** — the palette shift (soft pastel → vivid bento) changes `LastActivitySection` appearance. Ship a before/after screenshot to design for sign-off BEFORE merging the first migrated component.

### Branch
- Name: `feat/design-system-package`
- Base: `origin/dev` (after Wave 3 merge — see preflight #1)
- Merge target: `dev` (PR when `LastActivitySection` migration is green AND design has signed off on palette — see preflight #6)

### Commit split (target)
1. `chore(design-system): scaffold package` — package.json, tsconfig, folder skeleton, INTEGRATION.md
2. `feat(design-system): consolidate intention taxonomy` — superset merge of extension + explorer configs
3. `feat(design-system): port level calculation helpers` — copy `levelCalculation.ts` from extension
4. `feat(design-system): theme.css + shared styles` — tokens + bento/favicon/verb-tag CSS from proto
5. `feat(design-system): primitive components` — `FaviconWrapper`, `VerbTag`, `UserBadge`
6. `feat(design-system): GroupBentoCard + buildIntentionGroups hook`
7. `chore(explorer): depend on @0xsofia/design-system`
8. `refactor(explorer): migrate LastActivitySection to bento grid`
9. `chore(explorer): drop local intentions.ts after migration`

Later waves (separate branches/PRs):
- `refactor(explorer): migrate remaining profile components`
- `feat(design-system): CompileActionButton (three.js)`
- `chore(extension): adopt @0xsofia/design-system`

---

## 4. Package structure

```
packages/design-system/
├── package.json                        # @0xsofia/design-system, workspace
├── tsconfig.json                       # extends ../../tsconfig.base.json
├── INTEGRATION.md                      # this document
├── README.md                           # usage examples for consumers
├── src/
│   ├── index.ts                        # public exports barrel
│   ├── theme.css                       # @theme { --color-*, --space-*, … }
│   ├── taxonomy/
│   │   ├── intentions.ts               # INTENTION_CONFIG superset
│   │   ├── predicates.ts               # PREDICATE_IDS + *_TO_INTENTION maps
│   │   ├── topics.ts                   # SOFIA_TOPICS (from explorer)
│   │   ├── quests.ts                   # QUEST_BADGES (from explorer)
│   │   └── index.ts
│   ├── level/
│   │   └── calculation.ts              # calculateLevel, calculateLevelProgress, LEVEL_THRESHOLDS
│   ├── components/
│   │   ├── FaviconWrapper.tsx
│   │   ├── VerbTag.tsx
│   │   ├── UserBadge.tsx
│   │   └── GroupBentoCard.tsx
│   ├── hooks/
│   │   └── useIntentionGroups.ts       # buildIntentionGroups + sort helpers
│   └── styles/
│       ├── bento.css
│       ├── favicon.css
│       └── verb-tag.css
```

### Final `package.json`

```json
{
  "name": "@0xsofia/design-system",
  "description": "Sofia design system — shared taxonomy, components, hooks, and styles.",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "module": "./src/index.ts",
  "types": "./src/index.ts",
  "sideEffects": ["**/*.css"],
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    },
    "./theme.css": "./src/theme.css",
    "./styles/bento.css": "./src/styles/bento.css",
    "./styles/favicon.css": "./src/styles/favicon.css",
    "./styles/verb-tag.css": "./src/styles/verb-tag.css"
  },
  "files": ["src"],
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "three": ">=0.180.0"
  },
  "peerDependenciesMeta": {
    "three": { "optional": true }
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/three": ">=0.180.0",
    "typescript": "^5.6.0"
  }
}
```

---

## 5. Intention taxonomy — superset plan

Four sources to coordinate (not just two):

| Source | Current contents | Fate |
|--------|------------------|------|
| `apps/extension/types/intentionCategories.ts` | 8 types, full `IntentionConfigEntry` (label, color, gradientEnd, cssClass, intentionPurpose, predicateLabel) + helpers | **Base** — move to `src/taxonomy/intentions.ts` as-is |
| `apps/explorer/src/config/intentions.ts` | `INTENTION_COLORS` (with Attending/Valued/is following), `PREDICATE_TO_INTENTION`, `LABEL_TO_INTENTION`, `QUEST_BADGES`, `getSideColor`, `intentionBadgeStyle` | **Merge**: extra labels → `src/taxonomy/intentions.ts` as auxiliary map; predicate maps → `src/taxonomy/predicates.ts`; quest badges → `src/taxonomy/quests.ts`; helpers beside |
| `apps/explorer/src/config/taxonomy.ts` | `SOFIA_TOPICS` (14 topics × categories × niches) — human-readable structure | **Move** to `src/taxonomy/topics.ts` |
| `apps/explorer/src/config/atomIds.ts` **AND** `apps/extension/lib/config/topicConfig.ts` | `TOPIC_ATOM_IDS`, `CATEGORY_ATOM_IDS`, `TOPIC_LABELS`, `TOPIC_COLORS` — on-chain atom term_ids, auto-generated from cached GraphQL. Extension file is derived from explorer's `atomIds.ts` (docstring confirms). | **Move the shared parts** (`TOPIC_ATOM_IDS`, `TOPIC_LABELS`, `TOPIC_COLORS`) to `src/taxonomy/atom-ids.ts` in the design-system. Keep the regeneration script in explorer (`scripts/sync-atom-ids.py`) — it writes to the design-system file afterwards. Extension imports from design-system instead of its local copy. |

### Slug naming — reconciled
Three conventions exist in the codebase today:

| Slug set | Files | Status |
|----------|-------|--------|
| **Canonical (long)** — `tech-dev`, `design-creative`, `music-audio`, `gaming`, `web3-crypto`, `science`, `sport-health`, `video-cinema`, `entrepreneurship`, `performing-arts`, `nature-environment`, `food-lifestyle`, `literature`, `personal-dev` | `apps/extension/lib/config/topicConfig.ts`, `apps/explorer/src/config/atomIds.ts`, `apps/explorer/src/hooks/useTopicSync.ts`, `apps/explorer/src/pages/AllPlatformsPage.tsx`, `apps/explorer/src/config/platformCatalog.ts` | Already dominant |
| Short (explorer taxonomy.ts) — `design`, `music`, `gaming`, `web3`, etc. | `apps/explorer/src/config/taxonomy.ts` only | 1 outlier |
| Short (proto) — same shorthand as explorer taxonomy.ts | `proto-explorer` (reference only) | Out of monorepo |

**Decision: adopt long slugs as canonical.** They match atom IDs (on-chain immutable source of truth) and are already the dominant convention inside explorer. The only code to update is `apps/explorer/src/config/taxonomy.ts` (now moved into design-system as `src/taxonomy/topics.ts`), and the proto translation at component-port time.

**No public URL breakage**: explorer routes are dynamic (`/profile/interest/:topicId`), no hardcoded `/t/design` to redirect.

### Color divergence (to resolve with design)

| Intention | Extension (bento) | Explorer (soft pastel) | Default pick |
|-----------|------------------|------------------------|---------|
| Trusted | `#22C55E` | `#6DD4A0` | Bento |
| Work | `#3B82F6` | `#7BADE0` | Bento |
| Learning | `#06B6D4` | `#5CC4D6` | Bento |
| Fun | `#F59E0B` | `#E4B95A` | Bento |
| Inspiration | `#8B5CF6` | `#A78BDB` | Bento |
| Buying | `#EC4899` | `#D98CB3` | Bento |
| Music | `#FF5722` | `#E0896A` | Bento |
| Distrusted | `#EF4444` | `#E87C7C` | Bento |

Default of the design-system = **extension palette** (vivid, matches proto). Explorer re-skins at migration time. Final call awaits design sign-off — note in § 8.

---

## 6. TDD workflow for `LastActivitySection` migration

Following the `/tdd-workflow` RED → GREEN → IMPROVE cycle.

### RED — write failing test first

`apps/explorer/src/components/profile/LastActivitySection.test.tsx`

Coverage targets:
- Renders a `.bento-grid` with one `<GroupBentoCard>` per domain bucket
- Applies `LVL {level}` badge from `calculateLevel(certifiedCount)`
- Shows `.cert-dot` per intention type present in the group
- Filters out quest items (unchanged behavior)
- Preserves the `loading` skeleton path

Run: `bun run --filter explorer test` → test fails because component still renders old layout.

### GREEN — minimal implementation

1. Rewrite `LastActivitySection.tsx`:
   - Import `GroupBentoCard` + `buildIntentionGroups` from `@0xsofia/design-system`.
   - Keep `useAllActivity` hook unchanged.
   - Replace `.las-grid` + `ActivityCard` loop with `.bento-grid` + `<GroupBentoCard>`.
2. Import `@0xsofia/design-system/styles/bento.css` in `apps/explorer/src/index.css`.
3. Add `@source "../../../packages/design-system/src/**/*.{ts,tsx}"` to the explorer's `index.css`.
4. Run tests → pass.

### IMPROVE

- Extract any inline style to a CSS class in `packages/design-system/src/styles/bento.css`.
- Tighten props typing.
- Run `bun run --filter explorer typecheck` and `bun run --filter explorer build`.

### Per-migration validation checklist

- [ ] Component file keeps its original path + export name
- [ ] Data hooks (`useAllActivity`, `useTopClaims`, etc.) untouched
- [ ] Old CSS classes removed from explorer
- [ ] New classes loaded via `@0xsofia/design-system/styles/*.css`
- [ ] No duplicated taxonomy imports (everything flows through the package)
- [ ] `bun run --filter explorer typecheck` green
- [ ] `bun run --filter explorer build` green
- [ ] Manual visual check against proto reference (screenshot side-by-side)

---

## 7. What we do NOT touch this wave

- `apps/extension/**` — extension keeps `intentionCategories.ts` local until explorer migration is validated and merged.
- GraphQL schema / codegen — owned by `@0xsofia/graphql`.
- Privy / Wagmi / chain wiring — no change.
- Routing, auth, realtime — no change.

---

## 8. Resolved decisions (from design / Maxime)

- [x] **Palette choice** → **the proto palette wins.** Same values as the extension's `INTENTION_CONFIG` (vivid: `#22C55E`, `#3B82F6`, `#06B6D4`, `#F59E0B`, `#8B5CF6`, `#EC4899`, `#FF5722`, `#EF4444`). Explorer re-skins at migration.
- [x] **Theme switcher** → **yes, explorer has white/dark mode.** The proto is the source of truth for how tokens adapt. `theme.css` exposes tokens via `@theme` for light and a `[data-theme="dark"]` override block. Components reference tokens via `var(--…)` — no hardcoded hex beyond the dark override.
- [x] **Three.js bundling** → **peerDep, firm.** Reason: three.js has singletons (WebGLRenderer, Scene internals) that break if two instances coexist, and duplicating ~600kb in each bundle is wasteful.
- [ ] **`packages/core-types`** → **deferred.** Scope it only if a non-React consumer (mastra service, mcp-server) needs `IntentionType` / `IntentionConfigEntry`. For now, those live in `@0xsofia/design-system/taxonomy/intentions` and React-free consumers can import the TS file directly since it has no React dependency. Revisit if the import path annoys someone.

### Still open
- None blocking the first wave.

---

## 9. Follow-up waves (post-merge)

1. **Component coverage** — remaining explorer profile components (`InterestsGrid`, `TopClaimsSection`, `ProfileHeader`, `ScoreView`, `PlatformGrid`, `OverviewTab`, `NicheSelector`, `NicheDetailList`, `ShareProfileModal`).
2. **`CompileActionButton`** — port the proto's three.js compile animations (Merge / Intersect / Subtract / Contrast) as a dedicated component consumed by Compose and Results pages.
3. **Extension adoption** — swap `apps/extension/types/intentionCategories.ts` to import from `@0xsofia/design-system`. Validate Plasmo/Parcel resolution, patch with `.parcelrc` if needed.
4. **Dead-code pass** — remove orphan CSS in `apps/explorer/src/index.css` after migrations.
5. **Storybook** (optional) — document primitives.

---

## 10. Research report (April 2026)

### Q1: Raw TS vs pre-built package

**Decision: raw TypeScript source, like `@0xsofia/graphql`.**

- Both consumers transpile TS natively. No build-step gap.
- Raw source gives instant dev reloads.
- tsup/tsdown is the 2026 default for *published* libraries ([PkgPulse, 2026](https://www.pkgpulse.com/blog/tsup-vs-unbuild-vs-pkgroll-typescript-library-bundling-2026)) — overkill for internal `workspace:*`.
- Migration path when publishing: drop in tsup, flip exports to `./dist/*`, bump version. Consumers on `workspace:*` auto-resolve.

### Q2: ManifestV3 CSP constraints

**Decision: keep the package CSP-neutral by construction.**

- MV3 default: `script-src 'self' 'wasm-unsafe-eval'; object-src 'self'` — cannot be relaxed for scripts ([Chrome docs](https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy)).
- No `eval`, `new Function`, remote code, inline `<script>`.
- Inline `style={}` attributes work (style-src default allows them).
- Three.js standard use is CSP-safe ([CSP React guide](https://www.xjavascript.com/blog/how-to-use-react-without-unsafe-inline-javascript-css-code/)).

### Q3: Peer dependencies + root overrides

**Decision: `react`/`react-dom`/`three` as peerDependencies, `three` optional.**

- Sofia root already has `"overrides": { "react": "18.2.0" }` — forces the entire graph regardless of peer ranges ([pnpm overrides docs](https://pnpm.io/next/settings#overrides)).
- Apps must list `react` as direct dep in their own `package.json` because Plasmo scans it ([Plasmo PR #864](https://github.com/PlasmoHQ/plasmo/pull/864), [Bug #779](https://github.com/PlasmoHQ/plasmo/issues/779), [Bug #1277](https://github.com/PlasmoHQ/plasmo/issues/1277)).
- Bun ≥1.3 supports `peerDependenciesMeta.optional` ([PR #24272](https://github.com/oven-sh/bun/pull/24272)). Sofia runs post-1.3.

### Q4: CSS distribution

**Decision: ship raw CSS (tokens + utility classes). Apps compile Tailwind themselves.**

Consensus from the 2025/2026 Tailwind v4 monorepo community:

> "Don't declare Tailwind CSS inside the UI package. Never ship compiled CSS."
> — [StackOverflow — Tailwind v4 in monorepo](https://stackoverflow.com/questions/79797462/how-to-properly-configure-tailwind-v4-with-tailwindcss-vite-in-a-monorepo-for-s)

Consumer pattern:

```css
@import "tailwindcss";
@import "@0xsofia/design-system/theme.css";
@source "../../../packages/design-system/src/**/*.{ts,tsx}";
@import "@0xsofia/design-system/styles/bento.css";
```

Confirmed by [Dreamineering Tailwind v4 monorepo](https://mm.dreamineering.com/docs/software/products/engineering/ui-design-systems/tailwindcss). Plasmo 2.10+ supports this pattern ([PR #1337](https://github.com/PlasmoHQ/plasmo/pull/1337)).

### Q5: Tree-shaking + sideEffects

**Decision: `"sideEffects": ["**/*.css"]`.**

- `sideEffects: false` drops CSS imports → breaks the theme import.
- Omitting the field marks everything side-effectful → breaks tree-shaking of TS.
- Array form is the right balance ([Vite issue #4389](https://github.com/vitejs/vite/issues/4389)).

### Q6: Testing + TypeScript

**Decision: own `tsconfig.json` extending `tsconfig.base.json`. No test runner until tests exist.**

Mirror `@0xsofia/graphql`'s pattern: minimal tsconfig, own `typecheck` script. Add Vitest at package level only when we have a test suite.

### Q7: Versioning

**Decision: `"version": "0.0.0"`, `"private": true`, consumers use `"workspace:*"`.**

Bun's `workspace:*` is identical to pnpm's ([Bun docs](https://bun.sh/docs/pm/workspaces)). At publish time Bun rewrites `workspace:*` → actual version. No consumer change when externalizing.

### Q8: Plasmo Parcel + Bun workspace gotchas

Extension wave will need:
- `apps/extension/package.json` explicitly lists `react`, `react-dom`, `three`
- `.parcelrc` ready if resolution fails ([Plasmo bug #1331](https://github.com/PlasmoHQ/plasmo/issues/1331))
- Bun ≥1.3 isolated linker (default) avoids `.bun` virtual store issues ([Bun issue #16656](https://github.com/oven-sh/bun/issues/16656))
- Nested workspace globs: keep everything in root `package.json` ([Bun bug #28850](https://github.com/oven-sh/bun/issues/28850))

### Sources

1. [PkgPulse — tsup vs unbuild vs pkgroll 2026](https://www.pkgpulse.com/blog/tsup-vs-unbuild-vs-pkgroll-typescript-library-bundling-2026)
2. [PkgPulse — TypeScript-First Build Tools 2026](https://www.pkgpulse.com/blog/best-typescript-first-build-tools-2026)
3. [Bun — Workspaces docs](https://bun.sh/docs/pm/workspaces)
4. [Bun #28850 — nested workspace globs](https://github.com/oven-sh/bun/issues/28850)
5. [Bun #16656 — isolated installs](https://github.com/oven-sh/bun/issues/16656)
6. [Bun PR #24272 — optional peer fix](https://github.com/oven-sh/bun/pull/24272)
7. [Plasmo #779 — React in monorepo](https://github.com/PlasmoHQ/plasmo/issues/779)
8. [Plasmo #934 — submodule React](https://github.com/PlasmoHQ/plasmo/issues/934)
9. [Plasmo #1277 — pnpm workspaces React missing](https://github.com/PlasmoHQ/plasmo/issues/1277)
10. [Plasmo #1331 — pnpm symlink resolution](https://github.com/PlasmoHQ/plasmo/issues/1331)
11. [Plasmo PR #864 — NPM workspaces React detection](https://github.com/PlasmoHQ/plasmo/pull/864)
12. [Plasmo PR #1337 — vanilla-extract + Parcel 2.10](https://github.com/PlasmoHQ/plasmo/pull/1337)
13. [Chrome — MV3 CSP reference](https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy)
14. [xjavascript — React without unsafe-inline](https://www.xjavascript.com/blog/how-to-use-react-without-unsafe-inline-javascript-css-code/)
15. [Dreamineering — Tailwind v4 monorepo](https://mm.dreamineering.com/docs/software/products/engineering/ui-design-systems/tailwindcss)
16. [StackOverflow — Tailwind v4 shared UI monorepo](https://stackoverflow.com/questions/79797462/how-to-properly-configure-tailwind-v4-with-tailwindcss-vite-in-a-monorepo-for-s)
17. [Mavik Labs — Tailwind v4 design tokens 2026](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026)
18. [Gist by dvins — Overriding peer dep with PNPM](https://gist.github.com/dvins/33b8fb52480149d37cdeb98890244c5b)
19. [Vite #4389 — CSS sideEffects](https://github.com/vitejs/vite/issues/4389)
20. [Parcel #7219 — workspace React .d.ts](https://github.com/parcel-bundler/parcel/issues/7219)
