# Sofia write-relayer

Sponsored writes: every signed-in user — **email / Google** (Privy embedded
wallet, no TRUST, no gas) or their **own crypto wallet** — gets free
Recommends. Sofia's treasury
account sends them through `SofiaFeeProxy` with `receiver` = the user's
wallet — every position belongs to the user and can be withdrawn.

Plan and decisions: `docs/plans/SPONSORED_WRITES_PLAN.md` (local).

## Endpoints

```
GET  /health                          -> { ok, relayer }
GET  /sponsor/quota        (Privy)    -> { eligible, left, used, limits, paused } | { eligible: false, reason }
POST /sponsor/recommend    (Privy)    { wallet?, pages: [{ objectId, tags? }] }
                                      -> { txHashes, recommended, tagged, left, partial }
POST /sponsor/gas          (Privy)    { wallet? } -> gas for the one-time proxy approval
```

`Authorization: Bearer <Privy access token>` — the explorer's
`getAccessToken()`.

## Rules

- Eligible: any Privy account with a wallet. The positions go to `wallet`
  when it is one of the account's wallets, else to its embedded wallet, else
  to its first linked wallet.
- Per request: ≤ 5 pages, ≤ 2 tags per page. A page is an atom the indexer
  knows, or (extension right-click) `thing`: the page fields the extension
  pins — the relayer pins them (`INTUITION_PIN_API_KEY`), reuses the atom
  when it exists, else mints it (curve 1, no deposit) before the Recommend.
  A new page counts as one Recommend of the quota. Tags must be existing
  taxonomy atoms (none are minted).
- The extension calls with `Authorization: Extension <token>`: a 90-day
  session the landing's /auth gets from `POST /sponsor/extension-session`
  (Privy bearer) and hands over. Only its sha256 is stored; `DELETE`
  revokes it.
- Per account: `SPONSOR_QUOTA_MONTHLY` (20) and `SPONSOR_QUOTA_DAILY` (5)
  Recommends. Tags don't count against the quota, only against the budget.
- Trend Hunter credits: each call the account's wallets made this month
  (reputation-api: a page where it was early and ≥ 5 credible accounts
  followed) adds `SPONSOR_CREDITS_PER_CALL` (3) Recommends to both quotas.
  The relayer-wide budgets still apply; if the reputation-api is down, the
  account keeps its base quota.
- Second opinions: a recommend or an oppose on a page exactly one other
  account recommended (the 1→2 step where pages stall) doesn't count
  against the quota; `SPONSOR_OPINIONS_DAILY` (5) a day instead.
  `POST /sponsor/oppose` only takes such pages (the explorer's sorting
  queue): a deposit on the claim's counter vault.
- Mission credits: every Trend Hunter mission completed this month adds
  `MISSION_CREDITS` (`@0xsofia/quests`: 1 per daily mission, 3 per weekly
  one) to both quotas. Checked on-chain with the explorer's own rules (page
  positions ≥ 0.009 TRUST after fees, their claims' backers, topic tags),
  cached 2 min per account. No claim step.
- Relayer-wide: `SPONSOR_BUDGET_MONTHLY_TRUST` (500) and
  `SPONSOR_BUDGET_DAILY_TRUST` (a 30th of it, 17) — hard stops; the daily one
  keeps a burst of fake accounts from burning the whole month. Each
  request reserves 0.25 TRUST per triple before sending, then records the
  real cost (value + gas).
- Each Recommend / tag deposits `SPONSOR_DEPOSIT_TRUST` (0.01, the protocol
  minimum) on the user's behalf: Recommend on curve 2 (page market), tags on
  curve 1.
- Sends are serialized (one nonce stream) and chunked under the chain's ~32M
  gas-per-tx cap (35 creations / 80 deposits per tx).

## Treasury (refill here)

|                                          | Address                                      | Network                                      |
| ---------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| **Prod** (`relayer.sofia.intuition.box`) | `0x3CED7E2b7db82d623Da15C548f74b5742b081f77` | Intuition mainnet (chain 1155), native TRUST |

- Explorer: https://explorer.intuition.systems/address/0x3CED7E2b7db82d623Da15C548f74b5742b081f77
- Live check: `GET https://relayer.sofia.intuition.box/health` returns the address; the boot log prints the balance.
- Send plain TRUST to it (no contract call). Keep a small float: a Recommend costs Sofia ~0.11–0.25 TRUST, the monthly budget caps spending at `SPONSOR_BUDGET_MONTHLY_TRUST`.
- Same address as the local dev relayer for now; a dedicated prod key is cleaner later.

## Env

| Var                                             | Default                 |                                            |
| ----------------------------------------------- | ----------------------- | ------------------------------------------ |
| `DATABASE_URL`                                  | —                       | Postgres (Neon) — its own database         |
| `PRIVY_APP_ID`, `PRIVY_APP_SECRET`              | —                       | the **explorer's** Privy app               |
| `RELAYER_PRIVATE_KEY`                           | —                       | treasury hot key — keep its balance small  |
| `INTUITION_RPC_URL`                             | public RPC              | the rpc-proxy `/rpc` in prod               |
| `RPC_PROXY_SERVER_KEY`                          | —                       | sent as `x-rpc-proxy-key` to the rpc-proxy |
| `INTUITION_GRAPHQL_URL`                         | mainnet indexer         |                                            |
| `SPONSOR_QUOTA_MONTHLY` / `SPONSOR_QUOTA_DAILY` | 20 / 5                  |                                            |
| `SPONSOR_BUDGET_MONTHLY_TRUST`                  | 500                     |                                            |
| `SPONSOR_BUDGET_DAILY_TRUST`                    | monthly / 30            |                                            |
| `SPONSOR_DEPOSIT_TRUST`                         | 0.01                    |                                            |
| `SPONSOR_OPINIONS_DAILY`                        | 5                       | second opinions a day, outside the quota   |
| `INTUITION_PIN_API_KEY`                         | —                       | pins new pages; unset ⇒ known pages only   |
| `INTUITION_PIN_URL`                             | Intuition pin service   |                                            |
| `REPUTATION_API_URL`                            | —                       | Trend Hunter calls; empty ⇒ no credits     |
| `SPONSOR_CREDITS_PER_CALL`                      | 3                       | free Recommends per call this month        |
| `SPONSOR_DRY_RUN`                               | —                       | `1`: simulate every tx, send nothing       |
| `CORS_ORIGINS`                                  | `http://localhost:5173` | CSV                                        |
| `PORT`                                          | 8792                    |                                            |

## Local dev

```bash
cd services/write-relayer
cp .env.example .env      # fill it
bunx prisma migrate deploy
SPONSOR_DRY_RUN=1 bun run dev
bun test
```

## Coolify

Build context: **repo root**, Dockerfile `services/write-relayer/Dockerfile`,
port 8792, health check `/health`. Migrations run at boot.
