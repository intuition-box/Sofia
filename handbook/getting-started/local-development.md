# Local development

Everything needed to run the explorer, the extension and the backend services on your machine: dependencies, env vars, databases, start order, checks and a smoke test.

What the services do is explained in [../features/](../features/) (free Recommends, Spotters). Deployed environments are in [../operations/](../operations/).

## Prerequisites

- **bun ≥ 1.3** and **Node ≥ 22.13**
- Access to the Neon project **sofia-reputation**. It holds two databases: `neondb` (reputation-api) and `write_relayer` (write-relayer). Ask Max for the connection strings.
- The **explorer's** Privy app: App ID, Client ID, App secret (Privy dashboard, app "sofia-dashboard").
- For the relayer: a treasury private key with a little TRUST on Intuition mainnet. Use your own dev key. Never the prod one, never committed.

## 1. Install

From the repo root:

```bash
bun install
```

The write-relayer now depends on the workspace package `@0xsofia/quests` (mission rules shared with the explorer and the extension). If an install fails with `ENOENT` / `failed to symlink`, a folder is owned by root: `sudo chown -R $USER:$USER <folder>`.

## 2. Services and ports

| Service        | Port | Needed for                                                   | Start                                       |
| -------------- | ---- | ------------------------------------------------------------ | ------------------------------------------- |
| explorer       | 5173 | the app                                                      | `bun run dev:explorer`                      |
| reputation-api | 8790 | Top Voices, `/spotters` ranking + pool, spotted-page credits | `cd services/reputation-api && bun run dev` |
| rpc-proxy      | 8791 | optional in dev (avoids `429 Bandwidth limit exceeded`)      | `cd services/rpc-proxy && bun run dev`      |
| write-relayer  | 8792 | free Recommends, second opinions, credits                    | `cd services/write-relayer && bun run dev`  |

Without the relayer, the explorer still works: every cart goes through the wallet and the free-Recommends counter is hidden. Without the reputation-api, `/spotters` shows "unavailable" and spotted-page credits count 0.

If Vite starts on another port (5174…), add it to `CORS_ORIGINS` of both services.

## 3. Env files

Copy each `.env.example` to `.env` and fill it in. **Never commit a `.env`, and don't `source` it in a shared terminal.**

### `services/reputation-api/.env`

| Var                                            | Dev value                                           |
| ---------------------------------------------- | --------------------------------------------------- |
| `DATABASE_URL`                                 | Neon `sofia-reputation` / `neondb`                  |
| `INTUITION_GRAPHQL_URL`                        | default (mainnet indexer)                           |
| `MCP_TRUST_URL`                                | default (`https://mcp-trust.intuition.box`)         |
| `LEADERBOARD_COMPUTE_TOKEN`                    | any string; guards the compute endpoints            |
| `TREND_HUNTER_POOL_TRUST` / `_SIZE` / `_START` | `1000` / `10` / `2026-11` (no pool before November) |
| `CORS_ORIGINS`                                 | `http://localhost:5173`                             |

### `services/write-relayer/.env`

| Var                                             | Dev value                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`                                  | Neon `sofia-reputation` / `write_relayer`                                      |
| `PRIVY_APP_ID`, `PRIVY_APP_SECRET`              | the **explorer's** Privy app                                                   |
| `RELAYER_PRIVATE_KEY`                           | your dev treasury key (0x…)                                                    |
| `INTUITION_RPC_URL`                             | `http://localhost:8791/rpc` if the rpc-proxy runs, else default                |
| `RPC_PROXY_SERVER_KEY`                          | same value as the rpc-proxy's, if used                                         |
| `SPONSOR_QUOTA_MONTHLY` / `_DAILY`              | `20` / `5`                                                                     |
| `SPONSOR_BUDGET_MONTHLY_TRUST` / `_DAILY_TRUST` | `500` / `17`                                                                   |
| `SPONSOR_OPINIONS_DAILY`                        | `5` (second opinions, outside the quota)                                       |
| `SPONSOR_DEPOSIT_TRUST`                         | `0.01`                                                                         |
| `REPUTATION_API_URL`                            | `http://localhost:8790` (empty: no spotted-page credits)                       |
| `SPONSOR_CREDITS_PER_CALL`                      | `3`                                                                            |
| `SPONSOR_DRY_RUN`                               | `1` simulates every tx and sends nothing: **start with this**                  |
| `INTUITION_PIN_API_KEY`                         | Intuition pin key: pins new pages from the extension (unset: known pages only) |
| `CORS_ORIGINS`                                  | `http://localhost:5173` + the landing's dev origin                             |

### `services/rpc-proxy/.env` (optional)

`PORT=8791`, `INTUITION_RPC_UPSTREAM` (default public RPC), `RPC_PROXY_SERVER_KEY`, `RPC_ALLOWED_ORIGINS`. See [services/rpc-proxy/README.md](../../services/rpc-proxy/README.md).

### `apps/landing/.env`

| Var                                         | Dev value                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `VITE_PRIVY_APP_ID`, `VITE_PRIVY_CLIENT_ID` | **the explorer's** Privy app (same users and embedded wallets; the relayer only accepts that app) |
| `VITE_WRITE_RELAYER_URL`                    | `http://localhost:8792`                                                                           |

The explorer's Privy app must allow the landing's origin (dashboard → allowed domains).

### `apps/extension/.env.development`

| Var                               | Dev value                                                  |
| --------------------------------- | ---------------------------------------------------------- |
| `PLASMO_PUBLIC_WRITE_RELAYER_URL` | `http://localhost:8792` (unset: right-click is never free) |

### `apps/explorer/.env.local`

| Var                                         | Dev value                                           |
| ------------------------------------------- | --------------------------------------------------- |
| `VITE_PRIVY_APP_ID`, `VITE_PRIVY_CLIENT_ID` | explorer's Privy app                                |
| `VITE_WRITE_RELAYER_URL`                    | `http://localhost:8792` (unset: no free Recommends) |
| `VITE_REPUTATION_API_URL`                   | defaults to `http://localhost:8790` in dev          |
| `VITE_INTUITION_RPC_URL`                    | `http://localhost:8791/rpc` if the rpc-proxy runs   |
| `VITE_PIN_PROXY_URL`                        | only to mint **new** atoms (skills, circles…)       |

## 4. Databases

Each service has its own Prisma schema and migrations:

```bash
cd services/reputation-api && bun run db:generate && bun run db:deploy
cd services/write-relayer && bun run db:generate && bun run db:deploy
```

The relayer migrations `20261029100000_opinions` (`kind`, `opinionCount`) and `20261029140000_extension_sessions` (`ExtensionSession`) must be applied, or the relayer fails on its first request.

The Neon databases are shared with prod. Apply migrations, but **never** run `db:migrate` (dev) or reset against them.

## 5. Fill the reputation-api

The ranking and Top Voices are precomputed snapshots. Trigger them once (and after testing writes):

```bash
TOKEN=<LEADERBOARD_COMPUTE_TOKEN>
curl -X POST -H "x-compute-token: $TOKEN" http://localhost:8790/internal/leaderboard/compute
curl -X POST -H "x-compute-token: $TOKEN" "http://localhost:8790/internal/trend-hunters/compute?month=2026-10"
```

Both run in the background (202). Follow the service logs; the credibility calls to the MCP take a few minutes.

## 6. Start order

1. rpc-proxy (optional)
2. reputation-api
3. write-relayer (`SPONSOR_DRY_RUN=1` first; remove it once the flow looks right)
4. explorer

## Shared packages

| Package                  | Used by                            | Note                                                                                                                                                                                          |
| ------------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@0xsofia/graphql`       | explorer, extension, services      | **Never write inline GraphQL.** Add a query to `packages/graphql/src/queries/*.graphql`, then `cd packages/graphql && bun run codegen` and commit `src/generated/index.ts`.                   |
| `@0xsofia/quests`        | explorer, extension, write-relayer | Mission rules (`computeDailyMissions`, `monthMissionCredits`, `needsSecondOpinion`). The relayer pays credits with the **same** functions the explorer displays, so change them in one place. |
| `@0xsofia/taxonomy`      | everyone                           | Atom ids, `SOFIA_I_ATOM_ID`, page-claim predicates                                                                                                                                            |
| `@0xsofia/design-system` | explorer                           | `<AnimatedNumber>` and the shared styles                                                                                                                                                      |

## Checks before a commit

```bash
# explorer (run from apps/explorer)
bun ./node_modules/typescript/bin/tsc --noEmit -p .
bun ./node_modules/vitest/vitest.mjs run

# services
cd services/write-relayer && bunx tsc --noEmit -p . && bun test
cd services/reputation-api && bunx tsc --noEmit -p . && bun test

# formatting: explorer and core files follow the root .prettierrc.mjs
# (single quotes, trailing commas), not the extension's style
bunx prettier --write <files>
```

## Smoke test (signed in on the explorer)

1. `/trending`: the line at the top shows "N free Recommends left today".
2. Recommend a page from the cart: no signature, the position lands on your wallet. The very first time, the wallet approves Sofia once (the relayer sends the gas).
3. `/spotters`: "Pages to sort" lists pages with one recommender. 👍 / 👎 lowers "N free today" but not the monthly quota.
4. "Today's missions" moves a few seconds later (indexer lag). The credit shows in "+N earned this month" on `/trending` within 2 minutes.
5. Extension: sign in on the landing's `/auth` (email works) → "Free Recommends are on". Right-click a page → Recommend → toast "Recommend · free"; the position is on the account's wallet, even for a page that had no atom.

## Gotchas

- **Missions reset at 00:00 UTC** (1 or 2 a.m. in Paris). A write just after midnight counts for the new day.
- **Indexer lag**: a new position takes a few seconds to show. The explorer refetches missions at 3, 10 and 25 s after a write.
- **`429 Bandwidth limit exceeded`** from `rpc.intuition.systems`: the public RPC throttles per IP. Run the rpc-proxy.
- **Vite errors in the middle of edits** ("X is not defined", "No routes matched", hook order): hot reload caught a half-saved file. Reload the page.
- **Doubled transactions**: check you don't have both the dev and the store build of the extension loaded.
- **The ranking counts every Intuition account**, not only Sofia users. The rule for who can be paid from the pool is still open (the first payout is for November).
- **Mastra / AI and Circles (group-api)** are paused: you don't need them for this branch.
