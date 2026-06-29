/**
 * Sofia pin proxy — Bun HTTP server (Hono).
 *
 * Endpoint: POST /pin   (GraphQL body: { query, variables })
 *
 * Intuition gated the `pinThing` mutation (and the other pin/upload ops)
 * behind an API key on a dedicated host: https://pin.intuition.systems.
 * The key must NEVER ship in a client bundle — the extension is published
 * on the Chrome Web Store and the explorer is a public SPA, both publicly
 * extractable. This proxy holds the key server-side (env var only) and
 * relays GraphQL pin requests to the upstream, injecting the `apikey`
 * header. Clients send their pin requests here with no credentials.
 *
 * The key is read from `process.env.INTUITION_PIN_API_KEY` and is never
 * logged, echoed, or written to disk.
 *
 * Security:
 *   - Origin allowlist (best-effort): only configured origins may call
 *     /pin. A non-browser client can spoof the Origin header, but the
 *     real win is that the upstream key can't be lifted from a bundle —
 *     blast radius stays contained to this proxy, which can be rate-
 *     limited / shut down independently.
 *   - The proxy forwards the body verbatim; the upstream only accepts pin
 *     operations, so it can't be used as a general GraphQL relay.
 *   - 10s timeout on the upstream fetch.
 *
 * CORS: open (`*`) for response headers — that only governs which origins
 * the browser lets read the response; it leaks nothing. The Origin
 * allowlist above is the actual access gate.
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const PORT = parseInt(process.env.PORT ?? '8790', 10)
const PIN_API_KEY = process.env.INTUITION_PIN_API_KEY ?? ''
const PIN_UPSTREAM =
  process.env.INTUITION_PIN_URL ?? 'https://pin.intuition.systems/v1/graphql'
const UPSTREAM_TIMEOUT_MS = 10_000

// Known Sofia client origins — the secure DEFAULT when PIN_ALLOWED_ORIGINS
// is unset, so the proxy never fails open. The env var (CSV) overrides this
// entirely when set. In PROD (Coolify), set PIN_ALLOWED_ORIGINS to include
// the PUBLISHED extension id — the chrome-extension entry below is the local
// dev/test extension, not the Web Store build.
const DEFAULT_ALLOWED_ORIGINS = [
  'chrome-extension://gabdhpllladhcaldpppokfmjafolkppl', // Sofia dev/test extension
  'https://explorer.intuition.systems',
  'https://sofia.intuition.box',
]

// Each entry is matched exactly, or — when it ends in `://*` — by scheme
// prefix (e.g. `chrome-extension://*` matches any extension id). `*` allows
// every origin.
const PIN_ALLOWED_ORIGINS = (() => {
  const env = (process.env.PIN_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  return env.length ? env : DEFAULT_ALLOWED_ORIGINS
})()

if (!PIN_API_KEY) {
  console.warn(
    '[pin-proxy] INTUITION_PIN_API_KEY is unset — /pin will return 503 until it is configured.',
  )
}

function originAllowed(origin: string): boolean {
  return PIN_ALLOWED_ORIGINS.some((allowed) => {
    if (allowed === '*') return true
    if (allowed.endsWith('://*')) return origin.startsWith(allowed.slice(0, -1))
    return origin === allowed
  })
}

const app = new Hono()

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    allowHeaders: ['content-type'],
  }),
)

app.get('/health', (c) => c.json({ ok: true }))

app.post('/pin', async (c) => {
  if (!PIN_API_KEY) {
    return c.json(
      { error: 'Pin proxy not configured (missing INTUITION_PIN_API_KEY)' },
      503,
    )
  }

  const origin = c.req.header('origin') ?? ''
  if (!originAllowed(origin)) {
    return c.json({ error: 'Forbidden origin' }, 403)
  }

  let body: string
  try {
    body = await c.req.text()
  } catch {
    return c.json({ error: 'Invalid request body' }, 400)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)
  try {
    const res = await fetch(PIN_UPSTREAM, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: PIN_API_KEY,
      },
      body,
      signal: controller.signal,
    })
    const text = await res.text()
    return new Response(text, {
      status: res.status,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  } catch {
    return c.json({ error: 'Pin upstream unreachable' }, 502)
  } finally {
    clearTimeout(timer)
  }
})

// Fallback — anything else is a 404.
app.all('*', (c) => c.json({ error: 'Not found' }, 404))

console.log(`Pin proxy listening on http://0.0.0.0:${PORT}`)

export default {
  port: PORT,
  hostname: '0.0.0.0',
  fetch: app.fetch,
}
