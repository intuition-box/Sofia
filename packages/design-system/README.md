# @0xsofia/design-system

Sofia design system — shared taxonomy, components, hooks, and styles consumed by `apps/explorer` and (soon) `apps/extension`.

Full architecture, migration plan, and TDD flow: [`INTEGRATION.md`](./INTEGRATION.md).

Flat per-page / per-component TODO mapping proto → target: [`MIGRATION.md`](./MIGRATION.md).

## Status

Scaffold + first-wave submodules landing incrementally on `feat/design-system-package`.

| Layer | Status | Notes |
|-------|--------|-------|
| Package scaffold (`package.json`, `tsconfig.json`, `index.ts`) | ✅ Done | Raw TS source, peer deps, `sideEffects: ["**/*.css"]` |
| `src/taxonomy/` — intentions, predicates, quests | ✅ Done | Consolidates extension + explorer configs |
| `src/level/` — level thresholds and progress math | ✅ Done | Ported from extension |
| `src/theme.css` + `src/styles/` | ✅ Done | Tokens (light/dark + predicate colors) + bento/favicon/verb-tag/user-badge CSS |
| `src/components/` — primitives (`FaviconWrapper`, `VerbTag`, `UserBadge`) | ✅ Done | React components consuming the CSS above |
| `src/components/GroupBentoCard` + `src/hooks/useIntentionGroups` | ✅ Done | Echoes composite card + bucketing / sorting helpers |
| `src/components/InterestsGrid` + `InterestCard` + `AddInterestCard` | ✅ Done | 3-column interests grid with hover-reveal color layer |
| `src/components/AppShell` + `NavSidebar` + `NavBrand` + `NavSection` + `NavItem` | ✅ Done | Root 3-column grid + left-rail nav primitives |
| `src/components/PageHero` | ✅ Done | Peach banner with Fraunces title + description + tilted deco square |
| Explorer dependency wired | ✅ Done | `apps/explorer` now depends on `@0xsofia/design-system` (workspace:*) |
| Explorer migration — `LastActivitySection` | ✅ Done | Bento grid + `useIntentionGroups` |
| Explorer migration — `InterestsGrid` | ✅ Done | Three-column interests grid with reveal layer |
| Explorer migration — left nav sidebar | ✅ Done | Replaces `Sidebar.tsx`; removes the two `zoom: 1.25` hacks |
| Explorer migration — profile page hero | ✅ Done | `<PageHero>` replaces `<PageHeader>` on `ProfilePage` |
| Explorer migration — profile layout polish | ✅ Done | Peach banner color, `.pf-view` max-width 1040px wrapper, Fraunces loaded, third `zoom: 1.25` removed from `RightSidebar`, `rs-aside` → 280px |
| Explorer migration — `TopClaimsSection` | ✅ Done | `INTENTION_COLORS_BY_LABEL` + `LABEL_TO_INTENTION` + `intentionBadgeStyle` + `FaviconWrapper` from design-system; drops local `predicateToIntention` + dead `.tc-favicon` CSS |
| `<SectionTitle>` + `section-title.css` | ✅ Done | Uppercase tracked eyebrow ported 1:1 from proto. Adopted on `ProfilePage` sections (Top Claims / Interests / Last Activity) |
| `<InterestHero>` + `interest-hero.css` | ✅ Done | Emoji + kicker + Fraunces title + description + Topic-score pill. 1:1 port of proto `.pf-interest-header`. Replaces explorer's `<PageHeader>` on `InterestPage`. Requires JetBrains Mono (added to `index.html`). |
| `<SubHeader>` + `sub-header.css` | ✅ Done | Breadcrumb-style header (back circle + `›` crumbs + right pill + description) ported from proto `subHeader`. Adopted on `DomainSelectionPage`, `NicheSelectionPage`, `DomainNicheSelectionPage`, `PlatformConnectionPage`. Proto unprefixed tokens remapped to `--ds-*`. |
| Profile drawer overlap fix | ✅ Done | `.main-content--profile { margin-right: 400px }` to match `ProfileDrawer`'s 400px width; all `/profile*` routes wrap content + hero inside `.pf-view` so nothing bleeds under the drawer. |

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
  displayLabelToIntentionType,

  // Predicates
  PREDICATE_IDS,
  PREDICATE_TO_INTENTION,
  LABEL_TO_INTENTION,
  predicateLabelToIntentionType,

  // Quests
  QUEST_BADGES,
  type QuestBadge,

  // Topic emoji
  TOPIC_EMOJI,
  getTopicEmoji,

  // Level math + colors
  LEVEL_THRESHOLDS,
  calculateLevel,
  calculateLevelProgress,
  type LevelProgress,
  LEVEL_TIER_COLORS,
  getLevelColor,
  getLevelColorAlpha,

  // Lib helpers
  formatDuration,

  // Hooks + pure helpers
  buildIntentionGroups,
  useIntentionGroups,
  pickDominantIntent,
  pickDominantColor,
  type IntentionActivityInput,
  type IntentionGroupWithStats,
  type BuildIntentionGroupsOptions,
  type EchoesSort,

  // Components
  FaviconWrapper,
  VerbTag,
  UserBadge,
  GroupBentoCard,
  InterestsGrid,
  InterestCard,
  AddInterestCard,
  USER_BADGE_COLORS,
  type FaviconWrapperProps,
  type VerbTagProps,
  type UserBadgeProps,
  type UserBadgeTier,
  type GroupBentoCardProps,
  type InterestsGridProps,
  type InterestCardProps,
  type AddInterestCardProps,
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

# Run the vitest unit tests
bun run --filter @0xsofia/design-system test

# Vitest in watch mode
bun run --filter @0xsofia/design-system test:watch
```

Current coverage: **48 tests across 4 files** — level math (boundaries, overrides, max-level), taxonomy lookups (label / badge / color helpers + reverse maps), intention-groups bucketing + filters + sort strategies, and duration formatting.

## Directory layout

```
packages/design-system/
├── package.json              # @0xsofia/design-system, workspace
├── tsconfig.json             # extends ../../tsconfig.base.json
├── INTEGRATION.md            # architecture + migration plan
├── README.md                 # this file
└── src/
    ├── index.ts              # barrel — re-exports taxonomy + level
    ├── theme.css             # light/dark tokens + predicate color vars
    ├── taxonomy/
    │   ├── intentions.ts     # INTENTION_CONFIG (8 types) + helpers
    │   ├── predicates.ts     # PREDICATE_IDS + label lookups
    │   ├── quests.ts         # QUEST_BADGES catalog
    │   ├── topic-emoji.ts    # TOPIC_EMOJI per canonical slug + getTopicEmoji
    │   └── index.ts
    ├── level/
    │   ├── calculation.ts    # LEVEL_THRESHOLDS, calculateLevel*
    │   ├── colors.ts         # getLevelColor, getLevelColorAlpha
    │   └── index.ts
    ├── lib/
    │   ├── formatDuration.ts   # "120" → "2m"
    │   └── index.ts
    ├── hooks/
    │   ├── useIntentionGroups.ts  # buildIntentionGroups + React hook + helpers
    │   └── index.ts
    ├── components/
    │   ├── FaviconWrapper.tsx     # <FaviconWrapper size=32 src="…" />
    │   ├── VerbTag.tsx            # <VerbTag intent="work" />
    │   ├── UserBadge.tsx          # <UserBadge tier="pioneer" iconUrl="…" />
    │   ├── GroupBentoCard.tsx     # <GroupBentoCard group={…} faviconUrl={…} />
    │   ├── InterestsGrid.tsx      # <InterestsGrid>{children}</InterestsGrid>
    │   ├── InterestCard.tsx       # <InterestCard topicColor=… topicLabel=… stats=[…] onRemove=… />
    │   ├── AddInterestCard.tsx    # <AddInterestCard onClick={…} />
    │   └── index.ts
    └── styles/
        ├── favicon.css       # .favicon reusable wrapper
        ├── verb-tag.css      # .fc-verb-tag pill (8 intent variants)
        ├── user-badge.css    # .fc-user-badge + dot fallback
        ├── interests.css     # .ig-grid / .ig-card (front + reveal) / .ig-add-card
        └── bento.css         # .triples-container / .bento-grid / .group-bento-card
```

## Stylesheets exposed

| Entry | Selector highlights |
|-------|---------------------|
| `@0xsofia/design-system/theme.css` | `:root` / `[data-theme="dark"]` — surfaces, text, accent all prefixed `--ds-*` to avoid shadcn collision (`--ds-bg`, `--ds-card`, `--ds-ink`, `--ds-muted`, `--ds-accent`, `--ds-border`, `--ds-shadow-card`, `--ds-radius`, …). Predicate colors are unprefixed (`--trusted`, `--work`, `--learning`, …) because they have no collision with host apps. |
| `@0xsofia/design-system/styles/favicon.css` | `.favicon` (scale via `--fav-size`) |
| `@0xsofia/design-system/styles/verb-tag.css` | `.fc-verb-tag.{trusted\|distrusted\|work\|learning\|fun\|inspiration\|buying\|music}` |
| `@0xsofia/design-system/styles/bento.css` | `.triples-container`, `.groups-section`, `.bento-grid`, `.bento-grid-3`, `.bento-card` (`.bento-small\|.bento-tall\|.bento-mega`), `.group-bento-card` (`.can-level-up`), `.group-bento-header`, `.group-bento-favicon`, `.group-bento-domain-info`, `.group-bento-title`, `.group-bento-predicate`, `.group-bento-level`, `.level-badge`, `.group-bento-stats` (`.stat-item` / `.stat-value` / `.stat-label`), `.group-bento-progress`, `.progress-bar-container` / `.progress-bar-fill` / `.progress-label`, `.certification-dots` / `.cert-dot`, `.groups-empty` |
| `@0xsofia/design-system/styles/user-badge.css` | `.fc-user-badge`, `.fc-user-badge-icon`, `.fc-user-badge.has-dot` |
| `@0xsofia/design-system/styles/interests.css` | `.ig-grid`, `.ig-card` (+ `.ig-card-front` / `.ig-card-emoji` / `.ig-card-label` / `.ig-card-sub`), `.ig-card-reveal` (+ `.ig-card-reveal-head` / `.ig-card-reveal-stats` / `.ig-card-reveal-value` / `.ig-card-reveal-label-sm` / `.ig-card-reveal-cta`), `.ig-card-remove`, `.ig-add-card` (+ `.ig-add-icon` / `.ig-add-label`) |
