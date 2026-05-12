# Sofia OG proxy worker

Tiny Cloudflare Worker that resolves OpenGraph previews server-side so
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
  "height": 630
}
```

Or `{ "error": "..." }` with a 4xx/5xx status. Failures are cached for
5 minutes; successes for 7 days at the edge.

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

## Deploy

Requires a Cloudflare account with Workers enabled.

```bash
bun install
wrangler login       # one-time
bun run deploy
```

Once deployed, you get a `https://sofia-og.<your-account>.workers.dev`
URL. Set `VITE_OG_PROXY_URL` to that value in the explorer env and
rebuild.

### Custom domain (recommended)

Edit `wrangler.toml` to uncomment the `[[routes]]` block and point it
at e.g. `og.sofia.xyz` (DNS managed by Cloudflare). After redeploying
the explorer can hard-code `VITE_OG_PROXY_URL=https://og.sofia.xyz`.

## Safety notes

The worker validates every target URL before fetching:
- only `http://` and `https://` schemes
- blocks `localhost`, `0.0.0.0`, `::1`, and RFC1918 private ranges
- caps upstream body at 2 MB, bails as soon as `</head>` is reached
- 8s timeout on the upstream fetch
- HTML content-type required

Open CORS (`*`) since the response carries only public OG metadata.

## Cost

Free tier: 100k requests/day. With 7-day edge caching that's enough
for ~3-4M unique URL hits/month before the first paid request.
