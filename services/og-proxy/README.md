# Sofia OG proxy

Bun + Hono HTTP service that resolves OpenGraph previews server-side so
the explorer can render thumbnails for any URL with `<meta og:image>`
tags. Drops the favicon fallback for ~95% of the web.

## Endpoint

```
GET /og?url=<encoded-url>
```

Returns:

```jsonc
{
  "image": "https://example.com/og.png",
  "title": "Article title",
  "width": 1200,
  "height": 630,
}
```

Or `{ "error": "..." }` with a 4xx/5xx status. Failures cached for
5 minutes; successes for 7 days (both in-memory L1 LRU and via
`Cache-Control` headers honoured by the Coolify reverse proxy).

Also exposes `GET /health` returning `{ ok: true, cached: <n> }` for
the container healthcheck.

## Local dev

```bash
cd services/og-proxy
bun install
bun run dev          # http://localhost:8787/og?url=...
```

Then point the explorer at it:

```bash
# apps/explorer/.env
export VITE_OG_PROXY_URL=http://localhost:8787
```

## Deploy on Coolify

1. **Add a new resource** → "Application" → "Dockerfile"
2. **Repository** : point at this monorepo, branch `main`
3. **Build context** : `services/og-proxy`
4. **Dockerfile** : `Dockerfile` (default)
5. **Port** : `8787`
6. **Healthcheck path** : `/health` (already wired in the Dockerfile)
7. **Domain** : assign a hostname (e.g. `og.sofia.xyz`). Coolify
   provisions TLS automatically via Let's Encrypt.
8. **Deploy**.

Coolify's reverse proxy (Caddy/Traefik) sits in front and respects the
`Cache-Control` headers the service emits — successful previews are
cached for 7 days at the proxy layer, so 99% of requests after the
initial warm-up never hit the Bun process.

Once live, set the explorer env:

```bash
# apps/explorer/.env
export VITE_OG_PROXY_URL=https://og.sofia.xyz
```

Rebuild the explorer. Done.

## Env vars

| Name   | Default | Purpose                       |
| ------ | ------- | ----------------------------- |
| `PORT` | `8787`  | HTTP port the server binds to |

The defaults are fine for Coolify — only override if you have a
collision.

## Safety notes

The service validates every target URL before fetching:

- only `http://` and `https://` schemes
- blocks `localhost`, `0.0.0.0`, `::1`, and RFC1918 private ranges
- caps upstream body at 2 MB, bails as soon as `</head>` is reached
- 8s timeout on the upstream fetch
- HTML content-type required

Open CORS (`*`) since the response carries only public OG metadata.

## Resource sizing

The service is stateless and almost entirely I/O-bound. A `128 MB` /
`0.1 CPU` allocation comfortably handles thousands of req/min once the
LRU is warm. The in-memory cache caps at 5000 entries (~10 MB).

## Operating notes

- **Cache warm-up**: cold container has an empty L1. First few requests
  hit the upstream. The reverse-proxy L2 cache (Caddy/Traefik) persists
  across container restarts, so this only really matters on the very
  first deploy.
- **Logs**: every request logs nothing by default — add `console.log`
  in `app.get('/og', …)` if you want hit/miss visibility.
- **Restart**: stateless, so a rolling redeploy works fine.
