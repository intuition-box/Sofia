# reputation-api

> **How it is used, end to end:** [handbook/features/reputation.md](../../handbook/features/reputation.md) (Top Voices) and [spotters.md](../../handbook/features/spotters.md). Deployment: [handbook/operations](../../handbook/operations/).

Precomputed rankings for the Explorer: **Top Voices** (reputation per topic)
and **Spotters** (monthly early-finder ranking, with the monthly pool). Scheduled
jobs compute snapshots; the read path serves them with zero scoring.

Hono + Bun + Prisma, its own database, kept apart from group membership
(`group-api`).

## Reputation score

Per account, over every topic it's active in:

```
score(topic) = A(topic) + B(topic)
  A = @0xsofia/reputation computeReputationProfile   (trust bonus + cert points)
  B = @0xsofia/reputation computeDerivedReputation   (Σ credibility of followers who staked after the account)
```

Scores are stored per **bucket**: a topic slug, or one of the reserved
`__general__`, `__trusts__`, `__distrust__` buckets for non-topic cert points.
The overall score is the sum of a wallet's buckets, computed by the client.

`B`'s credibility comes from the MCP trust engine (`compute_composite_score`).
The job dedupes follower addresses across all accounts and calls the MCP **once
per unique address** (3 at a time, 45 s timeout, failure = 0).

## Endpoints

| Method | Path                                     | Auth              | Returns                                                                                  |
| ------ | ---------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `GET`  | `/health`                                | —                 | `ok`                                                                                     |
| `GET`  | `/leaderboard`                           | public            | Full snapshot: `{wallet, topicId, score, rank}` rows + `computedAt`                      |
| `GET`  | `/leaderboard?topic=<id>&limit=50`       | public            | One bucket's ranking (limit ≤ 200)                                                       |
| `GET`  | `/trend-hunters?month=YYYY-MM&limit=10`  | public            | The month's Spotters ranking; each Top N wallet's pool share in `reward` (TRUST), `pool` |
| `GET`  | `/early-signals?month=YYYY-MM&limit=6`   | public            | The month's best spotted pages                                                           |
| `GET`  | `/trend-hunters/:wallet`                 | public            | Every month the wallet was ranked (badges)                                               |
| `POST` | `/internal/leaderboard/compute`          | `x-compute-token` | Recompute Top Voices (202, runs in background; 409 if already running)                   |
| `POST` | `/internal/trend-hunters/compute?month=` | `x-compute-token` | Recompute Spotters for a month (default: current)                                        |

The compute routes answer 404 when `LEADERBOARD_COMPUTE_TOKEN` is unset.

## Environment

| Variable                                                                         | Default                                   |                                                |
| -------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------- |
| `DATABASE_URL`                                                                   | —                                         | **required**, Neon direct URL (not the pooler) |
| `LEADERBOARD_COMPUTE_TOKEN`                                                      | unset                                     | guards the compute routes                      |
| `CORS_ORIGINS`                                                                   | `http://localhost:5173`                   | comma-separated                                |
| `INTUITION_GRAPHQL_URL`                                                          | `https://mainnet.intuition.sh/v1/graphql` |                                                |
| `MCP_TRUST_URL`                                                                  | `https://mcp-trust.intuition.box`         |                                                |
| `TREND_HUNTER_POOL_TRUST` / `TREND_HUNTER_POOL_SIZE` / `TREND_HUNTER_POOL_START` | `1000` / `10` / `2026-11`                 | monthly pool: amount, winners, first month     |
| `PORT`                                                                           | `8790`                                    |                                                |

## Run

```bash
cp .env.example .env   # DATABASE_URL + LEADERBOARD_COMPUTE_TOKEN
bunx prisma migrate deploy
bun run dev            # http://localhost:8790

curl -X POST localhost:8790/internal/leaderboard/compute -H "x-compute-token: $LEADERBOARD_COMPUTE_TOKEN"
```

## Deploy (Coolify)

Build context = repo root, Dockerfile = `services/reputation-api/Dockerfile`
(it imports workspace packages). Scheduled tasks (container command; the
image is Alpine, so `wget`, and `127.0.0.1` since Bun listens on IPv4 only):

- `0 3 * * *`, daily: Top Voices + the current Spotters month

  ```sh
  wget -qO- --post-data="" --header="x-compute-token: $LEADERBOARD_COMPUTE_TOKEN" http://127.0.0.1:8790/internal/leaderboard/compute; wget -qO- --post-data="" --header="x-compute-token: $LEADERBOARD_COMPUTE_TOKEN" http://127.0.0.1:8790/internal/trend-hunters/compute
  ```

- `0 4 1 * *`, monthly: freeze the month that just ended

  ```sh
  wget -qO- --post-data="" --header="x-compute-token: $LEADERBOARD_COMPUTE_TOKEN" "http://127.0.0.1:8790/internal/trend-hunters/compute?month=$(date -u -d @$(( $(date +%s) - 86400 )) +%Y-%m)"
  ```
