# Sofia pin proxy

Bun + Hono HTTP service that relays Intuition pin requests (`pinThing` &
friends) to the authenticated upstream `https://pin.intuition.systems`,
injecting the `apikey` header **server-side**.

## Why

Intuition closed anonymous access to the `pinThing` GraphQL mutation: the
network read endpoint (`mainnet.intuition.sh` / `testnet.intuition.sh`) no
longer accepts mutations. Pinning now requires an API key on a dedicated
host. That key must never ship in a client bundle (the extension is on the
Chrome Web Store, the explorer is a public SPA — both are extractable), and
in our case it is **not revocable**, so an exposure would be permanent.

This proxy keeps the key in a server-side env var. The extension and
explorer point their GraphQL client's `pinApiUrl` at `<this-host>/pin` and
send pin requests with no credentials; the proxy adds the key.

## Endpoint

```
POST /pin        body: { "query": "...", "variables": {...} }  (GraphQL)
GET  /health  -> { "ok": true }
```

Relays the body verbatim to the upstream and returns its JSON response.

## Local dev

```bash
cd services/pin-proxy
bun install
INTUITION_PIN_API_KEY=<key> bun run dev     # http://localhost:8790/pin
```

```bash
curl -s http://localhost:8790/pin -H "Content-Type: application/json" \
  -d '{"query":"mutation($n:String!){pinThing(thing:{name:$n,description:\"x\",image:\"https://provider.example/logo.svg\",url:\"https://provider.example\"}){uri}}","variables":{"n":"Test"}}'
# -> {"data":{"pinThing":{"uri":"ipfs://bafkrei…"}}}
```

Then point the clients at it:

```bash
# apps/extension/.env.development
PLASMO_PUBLIC_PIN_PROXY_URL=http://localhost:8790/pin
# apps/explorer/.env
export VITE_PIN_PROXY_URL=http://localhost:8790/pin
```

## Deploy on Coolify

1. **Add a new resource** → "Application" → "Dockerfile"
2. **Build context** : `services/pin-proxy`
3. **Dockerfile** : `Dockerfile` (default)
4. **Port** : `8790`
5. **Healthcheck path** : `/health`
6. **Domain** : assign a hostname (e.g. `pin.sofia.intuition.box`). TLS via
   Let's Encrypt.
7. **Environment variables** (runtime — NOT build-time, the key is a secret):
   - `INTUITION_PIN_API_KEY` — the Intuition API key (required).
   - `PIN_ALLOWED_ORIGINS` — CSV of allowed origins; overrides the built-in
     default (which contains the **dev/test** extension id + explorer/sofia
     domains). In prod, set this to the **published** extension id, e.g.
     `chrome-extension://<PUBLISHED_ID>,https://explorer.intuition.systems,https://sofia.intuition.box`
   - `INTUITION_PIN_URL` — optional, defaults to the upstream.
8. **Deploy**, then set `PLASMO_PUBLIC_PIN_PROXY_URL` / `VITE_PIN_PROXY_URL`
   to `https://<host>/pin` and rebuild the clients.

## Env vars

| Name                    | Default                                    | Purpose                                                          |
| ----------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| `INTUITION_PIN_API_KEY` | _(unset → 503)_                            | Intuition API key, sent as `apikey` header                       |
| `PIN_ALLOWED_ORIGINS`   | _(dev/test ext + explorer/sofia domains)_  | CSV allowlist; overrides default; `scheme://*` and `*` supported |
| `INTUITION_PIN_URL`     | `https://pin.intuition.systems/v1/graphql` | Upstream pin endpoint                                            |
| `PORT`                  | `8790`                                     | HTTP port                                                        |

## Security notes

- The key lives only in `process.env`, server-side. Never logged or bundled.
- `PIN_ALLOWED_ORIGINS` is a best-effort gate (Origin headers are spoofable
  by non-browser clients); the durable protection is that the key can't be
  extracted from a client bundle. Set it anyway to deter casual abuse.
- The proxy forwards bodies verbatim; the upstream only accepts pin ops, so
  it can't be turned into a general GraphQL relay.
- Stateless — rolling redeploys are safe.
