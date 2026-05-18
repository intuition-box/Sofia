# Echoes System — Architecture & Specification

> Documentation technique du systeme Echoes : groupes de navigation, niveaux, certifications on-chain, Level Up, Amplify et Gold.

## Table of Contents

1. [Overview](#overview)
2. [Data Model](#data-model)
3. [Level System](#level-system)
4. [Gold Currency](#gold-currency)
5. [On-Chain Certifications](#on-chain-certifications)
6. [Level Up Mechanism](#level-up-mechanism)
7. [Amplify (Publishing Identity)](#amplify-publishing-identity)
8. [UI Components](#ui-components)
9. [Known Redundancies & Refactoring Plan](#known-redundancies--refactoring-plan)

---

## Overview

The Echoes system tracks a user's browsing history as **intention groups** — collections of URLs grouped by domain. Each group has a **level** that increases as the user certifies URLs on-chain and spends **Gold** to generate AI predicates.

### Core Flow

```
Browse URLs ──► Auto-grouped by domain
                     │
              Certify URLs on-chain (trust, work, learning, etc.)
                     │
              On-chain certifications increase displayLevel
                     │
              Spend Gold ──► AI generates predicate ──► Level Up
                     │
              Amplify ──► Publish "I {predicate} {domain}" on-chain
```

### Key Files

| File | Role |
|------|------|
| `components/ui/GroupBentoCard.tsx` | Card view — shows domain, level, progress |
| `components/ui/GroupDetailView.tsx` | Detail view — URL list, certification, level up |
| `components/pages/core-tabs/EchoesTab.tsx` | Tab container — grid of cards, filters, sorting |
| `lib/services/LevelUpService.ts` | Level up orchestration (Gold check, AI call, group update) |
| `lib/services/GoldService.ts` | Gold currency management |
| `lib/services/GroupManager.ts` | Group CRUD, certification tracking |
| `hooks/useGroupOnChainCertifications.ts` | Pipeline 2 — on-chain cert data via global cache |
| `hooks/useOnChainIntentionGroups.ts` | Pipeline 1 — on-chain cert data via GraphQL query |
| `hooks/useGroupAmplify.ts` | Publish identity triple on-chain |
| `hooks/useLevelUp.ts` | React hook wrapping LevelUpService |
| `hooks/useIntentionGroups.ts` | Main hook — merges local + on-chain groups |

---

## Data Model

### IntentionGroupRecord (IndexedDB)

```typescript
interface IntentionGroupRecord {
  id: string                          // = domain (e.g. "twitch.tv")
  domain: string
  title: string                       // = domain by default
  createdAt: number
  updatedAt: number
  urls: GroupUrlRecord[]              // All tracked URLs for this domain
  level: number                       // Confirmed level (starts at 1)
  currentPredicate: string | null     // null until first Level Up
  predicateHistory: PredicateChangeRecord[]
  totalAttentionTime: number
  totalCertifications: number
  dominantCertification: string | null
  amplifiedPredicate?: string | null  // Set after on-chain Amplify
}
```

### GroupUrlRecord

```typescript
interface GroupUrlRecord {
  url: string
  title: string
  domain: string
  favicon?: string
  addedAt: number
  attentionTime: number

  // Local certification (set by user in UI)
  certification: CertificationType | null
  certifiedAt?: number

  // Soft delete
  removed: boolean

  // OAuth integration (Spotify, GitHub, etc.)
  oauthPredicate?: string    // e.g. "follow", "member_of", "top_artist"
  oauthSource?: string       // e.g. "spotify", "github"

  // On-chain state (set during Pipeline 1 merge)
  isOnChain?: boolean
  onChainCertification?: string
}
```

### PredicateChangeRecord (Level Up history)

```typescript
interface PredicateChangeRecord {
  fromPredicate: string | null
  toPredicate: string
  fromLevel: number
  toLevel: number
  changedAt: number
  xpSpent: number             // Gold spent (legacy naming)
  reason: string              // e.g. "Level 3: 5/8 URLs certified as learning"
}
```

### IntentionGroupWithStats (runtime, computed)

Extends `IntentionGroupRecord` with computed stats used by UI components:

```typescript
interface IntentionGroupWithStats extends IntentionGroupRecord {
  activeUrlCount: number              // URLs where removed === false
  certifiedCount: number              // URLs with on-chain certification
  certificationBreakdown: Record<CertificationType, number>
  isVirtualGroup?: boolean            // True for on-chain-only groups (no local data)
}
```

### CertificationType

```typescript
type CertificationType =
  | 'work' | 'learning' | 'fun' | 'inspiration'
  | 'buying' | 'music'
  | 'trusted' | 'distrusted'
```

**Colors:**

| Type | Color | Hex |
|------|-------|-----|
| trusted | Green | `#22C55E` |
| distrusted | Red | `#EF4444` |
| work | Blue | `#3B82F6` |
| learning | Cyan | `#06B6D4` |
| fun | Yellow/Orange | `#F59E0B` |
| inspiration | Purple | `#8B5CF6` |
| buying | Rose | `#EC4899` |
| music | Deep Orange | `#FF5722` |

### Related Types

| Type | Definition | Usage |
|------|-----------|-------|
| `CertificationType` | Union of 8 strings (above) | Primary type for UI, services, hooks |
| `IntentionType` | Identical to `CertificationType` | Used in `intentionCategories.ts` (duplicate) |
| `IntentionPurpose` | `'for_work' \| 'for_learning' \| ...` (6 values, prefixed) | Predicate lookup key in `INTENTION_PREDICATES` |

Conversion: `intentionToCertification` maps `for_work` -> `'work'`, etc. (no trusted/distrusted in IntentionPurpose).

---

## Level System

### Level Thresholds

Levels are determined by the number of on-chain certifications for a group's URLs:

```typescript
const LEVEL_THRESHOLDS = [0, 3, 7, 12, 18, 25, 33, 42, 52, 63, 75]
```

| Level | Certs Required | Delta |
|-------|----------------|-------|
| 1 | 0 | - |
| 2 | 3 | +3 |
| 3 | 7 | +4 |
| 4 | 12 | +5 |
| 5 | 18 | +6 |
| 6 | 25 | +7 |
| 7 | 33 | +8 |
| 8 | 42 | +9 |
| 9 | 52 | +10 |
| 10 | 63 | +11 |
| 11 | 75 | +12 |

Algorithm (same everywhere):
```typescript
function calculateLevel(certifiedCount: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (certifiedCount >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}
```

### Four Distinct "Level" Concepts

The system maintains multiple notions of level for different purposes:

| Concept | Variable | Source | Updates |
|---------|----------|--------|---------|
| **Display Level** | `displayLevel` (BentoCard), `currentLevel` (DetailView) | Calculated from `certifiedCount` on-chain | Automatic — changes with each certification/redeem |
| **Confirmed Level** | `group.level`, `confirmedLevel` | Stored in IndexedDB | Manual — only changes after Level Up action |
| **Highest Predicate Level** | `highestPredicateLevel` | `max(predicateHistory.map(h => h.toLevel))` | Cumulative — never decreases |
| **Amplified Level** | Implied by `amplifiedPredicate` | Stored in IndexedDB | Manual — changes after Amplify action |

### Why Two Levels?

The separation between **display level** (automatic, on-chain) and **confirmed level** (manual, local) creates the progression loop:

```
User certifies URLs on-chain
        │
        ▼
displayLevel increases automatically (e.g. 1 → 3)
        │
        ▼
displayLevel > highestPredicateLevel → "Level Up!" available
        │
        ▼
"Level Up!" button appears ← requires Gold + AI predicate generation
        │
        ▼
highestPredicateLevel catches up to displayLevel
```

The level can also **decrease** if the user redeems on-chain positions (withdraws stake). In that case `displayLevel` drops but `confirmedLevel` stays — the predicate history is permanent.

### Progress Bar Calculation

Both components use the same unified logic. The progress bar shows advancement toward the **next** level, using `displayLevel` (on-chain) as base:

```typescript
// Shared: lib/utils/levelCalculation.ts → calculateLevelProgress()
const currentThreshold = LEVEL_THRESHOLDS[baseLevel - 1] || 0
const nextThreshold = LEVEL_THRESHOLDS[baseLevel] || currentThreshold + 10
const progressPercent = Math.min(100, Math.max(0,
  ((certifiedCount - currentThreshold) / (nextThreshold - currentThreshold)) * 100
))
const xpToNextLevel = Math.max(0, nextThreshold - certifiedCount)
```

Both `GroupBentoCard` and `GroupDetailView` pass `displayLevel` / `currentLevel` (from `calculateLevel(certifiedCount)`) as `baseLevel`. This ensures the "X certs to LVL Y" text is identical in both views.

### canLevelUp Logic (unified)

Both components use the same predicate-history-based check:

```typescript
const highestPredicateLevel = group.predicateHistory?.length > 0
  ? Math.max(...group.predicateHistory.map(h => h.toLevel))
  : 0
const canLevelUp = displayLevel > 1 && displayLevel > highestPredicateLevel
// "Can I generate a NEW predicate?" — prevents double level-up at same level
```

In `GroupBentoCard`, this triggers the `.can-level-up` CSS class (glow effect).
In `GroupDetailView`, this enables the "Level Up" button.

---

## Gold Currency

Gold is a **private, local currency** (not on-chain). It serves as a friction mechanism for Level Ups.

### Sources

| Source | Amount | Condition |
|--------|--------|-----------|
| URL certification | +10 Gold | Per group URL certified on-chain |
| Vote (like/dislike) | +5 Gold | Per vote, max 10/day (= 50 Gold/day cap) |
| Discovery (Pioneer/Explorer/Contributor) | Variable | From on-chain discovery certifications |

### Level-Up Costs

```typescript
const LEVEL_UP_COSTS: Record<number, number> = {
  1: 30,    // Level 1 → 2
  2: 50,    // Level 2 → 3
  3: 75,    // Level 3 → 4
  4: 100,   // Level 4 → 5
}
const MAX_LEVEL_UP_COST = 100  // Level 5+ capped at 100 Gold
```

### Storage (chrome.storage.local)

All keys are wallet-prefixed with lowercase address:

| Key | Content |
|-----|---------|
| `discovery_gold_{wallet}` | Gold from Pioneer/Explorer/Contributor |
| `certification_gold_{wallet}` | Gold from URL certifications + votes |
| `spent_gold_{wallet}` | Total Gold spent on Level Ups |
| `vote_gold_{wallet}` | Tracker for vote Gold (daily cap) |

**Total Gold** = `discoveryGold + certificationGold - spentGold`

### Service: GoldService

Singleton at `lib/services/GoldService.ts`. Key methods:

| Method | Purpose |
|--------|---------|
| `getGoldState(wallet)` | Returns `{ discoveryGold, certificationGold, spentGold, totalGold }` |
| `addCertificationGold(wallet, amount?)` | +10 Gold per URL certification |
| `addVoteGold(wallet, dailyCount)` | +5 Gold per vote (respects daily cap) |
| `setDiscoveryGold(wallet, amount)` | Set discovery Gold (replaces) |
| `spendGold(wallet, amount)` | Deduct Gold for Level Up |
| `canAffordLevelUp(wallet, currentLevel)` | Check affordability |

---

## On-Chain Certifications

### Two Data Pipelines

The system uses two complementary pipelines to fetch on-chain certification data. This redundancy ensures no certifications are missed.

#### Pipeline 1: `useOnChainIntentionGroups`

```
GraphQL query (by predicate ID)
    ──► Fetches user's triples for ALL predicate types
    ──► Groups by domain
    ──► Merges into local groups via useIntentionGroups
    ──► Sets urlRecord.isOnChain = true
    ──► Sets urlRecord.onChainCertification = label
```

- **Strengths:** Covers all predicate types via ID matching (intentions, OAuth, trust/distrust)
- **Weaknesses:** GraphQL query by predicate ID can miss some types if IDs change

#### Pipeline 2: `useGroupOnChainCertifications`

```
Global user certifications cache (useUserCertifications)
    ──► Local in-memory matching by normalized URL
    ──► Returns UrlCertificationStatus per URL
    ──► No GraphQL query — purely cache-based
```

- **Strengths:** Fast, local, supports multiple labels per URL, includes all cert types
- **Weaknesses:** Cache can be stale if not refreshed

#### Which Pipeline Where?

| Component | Pipeline | certifiedCount Source |
|-----------|----------|----------------------|
| GroupBentoCard | Both (MAX) | `Math.max(p2Count, p1Count, group.certifiedCount)` |
| GroupDetailView | Both (MAX) | `Math.max(p2Count, p1Count, group.certifiedCount)` |

Both components use `Math.max()` of all three sources (Pipeline 2 count, Pipeline 1 count, stored count) to guarantee no certifications are under-counted and consistent values between card and detail views.

### Effective Certification Status

The `getEffectiveCertStatus()` helper (in GroupDetailView) reconciles both pipelines:

```typescript
function getEffectiveCertStatus(urlRecord, onChainStatus):
  1. If Pipeline 2 says certified → use its labels (most complete)
  2. Else if Pipeline 1 says on-chain → use its single label (fallback)
  3. Else → not certified
```

### UrlCertificationStatus

```typescript
interface UrlCertificationStatus {
  url: string
  isCertifiedOnChain: boolean
  intention?: IntentionPurpose
  certificationLabel?: string         // Primary label (e.g. "work")
  allIntentions?: IntentionPurpose[]
  allCertificationLabels?: string[]   // All labels including OAuth
  oauthPredicates?: string[]          // e.g. ["follow", "member_of"]
  tripleDetails?: TripleDetail[]      // For redeem operations
}
```

---

## Level Up Mechanism

### Prerequisites

1. `currentLevel > 1` — at least 3 on-chain certifications
2. `currentLevel > highestPredicateLevel` — no existing predicate for this level
3. User can afford Gold cost

### Step-by-Step Flow

```
1. UI calls LevelUpService.previewLevelUp(groupId, targetLevel)
   └── Returns { canLevelUp, cost, availableGold, currentLevel, nextLevel }

2. User clicks "Level Up" button
   └── UI calls LevelUpService.levelUp(groupId, certifications, targetLevel)

3. LevelUpService.levelUp():
   a. Get group from IndexedDB (or materialize virtual group)
   b. Check Gold: goldService.canAffordLevelUp(wallet, group.level)
   c. Collect certification breakdown (from UI or GroupManager)
   d. Enrich with OAuth predicates for AI context
   e. Call AI: generatePredicate({ domain, title, level, certifications })
   f. Spend Gold: goldService.spendGold(wallet, cost)
   g. Update group: groupManager.updateAfterLevelUp(
        groupId, newLevel, predicate, reason, cost
      )
      └── Sets group.level = newLevel
      └── Sets group.currentPredicate = newPredicate
      └── Appends PredicateChangeRecord to predicateHistory

4. UI shows success: "Level Up! New identity: I {predicate} {domain}"
```

### AI Predicate Generation

The AI agent generates a 2-4 word predicate that describes the user's relationship to the domain based on their certification patterns.

**Input:**
```typescript
{
  domain: "twitch.tv",
  title: "twitch.tv",
  level: 3,
  certifications: { fun: 5, learning: 2 },
  previousPredicate: "enjoy"
}
```

**Output:**
```typescript
{
  predicate: "dive deep into",
  reason: "User shows strong fun engagement with some learning..."
}
```

**Endpoint:** `POST {MASTRA_URL}/api/agents/predicateAgent/generate`

### Virtual Groups

On-chain-only groups (no local data, ID starts with `onchain-`) are "materialized" into IndexedDB on first Level Up:

```typescript
if (!group && groupId.startsWith('onchain-')) {
  const domain = groupId.replace('onchain-', '')
  const newGroup = { id: domain, domain, level: 1, urls: [], ... }
  await IntentionGroupsService.saveGroup(newGroup)
}
```

### LevelUpResult

```typescript
interface LevelUpResult {
  success: boolean
  error?: string
  required?: number          // Gold required (on insufficient funds)
  available?: number         // Gold available (on insufficient funds)
  previousLevel?: number
  newLevel?: number
  previousPredicate?: string | null
  newPredicate?: string
  predicateReason?: string   // AI reasoning
  goldSpent?: number
}
```

---

## Amplify (Publishing Identity)

Amplify publishes the group's current identity triple **on-chain** as a vault position.

### What Gets Published

```
Triple: I | {currentPredicate} | {domain}
Example: I | love | twitch.tv
```

This creates (or deposits into) a triple vault on the Intuition protocol.

### Prerequisites

- Group must have a `currentPredicate` (level 2+, at least one Level Up done)
- User supplies optional custom weight (stake deposit)

### State Tracking

```typescript
const isAmplified = group.amplifiedPredicate === group.currentPredicate
                    && !!group.currentPredicate
```

- After Level Up: `currentPredicate` changes → `isAmplified = false` (predicate out of sync)
- After Amplify: `amplifiedPredicate` = `currentPredicate` → `isAmplified = true`

### UI Behavior

The Identity Hero section (shows triple + Amplify button) is **hidden** when Level Up is available, to focus user attention on progression:

```typescript
{group.currentPredicate && !(canLevelUp && levelUpPreview?.canLevelUp && !levelUpResult?.success) && (
  <div className="identity-hero-section">...
)}
```

### AmplifyResult

```typescript
interface AmplifyResult {
  success: boolean
  error?: string
  tripleVaultId?: string
  txHash?: string
  source?: 'created' | 'deposit' | 'existing'
  triple?: { subject: string; predicate: string; object: string }
}
```

---

## UI Components

### EchoesTab

Container component. Responsibilities:
- Fetches groups via `useIntentionGroups` hook
- Renders grid of `GroupBentoCard` components
- Provides sort (level, URLs, A-Z, recent) and filter (by certification type) controls
- Auto-deletes empty groups (0 active URLs, no OAuth) — intentional design
- Filters out `.eth` and `0x` domains from display — intentional design
- Navigates to `GroupDetailView` on card click

### GroupBentoCard

Compact card for the grid. Displays:
- Domain favicon + name
- Current predicate (if any)
- Level badge (`LVL {displayLevel}`)
- Stats: URL count, on-chain count, total time
- Progress bar toward next level (based on `displayLevel`)
- Certification type breakdown dots
- Glow effect when `canLevelUp` (on-chain level > highest predicate level)

**Data source:** Both Pipeline 1 and Pipeline 2 (MAX of all sources, same as DetailView)

### GroupDetailView

Full detail view. Features:
- URL list with expand/collapse per URL
- Per-URL certification pills (trust, distrust, work, learning, fun, inspiration, buying, music)
- OAuth certification button (if URL has OAuth predicate)
- Certification filter tabs (All, Uncertified, per type)
- Level progress bar (based on `currentLevel`)
- Level Up button (when `canLevelUp` and preview shows affordable)
- Identity Hero section with Amplify button
- Gold balance display
- WeightModal for setting stake amount before on-chain certification
- Redeem flow for removing on-chain positions

**Data source:** Both Pipeline 1 and Pipeline 2 (MAX of all sources)

### UrlRow (inline in GroupDetailView)

Per-URL row component (174 lines, defined inside GroupDetailView). Displays:
- Favicon, title, date, attention time
- On-chain badge if certified
- Certification badges (colored dots per type)
- Expandable section with certification pills
- Remove button (with redeem if on-chain)

---

## Refactoring Status

### Completed Extractions

Shared utilities extracted from duplicated code across 10+ files:

| File | Exports | Consumers |
|------|---------|-----------|
| `lib/utils/levelCalculation.ts` | `LEVEL_THRESHOLDS`, `calculateLevel()`, `calculateLevelProgress()` | GroupBentoCard, GroupDetailView, useGroupOnChainCertifications, useOnChainIntentionGroups |
| `lib/utils/formatters.ts` | `getFaviconUrl()`, `formatDuration()`, `formatShortDate()` | GroupBentoCard, GroupDetailView, InterestCard, CircleFeedTab, HistoryTab, BookmarkTab, OnboardingBookmarkSelectPage |
| `lib/utils/certificationHelpers.ts` | `intentionToCertification`, `trustToCertification`, `getEffectiveCertStatus()` | GroupDetailView, useGroupOnChainCertifications |

All re-exported via `lib/utils/index.ts` barrel file.

### Unified Logic (BentoCard = DetailView)

| Logic | Shared Implementation |
|-------|----------------------|
| `certifiedCount` | `Math.max(p2Count, p1Count, group.certifiedCount)` — both components |
| `displayLevel` | `calculateLevel(certifiedCount)` — both components |
| `progressPercent` / `xpToNextLevel` | `calculateLevelProgress(certifiedCount, displayLevel)` — both components |
| `canLevelUp` | `displayLevel > 1 && displayLevel > highestPredicateLevel` — both components |

### Remaining Opportunities

| Item | Location | Action |
|------|----------|--------|
| `CERTIFICATION_COLORS` | GroupBentoCard (Record), GroupDetailView (Array) | Extract to `~/lib/constants/certifications.ts` |
| `modalTriplets` typed as `any[]` | GroupDetailView:285 | Type as `ModalTriplet[]` |
| `IntentionType` vs `CertificationType` | EchoesTab | Replace with `CertificationType` |
| UrlRow inline component (174 lines) | GroupDetailView:65-237 | Extract to `components/ui/UrlRow.tsx` |
