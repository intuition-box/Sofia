/**
 * Sofia OG proxy — Cloudflare Worker.
 *
 * Endpoint: GET /og?url=<encoded-url>
 * Response: JSON { image, title, width?, height? } | { error: string }
 *
 * Universal preview resolver for any URL with OpenGraph meta tags.
 * The explorer calls this when its built-in providers (YouTube,
 * GitHub, Spotify/Vimeo/SoundCloud oEmbed) can't resolve a URL — so a
 * Medium article, dev.to post, X/Twitter card, blog post, etc. all
 * surface a real thumbnail instead of falling back to a favicon.
 *
 * Caching strategy:
 *   - Workers `caches.default.match` keyed on the full request URL
 *   - 7-day edge TTL via `Cache-Control: public, max-age=604800,
 *     stale-while-revalidate=86400`
 *   - Failures cached briefly (5min) to avoid hammering broken targets
 *
 * Safety:
 *   - Allowlist: only http(s) URLs (no file://, data:, javascript:)
 *   - SSRF guard: blocks private IP ranges and localhost
 *   - Body cap: bails out if the upstream HTML exceeds 2 MB
 *   - Content-Type guard: bails out if upstream isn't HTML
 *   - Timeout: 8s upstream fetch
 *
 * CORS: open (`*`) — the worker only serves public OG data, no secrets.
 */

interface Env {
  // No bindings required for the v1 worker. Future: optional KV cache
  // for hot-path warm-up, or a private allowlist for cost control.
}

const HEADERS_JSON = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'accept, content-type',
}

const SUCCESS_CACHE = 'public, max-age=604800, stale-while-revalidate=86400'
const FAILURE_CACHE = 'public, max-age=300'

export default {
  async fetch(req: Request, _env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: HEADERS_JSON })
    }
    if (req.method !== 'GET') {
      return json({ error: 'Method not allowed' }, 405)
    }

    const { pathname, searchParams } = new URL(req.url)
    if (pathname !== '/og' && pathname !== '/og/') {
      return json({ error: 'Not found' }, 404)
    }

    const target = searchParams.get('url')
    if (!target) return json({ error: 'Missing `url` query param' }, 400)

    const validation = validateTarget(target)
    if (!validation.ok) return json({ error: validation.reason }, 400)

    // Edge cache lookup — keyed by the full worker URL (including the
    // encoded target), so identical requests deduplicate across the
    // whole worker fleet.
    const cache = caches.default
    const cacheKey = new Request(req.url, req)
    const cached = await cache.match(cacheKey)
    if (cached) return cached

    const fresh = await resolveOg(validation.url)
    // Write-through caching — both success and short-lived failure are
    // cached at the edge. ctx.waitUntil keeps the worker alive until
    // the cache write completes.
    ctx.waitUntil(cache.put(cacheKey, fresh.clone()))
    return fresh
  },
}

interface ValidTarget {
  ok: true
  url: URL
}

interface InvalidTarget {
  ok: false
  reason: string
}

/** Sanity-checks a user-supplied URL before we go fetch it. Bails on
 *  non-http(s) schemes, IP literals, localhost and the private RFC1918
 *  ranges to avoid turning the worker into an SSRF relay. */
function validateTarget(raw: string): ValidTarget | InvalidTarget {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { ok: false, reason: 'Invalid URL' }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'Only http(s) URLs supported' }
  }
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host === '0.0.0.0' || host === '::1') {
    return { ok: false, reason: 'Forbidden host' }
  }
  // Crude IPv4 private-range guard. A worker can't resolve DNS itself
  // to chase rebinding, but we at least block literal private IPs.
  const v4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (v4) {
    const [a, b] = [parseInt(v4[1], 10), parseInt(v4[2], 10)]
    if (a === 10) return { ok: false, reason: 'Forbidden host' }
    if (a === 127) return { ok: false, reason: 'Forbidden host' }
    if (a === 192 && b === 168) return { ok: false, reason: 'Forbidden host' }
    if (a === 172 && b >= 16 && b <= 31) return { ok: false, reason: 'Forbidden host' }
    if (a === 169 && b === 254) return { ok: false, reason: 'Forbidden host' }
  }
  return { ok: true, url }
}

interface OgPayload {
  image?: string
  title?: string
  width?: number
  height?: number
}

/** Fetch the target URL, extract OG meta tags, return a Response with
 *  the parsed payload. Network and parsing errors collapse to a
 *  short-cached 404-style failure response. */
async function resolveOg(target: URL): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  let res: Response
  try {
    res = await fetch(target.toString(), {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // Many sites gate OG tags behind a "real browser" check. We
        // pose as a generic crawler so they cough up the meta block.
        'user-agent':
          'Mozilla/5.0 (compatible; SofiaBot/1.0; +https://sofia.xyz)',
        accept: 'text/html,application/xhtml+xml',
      },
    })
  } catch {
    clearTimeout(timer)
    return jsonCached({ error: 'Fetch failed' }, 502, FAILURE_CACHE)
  }
  clearTimeout(timer)
  if (!res.ok) {
    return jsonCached({ error: `Upstream ${res.status}` }, 502, FAILURE_CACHE)
  }
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('html')) {
    return jsonCached({ error: 'Not an HTML page' }, 415, FAILURE_CACHE)
  }

  // Stream the body and bail out if it exceeds 2 MB — we only need
  // the `<head>` section so a hard cap protects the worker budget.
  const reader = res.body?.getReader()
  if (!reader) {
    return jsonCached({ error: 'Empty body' }, 502, FAILURE_CACHE)
  }
  const MAX_BYTES = 2 * 1024 * 1024
  const decoder = new TextDecoder('utf-8')
  let html = ''
  let read = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    read += value.byteLength
    if (read > MAX_BYTES) {
      await reader.cancel()
      break
    }
    html += decoder.decode(value, { stream: true })
    // The <head> typically lands in the first 64 KB. Bail as soon as
    // we see </head> to avoid streaming the whole page.
    if (html.includes('</head>')) break
  }
  html += decoder.decode()

  const payload = parseOg(html, target)
  if (!payload.image) {
    return jsonCached({ error: 'No og:image found' }, 404, FAILURE_CACHE)
  }
  return jsonCached(payload, 200, SUCCESS_CACHE)
}

/** Resolve a relative or protocol-relative URL against the target so
 *  consumers get a fully-qualified image URL they can drop into an
 *  `<img src>` directly. */
function absolutize(image: string, base: URL): string {
  try {
    return new URL(image, base).toString()
  } catch {
    return image
  }
}

/** Tiny tag-soup parser. Scans `<head>` for the OG meta block — full
 *  XML parsing would be overkill here and CF Workers don't ship one
 *  by default. Order matches the OG spec: explicit og:* wins, then
 *  twitter:image, then a bare <link rel="image_src">. */
function parseOg(html: string, base: URL): OgPayload {
  const head = sliceHead(html)
  const out: OgPayload = {}

  const getMeta = (...patterns: RegExp[]): string | undefined => {
    for (const re of patterns) {
      const m = head.match(re)
      if (m && m[1]) return decodeHtml(m[1].trim())
    }
    return undefined
  }

  const image =
    getMeta(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
      /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
    )
  if (image) out.image = absolutize(image, base)

  const title = getMeta(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    /<title[^>]*>([^<]+)<\/title>/i,
  )
  if (title) out.title = title

  const width = getMeta(
    /<meta[^>]+property=["']og:image:width["'][^>]+content=["']([^"']+)["']/i,
  )
  if (width) {
    const n = parseInt(width, 10)
    if (Number.isFinite(n)) out.width = n
  }

  const height = getMeta(
    /<meta[^>]+property=["']og:image:height["'][^>]+content=["']([^"']+)["']/i,
  )
  if (height) {
    const n = parseInt(height, 10)
    if (Number.isFinite(n)) out.height = n
  }

  return out
}

function sliceHead(html: string): string {
  const end = html.indexOf('</head>')
  return end === -1 ? html.slice(0, 65536) : html.slice(0, end)
}

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
}

function decodeHtml(s: string): string {
  return s.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, (m) => HTML_ENTITIES[m] ?? m)
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: HEADERS_JSON })
}

function jsonCached(body: unknown, status: number, cacheControl: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...HEADERS_JSON, 'cache-control': cacheControl },
  })
}
