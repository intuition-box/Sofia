# Sofia RPC proxy

> **Where it sits:** [handbook/operations/environments.md](../../handbook/operations/environments.md). Deployment variables: [deployment.md](../../handbook/operations/deployment.md#rpc-proxy).

Bun + Hono service that relays JSON-RPC to the Intuition RPC, holding the
upstream URL / API key **server-side**.

## Why

The public RPC (`rpc.intuition.systems`) throttles per IP (`-31002 Bandwidth
limit exceeded`). A dedicated endpoint comes with a key, and a key must never
ship in the extension (Chrome Web Store) or the explorer (public SPA). Clients
point at this proxy instead; switching to the dedicated endpoint is one env
var, no client release.

On the way it:

- relays only the methods Sofia uses (no `debug_` / `admin_` / `personal_`);
- serves identical reads from a seconds-long cache (`latest`: 2 s, fixed
  block: 5 min, `eth_chainId`: 1 h) and merges identical reads in flight;
- caps upstream calls in flight (`RPC_MAX_INFLIGHT`) and retries a throttled
  answer with backoff (1 s, 3 s);
- rate-limits each client IP (`RPC_RATE_PER_MINUTE`).

## Endpoint

```
POST /rpc     JSON-RPC 2.0 — single request or batch (≤ 100)
GET  /health  -> { "ok": true }
```

## Env

| Var                            | Default                         |                                                                                   |
| ------------------------------ | ------------------------------- | --------------------------------------------------------------------------------- |
| `PORT`                         | `8791`                          |                                                                                   |
| `INTUITION_RPC_UPSTREAM`       | `https://rpc.intuition.systems` | dedicated URL from Intuition (may embed the key)                                  |
| `INTUITION_RPC_API_KEY`        | —                               | key, when sent as a header                                                        |
| `INTUITION_RPC_API_KEY_HEADER` | `x-api-key`                     | header name for the key                                                           |
| `RPC_ALLOWED_ORIGINS`          | Sofia origins + localhost       | CSV, **replaces** the defaults — add the published extension id                   |
| `RPC_PROXY_SERVER_KEY`         | —                               | server-side callers send it as `x-rpc-proxy-key` (no origin check, no rate limit) |
| `RPC_RATE_PER_MINUTE`          | `600`                           | requests per IP per minute                                                        |
| `RPC_MAX_INFLIGHT`             | `4`                             | concurrent upstream calls                                                         |

## Clients

- Explorer: `VITE_INTUITION_RPC_URL=https://<host>/rpc` (Coolify **build-time** variable).
- Extension: `PLASMO_PUBLIC_INTUITION_RPC_URL=https://<host>/rpc` (public RPC kept as fallback).

Wallets keep the public RPC in their network settings: the chain definition
handed to them is unchanged.

## Local dev

```bash
cd services/rpc-proxy
bun install
bun run dev        # http://localhost:8791/rpc
bun test
```

## Coolify

Build context `services/rpc-proxy`, Dockerfile `Dockerfile`, port 8791,
health check `/health`.
