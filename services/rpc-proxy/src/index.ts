/**
 * Sofia RPC proxy — Bun HTTP server (Hono).
 *
 * Endpoint: POST /rpc   (JSON-RPC 2.0, single request or batch)
 *
 * The public Intuition RPC throttles per IP ("Bandwidth limit exceeded").
 * A dedicated endpoint comes with an API key, and a key must NEVER ship in a
 * client bundle (the extension is on the Chrome Web Store, the explorer is a
 * public SPA). This proxy holds the upstream URL / key server-side and relays
 * JSON-RPC to it. Until Intuition hands out a dedicated endpoint it points at
 * the public RPC: the switch is one env var.
 *
 * On the way it:
 *   - only relays the methods Sofia uses (no debug_ / admin_ / personal_);
 *   - serves identical reads from a seconds-long cache and merges identical
 *     reads in flight — a page mounting twenty hooks costs one upstream call;
 *   - caps the calls in flight upstream (bursts queue instead of tripping the
 *     upstream's throttle) and retries a throttled answer with backoff;
 *   - rate-limits each client IP.
 *
 * Access: browser origins on the allowlist (RPC_ALLOWED_ORIGINS, CSV —
 * replaces the defaults when set), or server-side callers sending
 * `x-rpc-proxy-key: $RPC_PROXY_SERVER_KEY` (relayer, reputation-api). The
 * Origin header can be spoofed by a non-browser client; the real protection
 * is that the upstream key can't be lifted from a bundle, and this proxy can
 * be rate-limited or shut down on its own.
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  cacheKey,
  cacheTtlMs,
  forbiddenMethod,
  isCacheableResult,
  isRpcRequest,
  isUpstreamThrottle,
  RateLimiter,
  ResponseCache,
  Semaphore,
  withId,
  type RpcRequest,
} from './rpc'

const PORT = parseInt(process.env.PORT ?? '8791', 10)
const UPSTREAM =
  process.env.INTUITION_RPC_UPSTREAM ?? 'https://rpc.intuition.systems'
/** Optional: some providers take the key as a header instead of in the URL */
const UPSTREAM_KEY = process.env.INTUITION_RPC_API_KEY ?? ''
const UPSTREAM_KEY_HEADER =
  process.env.INTUITION_RPC_API_KEY_HEADER ?? 'x-api-key'
const SERVER_KEY = process.env.RPC_PROXY_SERVER_KEY ?? ''
const RATE_PER_MINUTE = parseInt(process.env.RPC_RATE_PER_MINUTE ?? '600', 10)
const MAX_INFLIGHT = parseInt(process.env.RPC_MAX_INFLIGHT ?? '4', 10)
const UPSTREAM_TIMEOUT_MS = 15_000
const MAX_BODY_BYTES = 512 * 1024
const MAX_BATCH = 100
/** Backoff before each retry of a throttled upstream answer */
const THROTTLE_BACKOFF_MS = [1_000, 3_000]

// Same defaults as the pin-proxy, plus the explorer's prod origin. In PROD
// (Coolify) set RPC_ALLOWED_ORIGINS with the PUBLISHED extension id.
const DEFAULT_ALLOWED_ORIGINS = [
  'chrome-extension://gabdhpllladhcaldpppokfmjafolkppl', // Sofia dev/test extension
  'https://explorer.sofia.intuition.box',
  'https://explorer.intuition.systems',
  'https://sofia.intuition.box',
  'http://localhost:5173',
  'http://localhost:5174',
]

// Exact match, `scheme://*` prefix match, or `*` for every origin.
const ALLOWED_ORIGINS = (() => {
  const env = (process.env.RPC_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  return env.length ? env : DEFAULT_ALLOWED_ORIGINS
})()

function originAllowed(origin: string): boolean {
  return ALLOWED_ORIGINS.some((allowed) => {
    if (allowed === '*') return true
    if (allowed.endsWith('://*')) return origin.startsWith(allowed.slice(0, -1))
    return origin === allowed
  })
}

const limiter = new RateLimiter(RATE_PER_MINUTE, 60_000)
const upstreamSlots = new Semaphore(MAX_INFLIGHT)
const cache = new ResponseCache()
setInterval(() => limiter.sweep(), 60_000)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** One upstream round trip, retried with backoff while throttled */
async function forward(
  body: string,
): Promise<{ status: number; body: string }> {
  for (let attempt = 0; ; attempt++) {
    const res = await upstreamSlots.run(async () => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)
      try {
        const r = await fetch(UPSTREAM, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(UPSTREAM_KEY ? { [UPSTREAM_KEY_HEADER]: UPSTREAM_KEY } : {}),
          },
          body,
          signal: controller.signal,
        })
        return { status: r.status, body: await r.text() }
      } finally {
        clearTimeout(timer)
      }
    })
    const backoff = THROTTLE_BACKOFF_MS[attempt]
    if (backoff === undefined || !isUpstreamThrottle(res.status, res.body))
      return res
    await sleep(backoff)
  }
}

/** A single request: from cache, merged with an identical one in flight, or
 *  forwarded */
async function handleSingle(req: RpcRequest): Promise<string> {
  const ttl = cacheTtlMs(req)
  if (ttl === 0) return (await forward(JSON.stringify(req))).body
  const key = cacheKey(req)
  const hit = cache.get(key)
  if (hit) return withId(hit, req.id)
  const body = await cache.dedupe(key, async () => {
    const res = await forward(JSON.stringify({ ...req, id: 1 }))
    if (isCacheableResult(res.body)) cache.set(key, res.body, ttl)
    return res.body
  })
  return withId(body, req.id)
}

const json = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

const rpcError = (id: RpcRequest['id'], code: number, message: string) =>
  JSON.stringify({ jsonrpc: '2.0', id: id ?? null, error: { code, message } })

const app = new Hono()

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    allowHeaders: ['content-type', 'x-rpc-proxy-key'],
  }),
)

app.get('/health', (c) => c.json({ ok: true }))

app.post('/rpc', async (c) => {
  const isServer =
    !!SERVER_KEY && c.req.header('x-rpc-proxy-key') === SERVER_KEY
  const origin = c.req.header('origin') ?? ''
  if (!isServer && !originAllowed(origin)) {
    return c.json({ error: 'Forbidden origin' }, 403)
  }

  const raw = await c.req.text().catch(() => '')
  if (!raw || raw.length > MAX_BODY_BYTES) {
    return json(rpcError(null, -32600, 'Invalid request'), 400)
  }
  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    return json(rpcError(null, -32700, 'Parse error'), 400)
  }

  const batch = Array.isArray(payload)
  const items: unknown[] = Array.isArray(payload) ? payload : [payload]
  if (
    items.length === 0 ||
    items.length > MAX_BATCH ||
    !items.every(isRpcRequest)
  ) {
    return json(rpcError(null, -32600, 'Invalid request'), 400)
  }
  const requests = items as RpcRequest[]
  const refused = forbiddenMethod(requests)
  if (refused) {
    return json(rpcError(null, -32601, `Method not allowed: ${refused}`), 403)
  }

  if (!isServer) {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'unknown'
    if (!limiter.take(ip, requests.length)) {
      return json(rpcError(null, -32005, 'Rate limit exceeded'), 429)
    }
  }

  try {
    if (!batch) return json(await handleSingle(requests[0]))
    // Batches go upstream as they are: viem only batches when asked to
    const res = await forward(raw)
    return json(res.body, res.status)
  } catch {
    return json(rpcError(null, -32603, 'RPC upstream unreachable'), 502)
  }
})

app.all('*', (c) => c.json({ error: 'Not found' }, 404))

console.log(
  `RPC proxy listening on http://0.0.0.0:${PORT} → ${new URL(UPSTREAM).host}`,
)

export default {
  port: PORT,
  hostname: '0.0.0.0',
  fetch: app.fetch,
}
