# Sofia Extension — Realtime + persister refactor plan

> Status: **plan — not yet implemented**
> Target: apply the push-first / persister architecture we shipped on `sofia-explorer`
> to the Plasmo browser extension, adapted to Manifest V3 constraints.

## 0. Context

The Explorer was migrated from pull-polling to a WebSocket push-first cache backed
by React Query + a localStorage persister. Key wins:

- Zero flash-empty on reload — cache hydrates instantly from storage.
- Real-time updates for user-scoped data (positions, events, trust) via Hasura
  subscriptions over graphql-ws.
- 429 rate-limit amplification avoided by long `staleTime` + `retry: 1`.
- BigInt-safe custom serializer in the persister.
- Optimistic updates on deposit/redeem.
- Score transparency modal (`ScoreExplanationDialog`) with per-platform breakdown.

The extension has the same pull-polling problems but a different runtime shape
(Plasmo / MV3 / service worker / popup lifecycle). This plan adapts the pattern.

## 1. Current extension state (as of audit)

- Path: `/home/max/Project/sofia-core/core/extension`
- Stack: Plasmo 0.90.5, React 18, TS, Viem 2, Wagmi 2, Privy (wallet-only), Mastra HTTP.
- GraphQL: local workspace package `@0xsofia/graphql` (**note:** different package
  from Explorer's `@0xsofia/dashboard-graphql`; see §3).
- React Query: installed (5.0.0), QueryClient in `sidepanel.tsx`, **no persister**.
- Storage: `chrome.storage.local` (long-term) + `chrome.storage.session` (ephemeral).
- No WebSocket currently used (graphql-ws dep exists but unused).
- Wallet address lives in `chrome.storage.session` → SW restart loses it.
- Multi-wallet support already wired: per-wallet data namespacing in storage.
- ~305 TS/TSX files, 48 hooks, MVP in active iteration (v0.6.1), 20-40 active users.

## 2. MV3 constraints that change the architecture

| Concern | Explorer | Extension | Decision |
|---|---|---|---|
| WS lifetime | tab-scoped, lives as long as tab open | **SW dies after ~30s idle; popup dies on close** | WS lives in a dedicated **offscreen document** kept alive by SW |
| Offscreen reason | n/a | enum required by `chrome.offscreen.createDocument()` | **`WORKERS`** (no `WEBSOCKET` reason exists yet; `WORKERS` is GC-friendly) |
| WS keepalive | browser-managed | proxies (nginx/CF) cut idle WS ~55-60s | `setInterval(ping, 25000)` inside offscreen (not `chrome.alarms` — 1min floor too coarse) |
| Storage | `localStorage` (sync) | `chrome.storage.local` (async) | Use `@tanstack/query-async-storage-persister` |
| BigInt serialization | custom replacer/reviver on sync persister | same problem, same fix on async persister | port the tagged-string replacer from `sofia-explorer/src/lib/providers.tsx` |
| Cross-context cache | single tab, single cache | popup + SW + offscreen can all use RQ | **one** cache, owned by offscreen, propagated via **`chrome.storage.onChanged`** (fires natively across all contexts — no custom messaging) |
| Optimistic updates | direct `setQueryData` | storage round-trip = 5-50ms lag, breaks "instant" feel | **direct `chrome.runtime.sendMessage`** popup → offscreen (bypass storage latency) |
| Wallet source of truth | global in window | Privy runs in popup only, SW restart loses session | `chrome.storage.local.sofia-active-wallet` (address only); offscreen re-reads on every SW wake-up |
| Multi-wallet | n/a | per-wallet namespaced storage already in place | all query keys scoped `[resource, wallet]`; switch wallet → offscreen `disconnect() + connect(newWallet)` |

## 3. Package question — which graphql package?

Explorer uses `@0xsofia/dashboard-graphql`. Extension uses `@0xsofia/graphql`.

**Decision: duplicate into `@0xsofia/graphql` (extension's package) for now.**

Reason: Explorer and Extension are currently **fully independent repos**
(not a shared workspace yet). Setting up a shared package would require
upfront monorepo work we haven't scheduled. The cleanest path is to duplicate
the subscription code into the extension's existing `packages/graphql`, then
consolidate at the monorepo migration moment.

**File locations matter** — on Explorer, the code is split between the graphql
package and the main app. Preserve the same split on the extension:

- `sofia-explorer/packages/graphql/src/wsClient.ts` → **graphql package only**
  (singleton client, `getWsClient`/`configureWsClient`/`disposeWsClient`).
- `sofia-explorer/packages/graphql/src/subscriptions/*.graphql` → **graphql package only**
  (queries, consumed by codegen).
- `sofia-explorer/src/lib/realtime/SubscriptionManager.ts` → **main app** (the
  class that holds state, opens/closes subscriptions, writes to the cache).
- `sofia-explorer/src/lib/realtime/derivations.ts` → **main app** (pure
  functions, cache key builders, optimistic helpers).
- `sofia-explorer/src/lib/realtime/wsStatus.ts` → **main app** (external store
  for the offline badge).

Steps:
1. In `extension/packages/graphql`:
   - Copy `src/wsClient.ts` from `sofia-explorer/packages/graphql/src/`.
   - Copy `src/subscriptions/WatchUserPositions.graphql` +
     `src/subscriptions/WatchUserTrackedPositions.graphql` from the same
     Explorer location.
   - Extend `configureClient({apiUrl, wsUrl?})` to forward `wsUrl`.
   - Run codegen.
2. In `extension/src/lib/realtime/` (create the dir):
   - Copy `SubscriptionManager.ts`, `derivations.ts`, `wsStatus.ts` from
     `sofia-explorer/src/lib/realtime/`.
3. Track the duplication in backlog → consolidate during monorepo migration
   (create `@0xsofia/graphql-subscriptions` shared package at that point).

## 4. Phases (one PR each)

**Note**: Phase 2 (persister) now comes BEFORE Phase 3 (derivations). The shared
persister is the bus the derivations rely on — building it first avoids
throwaway messaging code.

### Phase 1 — WS infrastructure (1-2 d)

**Goal**: WS client + SubscriptionManager + first subscription live, all invisible.

1. Extend `extension/packages/graphql` (see §3 for file-location rules):
   - Add `bun add graphql-ws` if not already present.
   - Copy `src/wsClient.ts` from `sofia-explorer/packages/graphql/src/` —
     singleton `getWsClient()` / `configureWsClient()` / `disposeWsClient()`.
   - Extend `configureClient({apiUrl, wsUrl?})` to forward `wsUrl`.
   - Add `src/subscriptions/WatchUserPositions.graphql` +
     `src/subscriptions/WatchUserTrackedPositions.graphql` (copy from
     `sofia-explorer/packages/graphql/src/subscriptions/`).
   - Run codegen, build.

2. Create `extension/src/lib/realtime/` and copy from
   `sofia-explorer/src/lib/realtime/`:
   - `SubscriptionManager.ts` (the class)
   - `derivations.ts`
   - `wsStatus.ts`

3. In the extension app (shipped in Phase 1.B — SW-direct, not offscreen):
   - Add `PLASMO_PUBLIC_GRAPHQL_WS_URL` env var (default
     `wss://mainnet.intuition.sh/v1/graphql`).
   - Create `extension/background/realtime.ts` that holds the
     `SubscriptionManager` instance in the service worker directly. MV3
     keeps the SW alive as long as an open WebSocket is active, so the
     30s idle shutdown doesn't apply while a user is connected.
   - Wallet flow: the popup already writes `walletAddress` to
     `chrome.storage.session` (existing convention). SW listens via
     `chrome.storage.onChanged` → `manager.connect(wallet)` on write,
     `manager.disconnect()` on removal.
   - Wallet switch: onChanged fires with a new value → manager reconnects.

**Why SW-direct over offscreen document**: the extension already owns
one offscreen doc (`public/offscreen.html`, theme detection) and Chrome
caps us at one per extension. Merging theme + realtime is feasible but
invasive (migrate vanilla JS → TS, rewire CSS for theme detection's
Canvas trick). Phase 5 can migrate to a unified offscreen if SW kills
are observed under memory pressure. For Phase 1.B, SW-direct is the
path of least resistance and meets the acceptance criteria.

**Security** (deferred to Phase 4 messaging): new `chrome.runtime.onMessage`
handlers guard `sender.id === chrome.runtime.id`. Phase 1.B adds no new
onMessage handlers (driven by `storage.onChanged`), so no guards needed
here.

**Acceptance**: open the popup with a wallet connected, inspect the SW in
`chrome://extensions/ → Inspect views: service worker` — see
`[WS positions] N positions for 0xabc123…` logs. Switch wallet in popup
→ new subscription kicks in within 1s.

### Phase 2 — React Query persister + cross-context bus (1-2 d)

**Goal**: cache survives popup close + SW restart. Persister doubles as the
cross-context propagation bus.

1. `bun add @tanstack/query-async-storage-persister @tanstack/react-query-persist-client`
   (check package.json first).
2. Create `sidepanel/providers.tsx`:
   - Async storage adapter on `chrome.storage.local` with the bigint-safe
     replacer/reviver (copy from `sofia-explorer/src/lib/providers.tsx:38-66`).
   - `PersistQueryClientProvider` with:
     - `maxAge: 24 * 60 * 60 * 1000` (24h)
     - `gcTime: 24 * 60 * 60 * 1000`
     - `buster: CACHE_VERSION` (exported from `lib/config/cacheVersion.ts`,
       start at `"v1"`, **bump on any queryKey shape change or return-type change**
       — wipes cache automatically, zero support tickets)
     - `dehydrateOptions.shouldDehydrateQuery`: whitelist of query key prefixes
       (avoid persisting noise like favicons, session-scoped stuff)
     - Key: `sofia-ext-rq-cache`
   - QueryClient defaults: `staleTime: 10 * 60 * 1000`, `retry: 1`,
     `refetchOnWindowFocus: false`.
3. Same `QueryClient` + persister config in the offscreen doc so writes land
   in the shared storage.
4. Cross-context propagation: offscreen writes via persister → `chrome.storage.onChanged`
   fires in popup → popup rehydrates the impacted query keys via
   `queryClient.setQueryData`. No custom messaging needed for cache sync.

**Acceptance**: close the popup, reopen immediately → data paints instantly
from cache, no loading spinner. Bump `CACHE_VERSION` to `"v2"` and reload →
cache wiped, fresh fetch.

### Phase 3 — Derivations + hook migrations

Split into two sub-PRs to keep reviewable chunks:

#### Phase 3.A — Sofia-specific derivations (shipped)

Replaces the Phase 1.B stubs with real derivation logic adapted to
Sofia's atom set (no "topics/categories/platforms" à la Explorer — Sofia
models things differently).

`onPositionsUpdate` now writes 8 cache keys per WS push:

- `['positions', wallet]` — raw payload
- `['user-profile-derived', wallet]` — full profile view
- `['user-stats', wallet]` — aggregate counts / staked total
- `['trust-circle', wallet]` — `{accountTermId, accountLabel, shares, tripleTermId}[]` from predicate TRUSTS
- `['following', wallet]` — same shape from predicate FOLLOW (curve_id=1)
- `['daily-streak', wallet]` — `{certifiedToday, votedToday}` booleans from DAILY_CERTIFICATION/VOTE atoms
- `['verified-oauth-platforms', wallet]` — set of platforms from MEMBER_OF/OWNER_OF/TOP_ARTIST/TOP_TRACK/AM predicates
- `['intention-groups', wallet]` — VISITS_FOR_* positions grouped by URL/domain
- `['global-stake-position', wallet]` — position on Beta season pool atom
- `['verified-platforms', wallet]` — legacy alias for OAuth platforms

`TRACKED_TERM_IDS` now contains:
- `DAILY_CERTIFICATION_ATOM_ID`
- `DAILY_VOTE_ATOM_ID`
- `GLOBAL_STAKE.TERM_ID`

This guarantees these positions arrive regardless of the user's total
position count (1-TRUST daily stakes would otherwise drop below the
top-500 cap for power users).

All keys scoped by `wallet` for multi-wallet correctness.

**Acceptance**: SW console shows `[WS tracked] N positions` on connect
(N ∈ [0..3] depending on user's quest activity). Inspect cache in popup
devtools: `queryClient.getQueryData(['trust-circle', wallet])` returns
the expected trust list.

#### Phase 3.B — Hook migrations (not started)

Migrate 5 candidate hooks to read from the WS-backed cache keys with
`staleTime: Infinity, enabled: !!wallet`. Drop their HTTP fetchers.

Candidates from the Phase 3 audit:
- `useTrustCircle` → `['trust-circle', wallet]`
- `useFollowing` → `['following', wallet]`
- `useFollowers` → requires dynamic My Account atom tracking (deferred)
- `useUserSignals` → partial migration (top-100 positions only)
- `useAccountStats` → `['user-stats', wallet]`

Plus `useQuestSystem` gets a light trigger-based refetch: WS sees a
position on DAILY_* → invalidate the HTTP streak count query.

Blockers that stay HTTP:
- `useUserDiscoveryScore` (cross-user, different wallet)
- `useUserCertifications` singleton (>500 possible, refactor invasive)
- `useTrendingCertifications` (cross-user firehose)

### Phase 4 — Optimistic updates (shipped as "mini")

Scoped down to the two flows where an optimistic flip is genuinely
visible (the rest would need Phase 3.B v2 consumers to matter).

**Shipped**:
- `applyOptimisticDailyStreak(qc, wallet, kind)` in `derivations.ts` —
  flips `['daily-streak', wallet]` cache key, returns a rollback closure
  that restores the exact pre-apply snapshot (not a blind set-to-false,
  which would be wrong if the user already acted earlier today).
- `clearOptimisticDailyStreak(qc, wallet)` helper for explicit removal.
- `useQuestSystem.claimQuestXP` wires the cache flip AND a parallel
  `setUserProgress` update so the quest icon turns green in 0ms
  regardless of whether the consumer reads from the WS cache or from
  local `userProgress` state. Rollback on throw or success:false;
  TripleExists treated as success.
- `useDebateClaims.handleStakeSubmit` (Resonance support/oppose claim)
  — `setLocalVotes` moved from the `result.success` branch to BEFORE
  the `await depositWithPool`, so the green support/oppose arrow
  appears the moment the user confirms the stake modal. Previous vote
  captured for precise rollback.

**Transport**: direct setState — no offscreen messaging needed since we
run SW-direct, not offscreen. The popup's QueryClient is the one the
UI reads, so mutating it directly is enough. The SW's QueryClient
catches up via chrome.storage.onChanged when the WS push arrives.

**Deferred to Phase 3.B v2**:
- Generic `applyOptimisticPosition(qc, wallet, termId, delta)` that
  routes by termId type (topic / category / platform / triple). Needs
  per-termId metadata Sofia doesn't cleanly expose yet — ship alongside
  the hook migration attempts for trust / follow / intentions.

**Flows still not optimistic**:
- Cart submit (batch certifications, intentions, trust/distrust) — the
  ModalWeight UI already shows a processing/success state, optimistic
  would just duplicate that
- Regular deposit / redeem — no WS-fed consumer to benefit yet

### Phase 5 — Offline badge + HTTP fallback (1 d)

Port `wsStatus.ts` + `WsStatusBadge.tsx` + HTTP fallback logic from
`sofia-explorer/src/lib/realtime/SubscriptionManager.ts:123-167`.

Status store lives in offscreen, persisted to storage → popup subscribes via
`chrome.storage.onChanged`. Badge renders in popup header. When WS is offline
> 30s, offscreen starts HTTP polling at 60s interval until WS reconnects.

### Phase 6 — Cleanup + score transparency port (1 d)

1. Drop any `REALTIME_ENABLED`-equivalent flag.
2. Port `ScoreExplanationDialog.tsx` + `TopicScoreExplanation` type from
   Explorer. Open it on the "Why this score?" icon in the popup's topic
   detail view.
3. Bump extension version to `0.7.0`, release notes.

## 5. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Offscreen API changes / reason codes | Low-medium | Wrap `chrome.offscreen.*` in a thin adapter so future changes touch one file |
| Offscreen killed by Chrome under memory pressure | Medium | SW listens to offscreen close event, re-spawns on next wallet activity; WS state (last `_updated_at`) persisted to storage for replay-safe resume |
| Popup + offscreen writing same storage keys (race) | Medium | Only offscreen writes cache keys. Popup only writes `sofia-active-wallet` + ephemeral optimistic flags |
| `chrome.storage.local` 10MB quota | Low | Current data fits easily; `console.warn` if cache size >5MB |
| Wallet desync offscreen ↔ popup on multi-wallet switch | Medium | Single source of truth = `chrome.storage.local.sofia-active-wallet`. Offscreen re-reads on every SW wake-up and on every `onChanged` event. All query keys scoped `[resource, wallet]` so stale data from old wallet can't bleed into new session |
| Intuition 75 req/min rate limit hit by a single user | Low (per-IP quota, not shared across users) | Log 429s from day 1 in `wsClient` + fetch wrapper. Architecture push-first + persister should keep usage at 10-30 req/min per user. If a user hits the ceiling in prod → request partner bump with concrete data |
| Cache shape change crashes existing users (20-40 installed) | Medium | `buster: CACHE_VERSION` in `PersistQueryClientProvider` — bump on shape change, cache wiped automatically, zero support |

## 6. Reference commits from Explorer

When implementing, refer to these Explorer commits (branch `master`):

- Phase 1 infra: `203f265`
- Derivations wiring: `2ca1eb7`
- Hook migrations: `a9945e3`
- Optimistic updates: `4ccf311`
- Status store + fallback: `6e8f2ee`
- Drop feature flag: `747ca86`
- Score transparency: `7d0bd83`
- Targeted WS subscription: `09af670`
- BigInt-safe persister: `4858c55`
- Retry amplification fix: `35720b3`
- WS stops overwriting truncated maps: `a163b3b`

## 7. Out of scope for this PR series

- **Events / trust cross-user subscriptions via WS.** These require a Hasura
  filter by follow-graph (only events from users you follow), otherwise
  subscribing to all-chain `triples` = firehose with unmanageable volume.
  The follow-graph isn't stable yet. Continue using HTTP polling via React
  Query (60s interval) for leaderboard / circle feed / cross-user trust
  displays. Revisit when follow-graph is stabilized.
- Monorepo consolidation of `@0xsofia/graphql` and `@0xsofia/dashboard-graphql`
  (separate future migration). WS subscription code will be duplicated across
  Extension + Explorer until then — consolidate into a shared
  `@0xsofia/graphql-subscriptions` at the monorepo migration moment.
- Score rebalancing beyond removing the cap.
