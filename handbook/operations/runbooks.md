# Runbooks

Short procedures for what has already happened, or will. Environments and URLs: [environments.md](environments.md). Variables: [deployment.md](deployment.md).

## Free Recommends stop working

1. `GET https://relayer.sofia.intuition.box/health` → `{ ok, relayer }`. Not 200: see the deploy and container logs in Coolify.
2. Treasury empty? Check the balance of the address in [environments.md](environments.md) on https://explorer.intuition.systems. The explorer then falls back to paying from the wallet.
3. Monthly or daily budget reached (`SPONSOR_BUDGET_*`): quota answers say "paused" until the next day / month.

## Refill a relayer treasury

Send plain TRUST (Intuition mainnet, chain 1155) to the treasury address of the environment ([environments.md](environments.md)). No contract call. A free Recommend costs Sofia ~0.11–0.25 TRUST (more for a page whose atom must be created).

## Build fails

| Log says                                             | Cause                                                                 | Fix                                                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `lstat …/services: no such file or directory`        | wrong repository (`intuition-box/.github`)                            | Git Source → `intuition-box/Sofia`                                                                     |
| `open Dockerfile: no such file or directory`         | wrong base directory                                                  | rpc-proxy: base `/services/rpc-proxy`; reputation-api / write-relayer: base `/` + full Dockerfile path |
| `Unknown lockfile version`                           | Bun 1.1 image vs the repo's `bun.lock`                                | Dockerfile on `oven/bun:1.3-alpine`                                                                    |
| `no space left on device`                            | server disk full (images, build cache)                                | Servers → Sofia-Apps → Docker Cleanup; enable the scheduled cleanup; deploy one app at a time          |
| `the URL must start with the protocol postgresql://` | `DATABASE_URL` empty, a placeholder, or the `psql '…'` command pasted | paste the bare connection string; check the variable's "updated" time actually changed                 |

## Deploy "fails" but the app started

| Symptom                                                                        | Cause                                                               | Fix                                         |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------- |
| `New container is not healthy, rolling back`, healthcheck `Connection refused` | healthcheck host `localhost` (→ `::1`); Bun services listen on IPv4 | Healthcheck host `127.0.0.1`                |
| Container healthy, public URL **502**                                          | Traefik still routes to an old port                                 | re-save the domain (and the port), redeploy |

## Recompute rankings now

The reputation-api recomputes daily (Coolify scheduled tasks). To force it:

```
curl -X POST -H "x-compute-token: $LEADERBOARD_COMPUTE_TOKEN" https://reputation-api.sofia.intuition.box/internal/leaderboard/compute
curl -X POST -H "x-compute-token: $LEADERBOARD_COMPUTE_TOKEN" "https://reputation-api.sofia.intuition.box/internal/trend-hunters/compute?month=2026-11"
```

Both answer 202 and run in the background (a few minutes: credibility comes from the MCP trust engine).

## Rotate a secret

| Secret                      | Also change                                                                                                                           | Side effect                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `RPC_PROXY_SERVER_KEY`      | rpc-proxy **and** write-relayer of the same environment, then restart both                                                            | none                                      |
| `OG_SHARE_SECRET`           | —                                                                                                                                     | share links already posted stop resolving |
| `PRIVY_APP_SECRET`          | write-relayer (and group-api)                                                                                                         | none if done together                     |
| `RELAYER_PRIVATE_KEY`       | move the remaining TRUST to the new address; update the treasury address in [environments.md](environments.md) and the relayer README | —                                         |
| `LEADERBOARD_COMPUTE_TOKEN` | —                                                                                                                                     | scheduled tasks read it from the env      |

Runtime variables apply on the next restart; `VITE_*` (build) on the next build.

## Reset the staging database

Neon → project _sofia-reputation_ → branch `staging` → **Reset from parent**: it becomes a fresh copy of production. Connection strings don't change.
