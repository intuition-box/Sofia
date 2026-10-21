# reputation-api

Precomputed **reputation leaderboard** for the Explorer's Explore page. A cron
triggers a job that scores every account by its public reputation and writes a
ranked snapshot; the read path serves that snapshot with zero scoring.

Kept as its own service (own DB) so the reputation domain stays decoupled from
group membership (`group-api`).

## Score

Per account, over **all** the topics it's active in (no MAX_INTERESTS preview cap):

```
score(topic) = A(topic) + B(topic)
  A = @0xsofia/reputation computeReputationProfile   (trust bonus + cert points; no OAuth in this phase)
  B = @0xsofia/reputation computeDerivedReputation   (Σ credibility of followers who staked after the account)
overall = Σ_topics score(topic)
```

`B`'s credibility comes from the MCP trust engine (`compute_composite_score`).
The job dedupes every follower address across all accounts and calls the MCP
**once per unique address** — a shared credibility table, the reason this is
cheaper server-side than the per-viewer client computation.

## Endpoints

| Method | Path                             | Auth              | Purpose                                               |
| ------ | -------------------------------- | ----------------- | ----------------------------------------------------- |
| `GET`  | `/health`                        | —                 | Liveness                                              |
| `GET`  | `/leaderboard?limit=50&offset=0` | public            | Read the ranked `__overall__` snapshot + `computedAt` |
| `POST` | `/internal/leaderboard/compute`  | `x-compute-token` | Recompute the snapshot (cron trigger)                 |

## Run

```bash
cp .env.example .env   # set DATABASE_URL + LEADERBOARD_COMPUTE_TOKEN
bunx prisma migrate deploy
bun run dev            # http://localhost:8790

# trigger a compute
curl -X POST localhost:8790/internal/leaderboard/compute -H "x-compute-token: $LEADERBOARD_COMPUTE_TOKEN"
```

## Deploy (Coolify)

Build **context = repo root**, Dockerfile = `services/reputation-api/Dockerfile`
(it imports workspace packages, so it can't build standalone). Set `DATABASE_URL`,
`LEADERBOARD_COMPUTE_TOKEN`, `CORS_ORIGINS`, and (optionally) `INTUITION_GRAPHQL_URL`
/ `MCP_TRUST_URL`. Add a scheduled task that POSTs `/internal/leaderboard/compute`
every 6–12h.
