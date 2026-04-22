# @0xsofia/design-system

Sofia design system — shared taxonomy, components, hooks, and styles consumed by `apps/explorer` and (soon) `apps/extension`.

Full architecture, migration plan, and TDD flow: [`INTEGRATION.md`](./INTEGRATION.md).

## Status

Scaffold + first-wave submodules landing incrementally on `feat/design-system-package`.

| Layer | Status | Notes |
|-------|--------|-------|
| Package scaffold (`package.json`, `tsconfig.json`, `index.ts`) | ✅ Done | Raw TS source, peer deps, `sideEffects: ["**/*.css"]` |
| `src/taxonomy/` — intentions, predicates, quests | ✅ Done | Consolidates extension + explorer configs |
| `src/level/` — level thresholds and progress math | ✅ Done | Ported from extension |
| `src/theme.css` + `src/styles/` | ⏳ Next | Tokens + bento/favicon/verb-tag CSS |
| `src/components/` — primitives (`FaviconWrapper`, `VerbTag`, `UserBadge`) | ⏳ Pending | |
| `src/components/GroupBentoCard` + `src/hooks/useIntentionGroups` | ⏳ Pending | |
| Explorer migration (pilot: `LastActivitySection`) | ⏳ Pending | |

## Usage

### TypeScript / React imports

```ts
import {
  // Taxonomy
  INTENTION_CONFIG,
  CERTIFICATION_COLORS,
  INTENTION_COLORS_BY_LABEL,
  CERTIFICATION_LIST,
  INTENTION_ITEMS,
  TRUST_ITEMS,
  type IntentionType,
  type IntentionPurpose,
  type IntentionConfigEntry,
  getIntentionColor,
  getIntentionBadge,
  getSideColor,
  intentionBadgeStyle,

  // Predicates
  PREDICATE_IDS,
  PREDICATE_TO_INTENTION,
  LABEL_TO_INTENTION,
  predicateLabelToIntentionType,

  // Quests
  QUEST_BADGES,
  type QuestBadge,

  // Level math
  LEVEL_THRESHOLDS,
  calculateLevel,
  calculateLevelProgress,
  type LevelProgress,
} from '@0xsofia/design-system'
```

### CSS imports (consumer pattern)

```css
/* apps/<app>/src/index.css */
@import "@0xsofia/design-system/theme.css";
@import "@0xsofia/design-system/styles/bento.css";
```

The package ships **plain class-selector CSS** — no Tailwind directives, no `@apply`. It works regardless of whether the consumer app compiles Tailwind. See `INTEGRATION.md` §2.4 for the reasoning.

## Peer dependencies

| Package | Range | Notes |
|---------|-------|-------|
| `react` | `^18.2.0` | Forced to `18.2.0` by the monorepo root `overrides` |
| `react-dom` | `^18.2.0` | Same |
| `three` | `>=0.180.0` | **Optional** — required only by `CompileActionButton` (later wave). Matches extension's current `^0.180.0`; bump both apps together when the extension adopts the design system. |

## Scripts

```bash
# Type-check package source
bun run --filter @0xsofia/design-system typecheck
```

## Directory layout

```
packages/design-system/
├── package.json              # @0xsofia/design-system, workspace
├── tsconfig.json             # extends ../../tsconfig.base.json
├── INTEGRATION.md            # architecture + migration plan
├── README.md                 # this file
└── src/
    ├── index.ts              # barrel — re-exports taxonomy + level
    ├── taxonomy/
    │   ├── intentions.ts     # INTENTION_CONFIG (8 types) + helpers
    │   ├── predicates.ts     # PREDICATE_IDS + label lookups
    │   ├── quests.ts         # QUEST_BADGES catalog
    │   └── index.ts
    └── level/
        ├── calculation.ts    # LEVEL_THRESHOLDS, calculateLevel*
        └── index.ts
```
