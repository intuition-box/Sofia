# Explorer migration — proto → design-system + @0xsofia/explorer

Authoritative TODO. Every row maps a **proto-explorer source** (our design
reference at `/home/samuel_chauche/proto-explorer/`) to **where the port lives
in the monorepo**. Status emojis: ✅ done · 🟡 partial · ⬜ not started.

Keep this in sync with `README.md`'s status table — the README is the
one-liner summary, this file is the flat punch list.

---

## Legend

- **design-system** — lives in `packages/design-system/src/` (shared primitive).
- **explorer** — lives in `apps/explorer/src/` (app-specific composition).
- **proto src** — relative to `/home/samuel_chauche/proto-explorer/src/`.

---

## Placement rules — where does this code go?

Use this decision tree for every ⬜ item before writing code.

### A. Shared primitive → `packages/design-system/`

A piece belongs in the design-system if **at least one** is true:
- It will be used by ≥2 consumers (explorer + extension, or multiple pages).
- It has no explorer-specific dependency (no `@/hooks`, no `@/services`, no
  react-router, no Privy, no Tailwind `@apply`).
- It renders proto-faithful markup + CSS that the extension will also need.

File layout when adding a new primitive `Foo`:

| Concern | Path |
|---|---|
| React component | `packages/design-system/src/components/Foo.tsx` |
| Stylesheet (plain CSS, no Tailwind) | `packages/design-system/src/styles/foo.css` |
| Barrel export | add line to `packages/design-system/src/components/index.ts` |
| CSS export | add line to `packages/design-system/package.json` `exports` |
| Tests (if pure logic) | `packages/design-system/src/**/*.test.ts` next to source |
| Type exports | named exports from the component file — no separate `types.ts` |

Class-name prefix convention:
- `ph-*` → PageHero (legacy proto class, kept 1:1)
- `pf-*` → Profile-proto primitives (`pf-view`, `pf-interest-header-*`, `pf-sub-*`)
- `ds-*` → new generic primitives (`ds-section-title`)
- `fc-*` → compact cards (verb-tag, user-badge)
- `ig-*` → interests grid
- `favicon`, `bento-*`, `group-bento-*` → kept from extension/proto heritage

Consumer import pattern:
```tsx
import { Foo } from '@0xsofia/design-system'
// and in the app's CSS entry (design-system.css):
@import "@0xsofia/design-system/styles/foo.css";
```

### B. Explorer-specific composition → `apps/explorer/src/`

A piece stays in explorer if **any** of:
- Binds to explorer hooks (`useTopicSync`, `useUserActivity`, `usePlatformMarket`, …).
- Uses Privy, react-router, Tailwind v4, or shadcn/ui components.
- Handles explorer-specific routing (`navigate('/profile/topics')`).
- Orchestrates data-fetching + design-system primitives (e.g. `TopClaimsSection`
  composes `<FaviconWrapper>` + explorer's `useTopClaims`).

File layout:
- Pages → `apps/explorer/src/pages/<Name>Page.tsx`
- Profile-scoped components → `apps/explorer/src/components/profile/<Name>.tsx`
- Generic explorer components → `apps/explorer/src/components/<Name>.tsx`
- App-specific CSS → `apps/explorer/src/components/styles/<scope>.css`
- CSS imports: `@import "@0xsofia/design-system/styles/xxx.css"` goes in
  `apps/explorer/src/components/styles/design-system.css` (single entry).

### C. Pure logic / taxonomy → `packages/design-system/src/`

Anything that is pure TypeScript with no React, no DOM, no explorer deps:

| Kind | Path |
|---|---|
| Predicate / intention data | `packages/design-system/src/taxonomy/` |
| Level math | `packages/design-system/src/level/` |
| Small formatters (`formatDuration`, `formatEth`) | `packages/design-system/src/lib/` |
| React hooks that encapsulate shared logic | `packages/design-system/src/hooks/` |

### D. Data-fetching hooks → `apps/explorer/src/hooks/`

Anything calling explorer services / GraphQL / wagmi / Privy stays in explorer.
If a hook is purely derived (e.g. `useIntentionGroups` that groups an already-
fetched list), it can live in design-system.

### E. Tokens & fonts

- CSS custom properties (`--ds-ink`, `--ds-muted`, …) → `design-system/src/theme.css`.
- Google Fonts `<link>` → `apps/explorer/index.html` (each consumer loads its own
  fonts so the design-system never mandates network requests).

---

## Per-page inventory (where does each building block live?)

Page-by-page map of every explorer route. Each page lists:
- **DS** — primitives pulled from `@0xsofia/design-system`
- **Explorer** — composition files in `apps/explorer/src/` (pages, components, hooks, CSS)
- **TODO** — remaining work for that page

### `/profile` → `ProfilePage`

| Layer | Where |
|---|---|
| DS: hero | `<PageHero>` |
| DS: section titles | `<SectionTitle>` ×3 |
| DS: cards | `<GroupBentoCard>` + `useIntentionGroups` (via `LastActivitySection`), `<InterestsGrid>` + `<InterestCard>` + `<AddInterestCard>`, `<FaviconWrapper>` + intention helpers (via `TopClaimsSection`) |
| Explorer page | `apps/explorer/src/pages/ProfilePage.tsx` |
| Explorer sections | `apps/explorer/src/components/profile/{InterestsGrid,LastActivitySection,TopClaimsSection}.tsx` |
| Explorer CSS | `apps/explorer/src/components/styles/{profile-sections.css,pages.css}` (only `.pf-view`, `.pp-sections`, `.pp-wallet-banner`, `.tc-*`) |
| Hooks | `useTopicSync`, `useUserActivity`, `useTopClaims`, `useTrustScore`, `useSignals`, `usePlatformMarket`, `useReputationScores`, `usePlatformConnections` |
| TODO | Wire Echoes sort tabs (`platform`/`verb`/`topic`) — `useIntentionGroups` already supports it |

### `/profile/interest/:topicId` → `InterestPage`

| Layer | Where |
|---|---|
| DS: hero | `<InterestHero>` (emoji + kicker + Fraunces + Topic score) |
| DS: section titles | `<SectionTitle>` ×6 (Stats, Categories, Trending, Platforms, Claims, Certified) |
| DS: helpers | `getTopicEmoji`, `SubHeader` (NOT used here — hero is dominant) |
| Explorer page | `apps/explorer/src/pages/InterestPage.tsx` |
| Explorer local components | `NicheDetailList.tsx`, `TrendingCard.tsx`, `PositionBoardDialog.tsx`, `ScoreExplanationDialog.tsx` |
| DS: platforms grid | `<PlatformsGrid>` + `<PlatformCard>` + `<PlatformAddCard>` + `<PlatformSkeleton>` |
| Explorer CSS | `apps/explorer/src/components/styles/interest-page.css` (`.ip-stats-grid`, `.ip-stat-card`, `.ip-claims-grid`, `.ip-claim-card`, `.ip-certs-grid`, `.ip-cert-card`, `.ip-trending-grid`) — `.ip-platform-*` rules removed |
| Hooks | `useDomainTrending`, `useDomainClaims`, `useTopicCertifications`, `usePlatformCatalog`, `useCart` |
| TODO | ⬜ port `.ip-cert-card` → DS `<CertifiedUrlRow>` (proto uses `urlCard.ts` compact tier) · 🟡 decide if Stats/Categories/Trending/Claims sections should stay (proto only has Platforms + Certified) |

### `/profile/topics` → `DomainSelectionPage`

| Layer | Where |
|---|---|
| DS | `<SubHeader>` (crumbs `Profile › Select Topics`, pill `Selected X / 3`) |
| Explorer page | `apps/explorer/src/pages/DomainSelectionPage.tsx` |
| DS: grid | `<TopicPicker>` + `<TopicCard>` |
| Explorer local | `apps/explorer/src/components/profile/DomainSelector.tsx` (now just wraps DS primitives + Back/Continue buttons) |
| Hooks | `useTopicSync` |
| TODO | ✅ done |

### `/profile/interest/:topicId/categories` → `DomainNicheSelectionPage`

| Layer | Where |
|---|---|
| DS | `<SubHeader>` (3 crumbs w/ topic color, pill `Selected X / N` colored) + `getTopicEmoji` |
| Explorer page | `apps/explorer/src/pages/DomainNicheSelectionPage.tsx` |
| DS: chips | `<NicheChips size="lg">` + `<NicheChip>` |
| Explorer local | `apps/explorer/src/components/profile/NicheSelector.tsx` (now wraps DS chips + ScrollArea + Back/Continue) |
| Hooks | `useTopicSelection` (via `useDomainSelection`), `useTaxonomy` |
| TODO | ✅ done |

### `/profile/categories` → `NicheSelectionPage`

| Layer | Where |
|---|---|
| DS | `<SubHeader>` (crumbs `Profile › Select Categories`, no pill) |
| Explorer page | `apps/explorer/src/pages/NicheSelectionPage.tsx` |
| Explorer local | reuses `<NicheSelector>` from above |
| Hooks | `useTopicSelection` |
| TODO | same primitive as DomainNicheSelectionPage |

### `/profile/interest/:topicId/platforms` → `PlatformConnectionPage`

| Layer | Where |
|---|---|
| DS | `<SubHeader>` (3 crumbs, `Connected X / N` pill) + `getTopicEmoji` |
| Explorer page | `apps/explorer/src/pages/PlatformConnectionPage.tsx` |
| Explorer local | `apps/explorer/src/components/profile/PlatformGrid.tsx` |
| Hooks | `usePlatformConnections`, `usePlatformCatalog`, `useTopicSelection`, `useTaxonomy` |
| TODO | ⬜ port `<PlatformGrid>` → DS `<PlatformsGrid>` + `<PlatformCard>` (status chip + connect/disconnect CTA) |

### `/profile/:address` → `PublicProfilePage`

| Layer | Where |
|---|---|
| DS: section titles | `<SectionTitle>` ×4 (Stats, Interests, Top Claims, Activity) |
| DS: cards | `<FaviconWrapper>`, `<TopClaimsSection>` (inherits via migration) |
| Explorer page | `apps/explorer/src/pages/PublicProfilePage.tsx` |
| Explorer local | `pub-stat-card` grid inline (no primitive) |
| Legacy | still imports `@/components/PageHeader` (not migrated) |
| Hooks | `useUserProfile`, `useTopClaims`, `useUserActivity`, `useEnsNames`, `useTrustScore` |
| TODO | ⬜ replace `<PageHeader>` with `<PublicProfileHero>` (avatar + ENS + shortAddress + trust score) — needs new DS primitive · ⬜ extract `pub-stat-card` into DS `<StatCard>` (Layers/Award/BarChart/Shield icons + value + label) |

### `/feed` → `DashboardPage`

| Layer | Where |
|---|---|
| DS | _none yet_ — still uses legacy `<PageHeader>` + Tailwind cards |
| Explorer page | `apps/explorer/src/pages/DashboardPage.tsx` |
| Explorer local | `Post.tsx`, `CircleCard.tsx`, `Hero.tsx`, `PersonalStats.tsx`, `StatsRibbon.tsx`, `Leaderboard.tsx` |
| TODO | ⬜ port `views/feed.ts` + `components/urlCard.ts` → DS `<UrlCard>` (tier variants `compact`/`full`, actor + badges + share) · ⬜ port `components/filterSidebar.ts` + `verbFilter.ts` → DS `<FilterSidebar>` · ⬜ replace `<PageHeader>` with `<PageHero>` |

### `/leaderboard` → `LeaderboardPage`

| Layer | Where |
|---|---|
| DS | _none_ — legacy `<PageHeader>` |
| Explorer page | `apps/explorer/src/pages/LeaderboardPage.tsx` + `Leaderboard.tsx` component |
| TODO | ⬜ replace `<PageHeader>` with `<PageHero>` (proto-style peach banner) · 🟡 check if proto has a dedicated leaderboard design |

### `/streaks` → `StreaksPage`

| Layer | Where |
|---|---|
| DS | _none_ — legacy `<PageHeader>` |
| Explorer page | `apps/explorer/src/pages/StreaksPage.tsx` |
| TODO | ⬜ migrate `<PageHeader>` → `<PageHero>` · 🟡 proto probably has no equivalent (streaks is explorer-specific) |

### `/vote` → `VotePage`

| Layer | Where |
|---|---|
| DS | _none_ — legacy `<PageHeader>` + tabs + claim cards |
| Explorer page | `apps/explorer/src/pages/VotePage.tsx` |
| Explorer local | `.vp-tabs`, `.vp-tab`, `.vp-claim-card`, `.vp-claim-list-card` |
| TODO | ⬜ migrate `<PageHeader>` → `<PageHero>` · 🟡 proto has `renderResults` — unclear mapping to Vote page |

### `/platforms` → `AllPlatformsPage`

| Layer | Where |
|---|---|
| DS | _none_ — legacy `<PageHeader>` + local market cards |
| Explorer page | `apps/explorer/src/pages/AllPlatformsPage.tsx` |
| Explorer local | `PlatformMarketCard.tsx`, `PlatformGrid.tsx` |
| TODO | ⬜ migrate `<PageHeader>` → `<PageHero>` · share `<PlatformsGrid>` primitive with PlatformConnectionPage once built |

### `/scores` → `ScoresPage`

| Layer | Where |
|---|---|
| DS | _none_ — placeholder page |
| TODO | ⬜ currently `Coming soon` — design depends on proto equivalent (unknown) |

### `/` (landing) → `LandingPage`

| Layer | Where |
|---|---|
| DS | _none_ — separate marketing-style hero |
| Explorer page | `apps/explorer/src/pages/LandingPage.tsx` + `FooterCTA.tsx` |
| TODO | 🟡 landing is out of scope of the proto migration — leave as-is unless proto has an aligned design |

---

## 0 · Foundation

| Proto | Target | Status |
|---|---|---|
| `styles.css` tokens (`--ink`, `--muted`, `--card`, …) | `design-system/src/theme.css` — `--ds-*` prefixed | ✅ |
| Fraunces + JetBrains Mono + Roboto | `apps/explorer/index.html` Google Fonts link | ✅ |
| `styles/shared.css` generic utils | _deferred_ — pick per-page as needed | 🟡 |
| Palette (vivid `#22C55E`, `#EF4444`, …) | `design-system/src/taxonomy/intentions.ts` | ✅ |
| `data.ts` topic emoji map | `design-system/src/taxonomy/topic-emoji.ts` | ✅ |

---

## 1 · App shell

| Proto | Target | Status |
|---|---|---|
| `components/navSidebar.ts` | `design-system` `<NavSidebar>` + `NavBrand` / `NavSection` / `NavItem` | ✅ |
| Grid layout (`.app` 3-column) | `design-system` `<AppShell>` + `app-shell.css` | ✅ done, not yet adopted by explorer `App.tsx` (explorer still uses margins on `.main-content`) | 🟡 |
| `components/circleDrawer.ts` right rail on feed/circles | _no direct port yet_ — explorer uses `RightSidebar` (TopReputations + Trending + Activity placeholder) | ⬜ |
| `components/profileDrawer.ts` right rail on `/profile*` | `apps/explorer/src/components/ProfileDrawer.tsx` + `profile-drawer.css` (local, not migrated) | ⬜ |
| `views/*` router wiring (`#/profile`, `#/feed`, …) | `apps/explorer/src/App.tsx` (react-router, existing) | ✅ |

---

## 2 · Page headers

| Proto | Target | Status |
|---|---|---|
| `pageHeader()` → `.ph-container.profile-ph` (peach banner) | `design-system` `<PageHero>` + `page-hero.css` | ✅ |
| `.pf-interest-header` (emoji + kicker + Fraunces + Topic score) | `design-system` `<InterestHero>` + `interest-hero.css` | ✅ |
| `subHeader()` (back circle + crumbs + pill + description) | `design-system` `<SubHeader>` + `sub-header.css` | ✅ |
| `.pf-section-title` / `.pp-section-title` (uppercase eyebrow) | `design-system` `<SectionTitle>` + `section-title.css` | ✅ |

---

## 3 · Profile overview (`/profile`)

Proto source: `views/profile.ts:renderOverview` (+ `renderInterestsGrid`, `renderEchoesGrid`, `renderProfileCharts`).

| Proto | Target | Status |
|---|---|---|
| `.pf-view` 1040px wrapper | explorer `profile-sections.css` `.pf-view` | ✅ |
| My Interests grid (3-col reveal) | `design-system` `<InterestsGrid>` + `<InterestCard>` + `<AddInterestCard>` | ✅ |
| `renderEchoesGrid()` (bento grid by intention) | `design-system` `<GroupBentoCard>` + `useIntentionGroups` hook; adopted on explorer `LastActivitySection` | ✅ |
| Echoes sort tabs (`platform` / `verb` / `topic`) | `useIntentionGroups` already supports `EchoesSort` — sort UI not yet wired in explorer | 🟡 |
| `renderProfileCharts()` (topic distribution, trust over time) | `apps/explorer/src/components/PersonalStats.tsx` / `StatsRibbon.tsx` — NOT proto-aligned | ⬜ |
| Top Claims section | explorer `TopClaimsSection` using `design-system` intention helpers + `<FaviconWrapper>` | ✅ |
| Wallet banner (view-as / link-wallet) | explorer `.pp-wallet-banner` inline Cards | 🟡 (local styling, no proto equivalent — low priority) |

---

## 4 · Profile sub-pages

### `/profile/interest/:topicId` (`views/profile.ts:renderInterestDetail`)

| Proto | Target | Status |
|---|---|---|
| `.pf-interest-header` banner | `<InterestHero>` | ✅ |
| Platforms grid (connected + add + skeletons) | explorer `InterestPage` `.ip-platforms-grid` — local markup, NOT a design-system primitive | ⬜ port to `design-system <PlatformsGrid>` |
| Certified in `{topic}` list | proto uses `renderUrlCard` (feed-style compact cards) — explorer uses inline `.ip-cert-card` | ⬜ |
| Stats grid (Score / Categories / Platforms / Available) | explorer only, not in proto — proto shows Topic score on `<InterestHero>` | 🟡 (keep or drop?) |
| Categories (`NicheDetailList`) | explorer local, not in proto's simplified InterestDetail | 🟡 (not in proto) |
| Trending in topic | explorer local (`TrendingCard`) — proto equivalent unclear | 🟡 |
| Claims list | explorer local (`.ip-claim-card`) — proto equivalent unclear | 🟡 |

### `/profile/topics` (`renderTopicsPage`)

| Proto | Target | Status |
|---|---|---|
| `<SubHeader>` with `Selected X / 3` pill | `<SubHeader>` | ✅ |
| `.pf-topics-grid` with topic cards (emoji + label + check) | explorer `<DomainSelector>` local — NOT matching proto style | ⬜ port to `design-system <TopicPicker>` |
| Footer continue button | explorer has it inline | 🟡 |

### `/profile/categories` & `/profile/interest/:id/categories` (`renderCategoriesPage` / `renderDomainNicheSelectionPage`)

| Proto | Target | Status |
|---|---|---|
| `<SubHeader>` (3-crumb version w/ topic color) | `<SubHeader>` | ✅ |
| `.pf-niche-grid` chips (`pf-niche-chip-lg`) | explorer `<NicheSelector>` local — needs port | ⬜ |

### `/profile/interest/:id/platforms` (`renderPlatformsPage`)

| Proto | Target | Status |
|---|---|---|
| `<SubHeader>` | `<SubHeader>` | ✅ |
| Platforms grid | explorer `<PlatformGrid>` local — NOT matching proto style | ⬜ |

### `/profile/:address` (`PublicProfilePage`)

| Proto | Target | Status |
|---|---|---|
| Still uses legacy `<PageHeader>` (not proto-aligned) | swap for `<PageHero>` or a new `<PublicProfileHero>` (avatar + ENS + stats) | ⬜ |
| `<SectionTitle>` for Stats/Interests/Top Claims/Activity | `<SectionTitle>` | ✅ |
| `pub-stat-card` grid | local, NOT in design-system | 🟡 (could be a `<StatCard>` primitive) |

---

## 5 · Feed / Home (`/feed` = explorer `DashboardPage`)

Proto source: `views/home.ts` + `views/feed.ts` + `components/feedCard.ts` + `components/urlCard.ts`.

| Proto | Target | Status |
|---|---|---|
| Home hero / landing | explorer `LandingPage` (existing, not proto-aligned) | ⬜ |
| Feed card (URL + predicates + actor + share) | proto `urlCard.ts` → explorer `Post.tsx` / `CircleCard.tsx` — NOT migrated | ⬜ port `<UrlCard>` + tier variants (`compact`, `full`) to design-system |
| Filter sidebar (verb / topic / platform) | proto `filterSidebar.ts` + `verbFilter.ts` → explorer has partial filtering in `DashboardPage` | ⬜ |
| Masonry layout | proto `masonry.ts` + `views/masonryLab.ts` | ⬜ (only needed if we adopt masonry) |

---

## 6 · Compose (`views/compose.ts`)

Not yet in explorer — proto has a composer page with 3D compile button (`three.js`).

| Proto | Target | Status |
|---|---|---|
| Compose view (URL + predicate picker + verb tag + submit) | No explorer route yet | ⬜ |
| Compile action button (`threeButton.ts`) | `CompileActionButton` planned in design-system (later wave, needs `three`) | ⬜ |

---

## 7 · Circles & Results

| Proto | Target | Status |
|---|---|---|
| `views/circles.ts` + `circleDrawer.ts` | explorer `CircleCard.tsx` (partial) — no dedicated route | ⬜ |
| `views/results.ts` (search results) | No explorer route | ⬜ |

---

## 8 · Cross-cutting cleanup

| Task | Status |
|---|---|
| Replace `@/config/intentions` with `@0xsofia/design-system` across remaining consumers (DashboardPage, CircleCard, CartDrawer, DepositModal, PredicatePicker, PositionBoardDialog, WeightModal, feedProcessing, domainTrendingService) | ⬜ 9 files left |
| Delete `apps/explorer/src/components/PageHeader.tsx` once VotePage/DashboardPage/LeaderboardPage/StreaksPage/ScoresPage/AllPlatformsPage/PublicProfilePage migrate to `<PageHero>` | ✅ done — 7 pages migrated, file deleted |
| Delete `apps/explorer/src/components/Sidebar.tsx` (still on disk, no imports) | ✅ done |
| Extension adoption of `@0xsofia/design-system` (ManifestV3 / Plasmo) | ⬜ future wave |

---

## 9 · Design-system hygiene

| Task | Status |
|---|---|
| Port `three` `<CompileActionButton>` (optional peerDep) | ⬜ |
| Storybook / sandbox for primitives | ⬜ |
| CHANGELOG.md once package is published | ⬜ |
