# Intuition Pro — MVP (shared bookmarks by topic)

> **Status:** mocked MVP for demo. No on-chain data, no wallet, no backend.
> Everything renders from `src/data/`. Built to be **lifted into
> `apps/explorer`** when we wire it to real data.

Reframe (discussion Billy): strip Circle Pro v2 down to one crisp use case —
**import your bookmarks, classify them by topic, share them with your team.**
A shared bookmark manager. The on-chain "circle" framing stays as the
backdrop, but the hero loop is bookmarks → topics → sharing.

---

## Why this is a standalone app (and not a route in the explorer)

`apps/explorer` is the real product: React 18 + Vite + react-router 7 +
**Privy** (wallet auth) + **viem** + **GraphQL** against `mainnet.intuition.sh`.
Booting it gives you *real on-chain data only* — there is no mock path. That is
exactly the wrong substrate for a fast, fully-mocked demo we want to iterate on
(especially the onboarding).

So this MVP is its own workspace app:

- **Zero coupling** to Privy / GraphQL / the explorer shell → boots instantly,
  always shows data, never hits the chain.
- **No conflict** with the in-flight explorer refactor (issue #556).
- **Lift-ready**: components are plain TSX and the data layer hides behind a
  repository interface (`src/data/repository.ts`). Swapping the mock for the
  explorer's real GraphQL hooks is a one-file change, not a rewrite.

Runs on **:5174** (the explorer owns :5173).

```bash
bun run --filter circle-pro-mvp dev      # from the monorepo root
# or
cd apps/circle-pro-mvp && bun dev
```

---

## Sofia monorepo — the map (so this stays integrable)

```
THP/Sofia/                      bun workspaces: apps/* packages/* services/*
├─ apps/
│  ├─ explorer/      ← the real app (Privy + viem + GraphQL, on-chain). PROD TARGET.
│  ├─ extension/     ← browser extension (sidepanel) — where bookmarks get marked
│  ├─ landing/ og/ doc/ blog/
│  └─ circle-pro-mvp/  ← THIS app (mocked, standalone)
├─ packages/
│  ├─ graphql/       ← @0xsofia/graphql  (codegen'd client + schema, on-chain queries)
│  ├─ design-system/ ← @0xsofia/design-system  (shared tokens/components)
│  ├─ taxonomy/      ← @0xsofia/taxonomy  (skills/tools/topic definitions)
│  └─ quests/
└─ services/         ← group-api (Circle membership/notifications), mastra, …
```

Key fact that shapes everything: in the explorer, "data" = **on-chain triples**
read via `@0xsofia/graphql` (e.g. `atoms(where:{wallet_id})`,
`positions`, `triples`). A "bookmark" in Intuition is a **Mark** signal — an
atom for a URL, tagged with a topic/intent, optionally staked. That primitive
already exists in the design (`ONCHAIN` kind `mark`). This MVP mocks it.

---

## App structure

```
apps/circle-pro-mvp/
├─ index.html              dark-only, fonts, #root
├─ vite.config.ts          port 5174 (falls back if busy), @ alias, no proxy
├─ src/
│  ├─ main.tsx             createRoot
│  ├─ App.tsx              onboarding gate → Circle Pro shell
│  ├─ shell/               Nav · Header (KPIs + tabs) · JoinModal
│  ├─ tabs/                Overview · Members · Roles · Activity · Memory
│  ├─ onboarding/          Welcome (import-bookmarks flow — refined from screenshots)
│  ├─ components/          Icon · primitives · TopicsTreemap · BookmarkCard
│  ├─ lib/                 gate (join/Locked) · toast
│  ├─ data/
│  │  ├─ types.ts          domain model (Bookmark, Topic, Member, …)
│  │  ├─ helpers.ts        pure helpers (avatars, formatting, scoring)
│  │  └─ mock.ts           ← the ONLY seam: all seed data lives here
│  └─ styles/              global (tokens) + shell / surfaces /
│                          members-roles / activity-memory / overlays
```

The original Claude Design project (JSX + CSS source) stays the **source of
truth** on claude.ai/design — it was ported here into modular TSX, not mirrored.
`data/mock.ts` is the single data seam: when wiring real data, back its exported
names with the explorer's GraphQL hooks (a `repository.ts`) and the tabs don't
change.

> Files are kept under 800 lines on purpose (coding-style rule) — hence the
> split CSS modules rather than one stylesheet.

---

## How to integrate into the explorer later

1. The data model in `src/data/types.ts` mirrors what the explorer's GraphQL
   returns. Implement `repository.ts` against `@0xsofia/graphql` instead of
   `mock.ts`.
2. Drop the `tabs/` + `shell/` components under `apps/explorer/src/circle-pro/`
   and mount a `<Route path="/pro">` (or fold into `CircleDetailView`).
3. Replace the local `Icon`/`Avatar` primitives with the explorer's
   `@0xsofia/design-system` equivalents.
4. Onboarding maps to the **extension** import flow + a Privy connect step.

Nothing here imports a mock-only API, so the move is mechanical.
