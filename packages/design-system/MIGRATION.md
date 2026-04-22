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
| Replace `@/config/intentions` with `@0xsofia/design-system` across remaining consumers (DashboardPage, CircleCard, CartDrawer, DepositModal, PredicatePicker, ActivityCard → already deleted, PositionBoardDialog, WeightModal, feedProcessing, domainTrendingService) | ⬜ 10 files left |
| Delete `apps/explorer/src/components/PageHeader.tsx` once VotePage/DashboardPage/LeaderboardPage/StreaksPage/ScoresPage/AllPlatformsPage/PublicProfilePage migrate to `<PageHero>` | ⬜ 7 call sites |
| Delete `apps/explorer/src/components/Sidebar.tsx` (still on disk, no imports) | ⬜ dead file |
| Extension adoption of `@0xsofia/design-system` (ManifestV3 / Plasmo) | ⬜ future wave |

---

## 9 · Design-system hygiene

| Task | Status |
|---|---|
| Port `three` `<CompileActionButton>` (optional peerDep) | ⬜ |
| Storybook / sandbox for primitives | ⬜ |
| CHANGELOG.md once package is published | ⬜ |
