# Deployment (Coolify)

Every variable each deployed app needs, per environment. **No secret values here**: secrets live in Coolify (and in the team's password manager). For local development, see [DEV_SETUP.md](DEV_SETUP.md).

## Environments

| Coolify environment | Git branch | Deploys                                       |
| ------------------- | ---------- | --------------------------------------------- |
| **production**      | `main`     | automatically on push to `main`               |
| **staging**         | `dev`      | automatically on push to `dev` (being set up) |

Coolify project **Sofia**, server **Sofia-Apps**, source **host-intuition-box** (GitHub App), repository **`intuition-box/Sofia`**. Every `*.sofia.intuition.box` name already resolves to the server: no DNS work for a new subdomain.

## Rules that bit us

- **Repository**: pick `intuition-box/Sofia`, not `intuition-box/.github` (they sit next to each other in the list).
- **Healthcheck host `127.0.0.1`**, not `localhost`: the Bun services listen on IPv4 only and `localhost` resolves to `::1` in the Alpine images.
- **Build-time vs runtime**: every `VITE_*` must be a **Build Variable** (Vite inlines it). Every secret of a server (`DATABASE_URL`, keys, tokens) must have **Available at Buildtime unchecked**, or it is passed to `docker build` and shows in the build log.
- **Neon URLs**: the **direct** connection string (Connect → Connection pooling off, no `-pooler` in the host). Prisma applies migrations at boot.
- **After changing ports**: re-save the domain, or Traefik keeps routing to the old port (502 while the container is healthy).
- **Monorepo services** (reputation-api, write-relayer) build from the repo root with `bun.lock`: Dockerfiles on `oven/bun:1.3-alpine` (1.1 can't read the lockfile).

## Apps and build settings

| App              | Domain (prod)                        | Domain (staging)                             | Base dir              | Dockerfile                            | Port |
| ---------------- | ------------------------------------ | -------------------------------------------- | --------------------- | ------------------------------------- | ---- |
| Explorer         | `explorer.sofia.intuition.box`       | `staging-explorer.sofia.intuition.box`       | `/`                   | `/apps/explorer/Dockerfile`           | 80   |
| Landing          | `sofia.intuition.box`                | `staging.sofia.intuition.box`                | `/`                   | `/apps/landing/Dockerfile`            | 80   |
| og-generator     | `og.sofia.intuition.box`             | `staging-og.sofia.intuition.box`             | `/`                   | `/apps/og/Dockerfile`                 | 3000 |
| reputation-api   | `reputation-api.sofia.intuition.box` | `staging-reputation-api.sofia.intuition.box` | `/`                   | `/services/reputation-api/Dockerfile` | 8790 |
| rpc-proxy        | `rpc.sofia.intuition.box`            | `staging-rpc.sofia.intuition.box`            | `/services/rpc-proxy` | `/Dockerfile`                         | 8791 |
| write-relayer    | `relayer.sofia.intuition.box`        | `staging-relayer.sofia.intuition.box`        | `/`                   | `/services/write-relayer/Dockerfile`  | 8792 |
| pin-proxy        | `pin.sofia.intuition.box`            | (prod one is shared)                         | `/services/pin-proxy` | `/Dockerfile`                         | 8790 |
| group-api        | `group-api.sofia.intuition.box`      | (paused)                                     | `/services/group-api` | `/Dockerfile`                         | 8788 |
| url-img-resolver | `preview.sofia.intuition.box`        | (prod one is shared)                         | `/services/og-proxy`  | `/Dockerfile`                         | 8787 |

Healthcheck for the three Bun services: `GET http://127.0.0.1:<port>/health` → 200.

## Variables

Legend: **B** = Build Variable, **R** = runtime only (Available at Buildtime unchecked), 🔒 = secret (get it from the place named, never commit it).

### Explorer

| Variable                  |     | Prod                                                                    | Staging                                              |
| ------------------------- | --- | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| `VITE_PRIVY_APP_ID`       | B   | `cmmey7hlx01110clgylcc1ulc` (Privy app _sofia-dashboard_)               | same                                                 |
| `VITE_WRITE_RELAYER_URL`  | B   | `https://relayer.sofia.intuition.box`                                   | `https://staging-relayer.sofia.intuition.box`        |
| `VITE_REPUTATION_API_URL` | B   | `https://reputation-api.sofia.intuition.box`                            | `https://staging-reputation-api.sofia.intuition.box` |
| `VITE_INTUITION_RPC_URL`  | B   | `https://rpc.sofia.intuition.box/rpc`                                   | `https://staging-rpc.sofia.intuition.box/rpc`        |
| `VITE_PIN_PROXY_URL`      | B   | `https://pin.sofia.intuition.box/pin` (with `/pin`; minting a new atom fails without it) | same                                                 |
| `VITE_OG_BASE_URL`        | B   | `https://og.sofia.intuition.box`                                        | `https://staging-og.sofia.intuition.box`             |
| `VITE_OG_PROXY_URL`       | B   | `https://preview.sofia.intuition.box`                                   | same                                                 |
| `VITE_MASTRA_URL`         | B   | unused (AI decommissioned), can be removed                              | —                                                    |

### Landing (`/auth` hands the wallet and the free-Recommends session to the extension)

| Variable                 |     | Prod                                                                                        | Staging                                       |
| ------------------------ | --- | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `VITE_PRIVY_APP_ID`      | B   | `cmmey7hlx01110clgylcc1ulc` (must be the explorer's app: same users, same embedded wallets) | same                                          |
| `VITE_PRIVY_CLIENT_ID`   | B   | 🔒-ish: Privy → sofia-dashboard → Settings → Clients (`client-…`)                           | same                                          |
| `VITE_WRITE_RELAYER_URL` | B   | `https://relayer.sofia.intuition.box`                                                       | `https://staging-relayer.sofia.intuition.box` |

Privy → sofia-dashboard → **Domains** must list `https://sofia.intuition.box`, `https://staging.sofia.intuition.box`, `https://explorer.sofia.intuition.box`, `https://staging-explorer.sofia.intuition.box`.

### og-generator (share cards on X)

| Variable          |     | Prod                                                                        | Staging                                  |
| ----------------- | --- | --------------------------------------------------------------------------- | ---------------------------------------- |
| `OG_SHARE_SECRET` | B+R | 🔒 random (`openssl rand -hex 32`); changing it breaks existing share links | its own random                           |
| `OG_PUBLIC_URL`   | B+R | `https://og.sofia.intuition.box`                                            | `https://staging-og.sofia.intuition.box` |

### reputation-api

| Variable                                       |     | Prod                                                                  | Staging                                        |
| ---------------------------------------------- | --- | --------------------------------------------------------------------- | ---------------------------------------------- |
| `DATABASE_URL`                                 | R   | 🔒 Neon _sofia-reputation_, branch `main`, database `neondb` (direct) | branch `staging`, `neondb`                     |
| `LEADERBOARD_COMPUTE_TOKEN`                    | R   | 🔒 random                                                             | its own random                                 |
| `CORS_ORIGINS`                                 | R   | `https://explorer.sofia.intuition.box`                                | `https://staging-explorer.sofia.intuition.box` |
| `TREND_HUNTER_POOL_TRUST` / `_SIZE` / `_START` | R   | `1000` / `10` / `2026-11`                                             | same                                           |

Scheduled tasks (in the app): daily `0 3 * * *` POST `/internal/leaderboard/compute` and `/internal/trend-hunters/compute`; monthly `0 4 1 * *` the trend-hunters compute with `?month=<previous month>` — commands in `docs/plans/COOLIFY_SETUP.md` (local) or ask Max. Header `x-compute-token: $LEADERBOARD_COMPUTE_TOKEN`.

### rpc-proxy

| Variable                 |     | Prod                                                                                                                                                                       | Staging                                                                                                                                                                            |
| ------------------------ | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RPC_PROXY_SERVER_KEY`   | R   | 🔒 random, **same value as write-relayer's**                                                                                                                               | its own, same as staging relayer's                                                                                                                                                 |
| `RPC_ALLOWED_ORIGINS`    | R   | `https://explorer.sofia.intuition.box,https://sofia.intuition.box,chrome-extension://ldohfencfbbelhgfppgdmgmghodhjodb,chrome-extension://gabdhpllladhcaldpppokfmjafolkppl` | `https://staging-explorer.sofia.intuition.box,https://staging.sofia.intuition.box,chrome-extension://gabdhpllladhcaldpppokfmjafolkppl,http://localhost:5173,http://localhost:5174` |
| `INTUITION_RPC_UPSTREAM` | R   | unset (public RPC) until Intuition gives a dedicated endpoint                                                                                                              | same                                                                                                                                                                               |

### write-relayer (free Recommends — spends real TRUST)

| Variable                                                                                                          |     | Prod                                                                         | Staging                                                                            |
| ----------------------------------------------------------------------------------------------------------------- | --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                                                                    | R   | 🔒 Neon _sofia-reputation_, branch `main`, database `write_relayer` (direct) | branch `staging`, `write_relayer`                                                  |
| `PRIVY_APP_ID`                                                                                                    | R   | `cmmey7hlx01110clgylcc1ulc`                                                  | same                                                                               |
| `PRIVY_APP_SECRET`                                                                                                | R   | 🔒 Privy → sofia-dashboard → App secret (read-only scope)                    | same                                                                               |
| `RELAYER_PRIVATE_KEY`                                                                                             | R   | 🔒 treasury hot key — typed directly in Coolify, locked                      | a **separate** small staging key                                                   |
| `INTUITION_RPC_URL`                                                                                               | R   | `https://rpc.sofia.intuition.box/rpc`                                        | `https://staging-rpc.sofia.intuition.box/rpc`                                      |
| `RPC_PROXY_SERVER_KEY`                                                                                            | R   | 🔒 same as rpc-proxy's                                                       | same as staging rpc-proxy's                                                        |
| `REPUTATION_API_URL`                                                                                              | R   | `https://reputation-api.sofia.intuition.box`                                 | `https://staging-reputation-api.sofia.intuition.box`                               |
| `INTUITION_PIN_API_KEY`                                                                                           | R   | 🔒 same as pin-proxy's                                                       | same                                                                               |
| `CORS_ORIGINS`                                                                                                    | R   | `https://explorer.sofia.intuition.box,https://sofia.intuition.box`           | `https://staging-explorer.sofia.intuition.box,https://staging.sofia.intuition.box` |
| `SPONSOR_BUDGET_MONTHLY_TRUST` / `_DAILY_TRUST`                                                                   | R   | defaults `500` / `17`                                                        | `50` / `5`                                                                         |
| `SPONSOR_QUOTA_MONTHLY` / `_DAILY`, `SPONSOR_OPINIONS_DAILY`, `SPONSOR_CREDITS_PER_CALL`, `SPONSOR_DEPOSIT_TRUST` | R   | defaults (20 / 5, 5, 3, 0.01)                                                | same                                                                               |

Treasury to refill: see [services/write-relayer/README.md](services/write-relayer/README.md#treasury-refill-here).

### pin-proxy

| Variable                |     | Value                                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `INTUITION_PIN_API_KEY` | R   | 🔒 Intuition pin key                                                                                                                                                                                                                                                                                                                               |
| `PIN_ALLOWED_ORIGINS`   | R   | replaces the defaults — list every origin: `https://explorer.sofia.intuition.box,https://sofia.intuition.box,https://staging-explorer.sofia.intuition.box,https://staging.sofia.intuition.box,chrome-extension://ldohfencfbbelhgfppgdmgmghodhjodb,chrome-extension://gabdhpllladhcaldpppokfmjafolkppl,http://localhost:5173,http://localhost:5174` |

### group-api (paused)

`DATABASE_URL` 🔒, `PRIVY_APP_ID`, `PRIVY_APP_SECRET` 🔒, `CORS_ORIGINS`, `INTUITION_GRAPHQL_URL` — all runtime (uncheck _Available at Buildtime_ on the secrets).

### Extension (build, not Coolify)

`.env.production`: `PLASMO_PUBLIC_WRITE_RELAYER_URL=https://relayer.sofia.intuition.box`.
`.env.development` (test builds against staging): `PLASMO_PUBLIC_WRITE_RELAYER_URL=https://staging-relayer.sofia.intuition.box`, `PLASMO_PUBLIC_AUTH_URL=https://staging.sofia.intuition.box/auth`.

## Releasing

1. Merge into `dev` → staging rebuilds; test (smoke test in DEV_SETUP.md).
2. Merge `dev` into `main` → production rebuilds.
3. New migrations apply at boot (reputation-api, write-relayer).
