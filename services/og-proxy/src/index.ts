/**
 * Sofia OG proxy — Bun HTTP server (Hono).
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
 *   - L1: in-memory LRU keyed on the target URL (7d TTL for success,
 *         5min for failure) — survives only the container lifetime
 *   - L2: Cache-Control headers honoured by the Coolify reverse proxy
 *         (Caddy / Traefik) — survives container restarts
 *   - In-flight dedup: simultaneous requests for the same URL collapse
 *     into a single upstream fetch
 *
 * Safety:
 *   - Allowlist: only http(s) URLs (no file://, data:, javascript:)
 *   - SSRF guard: blocks private IP ranges and localhost
 *   - Body cap: bails out if the upstream HTML exceeds 2 MB
 *   - Content-Type guard: bails out if upstream isn't HTML
 *   - Timeout: 8s upstream fetch
 *
 * CORS: open (`*`) — the proxy only serves public OG data, no secrets.
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const PORT = parseInt(process.env.PORT ?? '8787', 10)
const SUCCESS_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const FAILURE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const CACHE_MAX_ENTRIES = 5000
const UPSTREAM_TIMEOUT_MS = 8000
const MAX_HTML_BYTES = 2 * 1024 * 1024

const SUCCESS_CACHE_HEADER =
  'public, max-age=604800, stale-while-revalidate=86400'
const FAILURE_CACHE_HEADER = 'public, max-age=300'

// ── L1 cache + in-flight dedup ───────────────────────────────────────

interface CacheEntry {
  body: string
  status: number
  cacheControl: string
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<CacheEntry>>()

function cacheGet(key: string): CacheEntry | null {
  const hit = cache.get(key)
  if (!hit) return null
  if (hit.expiresAt < Date.now()) {
    cache.delete(key)
    return null
  }
  // LRU touch — re-inserting moves the entry to the end of the Map's
  // insertion order, which is what we evict from when over capacity.
  cache.delete(key)
  cache.set(key, hit)
  return hit
}

function cacheSet(key: string, entry: CacheEntry): void {
  cache.set(key, entry)
  // Evict the oldest entries until we're back under the cap.
  while (cache.size > CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) break
    cache.delete(oldest)
  }
}

// ── App ──────────────────────────────────────────────────────────────

const app = new Hono()

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['accept', 'content-type'],
  }),
)

app.get('/health', (c) => c.json({ ok: true, cached: cache.size }))

app.get('/og', async (c) => {
  const target = c.req.query('url')
  if (!target) return c.json({ error: 'Missing `url` query param' }, 400)

  const validation = validateTarget(target)
  if (!validation.ok) return c.json({ error: validation.reason }, 400)
  const key = validation.url.toString()
  const origin = proxyOrigin(c)

  const cached = cacheGet(key)
  if (cached) {
    return new Response(cached.body, {
      status: cached.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': cached.cacheControl,
      },
    })
  }

  // Dedup concurrent requests for the same URL — first one fetches,
  // the rest await the resolved promise.
  let pending = inflight.get(key)
  if (!pending) {
    pending = resolveOg(validation.url, origin).finally(() =>
      inflight.delete(key),
    )
    inflight.set(key, pending)
  }
  const entry = await pending
  cacheSet(key, entry)
  return new Response(entry.body, {
    status: entry.status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': entry.cacheControl,
    },
  })
})

/** Server-side SVG preview generator — last-resort fallback when the
 *  upstream page exposes no OG/Twitter image. Renders a 1200×630 card
 *  with a domain-deterministic gradient + page title + hostname, so
 *  every URL in the explorer always lands on a real preview image.
 *
 *  SVG (not PNG) for zero deps and infinite-scale crispness. Cached
 *  hard at the edge — same domain + title pair always renders the same
 *  bytes, so the reverse proxy can hold these forever. */
app.get('/render', (c) => {
  const domain = (c.req.query('domain') ?? '').slice(0, 120)
  const title = (c.req.query('title') ?? domain).slice(0, 200)
  const svg = generateCardSvg({ domain, title })
  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=2592000, immutable',
    },
  })
})

// Fallback — anything else is a 404.
app.all('*', (c) => c.json({ error: 'Not found' }, 404))

// ── Validation ───────────────────────────────────────────────────────

interface ValidTarget {
  ok: true
  url: URL
}
interface InvalidTarget {
  ok: false
  reason: string
}

/** Sanity-checks a user-supplied URL before fetching it. Bails on
 *  non-http(s) schemes, IP literals, localhost and the private RFC1918
 *  ranges so the proxy can't be used as an SSRF relay. */
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
  const v4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (v4) {
    const [a, b] = [parseInt(v4[1], 10), parseInt(v4[2], 10)]
    if (a === 10) return { ok: false, reason: 'Forbidden host' }
    if (a === 127) return { ok: false, reason: 'Forbidden host' }
    if (a === 192 && b === 168)
      return { ok: false, reason: 'Forbidden host' }
    if (a === 172 && b >= 16 && b <= 31)
      return { ok: false, reason: 'Forbidden host' }
    if (a === 169 && b === 254)
      return { ok: false, reason: 'Forbidden host' }
  }
  return { ok: true, url }
}

// ── OG resolution ────────────────────────────────────────────────────

interface OgPayload {
  image?: string
  title?: string
  width?: number
  height?: number
}

async function resolveOg(target: URL, proxyOriginUrl: string): Promise<CacheEntry> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(target.toString(), {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // Mimic a real Chrome session — many sites (YouTube channels,
        // X/Twitter, news outlets, Cloudflare-protected sites) gate OG
        // tags behind a fingerprint check. A generic `SofiaBot` UA
        // gets thrown into a consent wall / bot challenge. A full
        // browser-shaped header set sails through far more of them.
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/131.0.0.0 Safari/537.36',
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,' +
          'image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
        'cache-control': 'no-cache',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
      },
    })
  } catch {
    clearTimeout(timer)
    return failureEntry({ error: 'Fetch failed' }, 502)
  }
  clearTimeout(timer)
  if (!res.ok) {
    return failureEntry({ error: `Upstream ${res.status}` }, 502)
  }
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('html')) {
    return failureEntry({ error: 'Not an HTML page' }, 415)
  }

  // Stream the body and bail out if it exceeds the cap — we only need
  // the `<head>` so this protects against giant pages.
  const reader = res.body?.getReader()
  if (!reader) return failureEntry({ error: 'Empty body' }, 502)
  const decoder = new TextDecoder('utf-8')
  let html = ''
  let read = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    read += value.byteLength
    if (read > MAX_HTML_BYTES) {
      await reader.cancel()
      break
    }
    html += decoder.decode(value, { stream: true })
    if (html.includes('</head>')) break
  }
  html += decoder.decode()

  const payload = parseOg(html, target)
  // Fallback to a server-generated preview when the page exposes no
  // OG / Twitter image. Keeps the explorer's grid uniform: every card
  // gets a real image, even for SPA shells or sites that skip social
  // meta tags entirely. Reuses the page's `<title>` when present so
  // the generated card stays informative.
  if (!payload.image) {
    const params = new URLSearchParams({
      domain: target.hostname,
      title: payload.title ?? target.hostname,
    })
    payload.image = `${proxyOriginUrl}/render?${params.toString()}`
    payload.width = 1200
    payload.height = 630
  }
  return successEntry(payload)
}

function successEntry(payload: OgPayload): CacheEntry {
  return {
    body: JSON.stringify(payload),
    status: 200,
    cacheControl: SUCCESS_CACHE_HEADER,
    expiresAt: Date.now() + SUCCESS_TTL_MS,
  }
}

function failureEntry(body: unknown, status: number): CacheEntry {
  return {
    body: JSON.stringify(body),
    status,
    cacheControl: FAILURE_CACHE_HEADER,
    expiresAt: Date.now() + FAILURE_TTL_MS,
  }
}

// ── OG parser ────────────────────────────────────────────────────────

function absolutize(image: string, base: URL): string {
  try {
    return new URL(image, base).toString()
  } catch {
    return image
  }
}

/** Tag-soup parser. Scans `<head>` for the OG meta block — full XML
 *  parsing would be overkill. Order matches the OG spec: explicit
 *  og:* wins, then twitter:image, then a bare <link rel="image_src">. */
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

  const image = getMeta(
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
  return s.replace(
    /&(?:amp|lt|gt|quot|#39|#x27);/g,
    (m) => HTML_ENTITIES[m] ?? m,
  )
}

// ── Generated fallback card ──────────────────────────────────────────

/** Best-effort guess at the proxy's externally-facing URL, derived
 *  from the Host + X-Forwarded-Proto headers. Used to build absolute
 *  /render URLs so the client (any origin) can dereference them. */
function proxyOrigin(c: {
  req: { header: (name: string) => string | undefined }
}): string {
  const host = c.req.header('host') ?? `localhost:${PORT}`
  const proto =
    c.req.header('x-forwarded-proto') ??
    (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https')
  return `${proto}://${host}`
}

/** Deterministic HSL pair from a domain string — same input always
 *  yields the same gradient. Two slightly-shifted hues make a clean
 *  diagonal gradient that reads well behind white text. */
function domainGradient(domain: string): [string, string] {
  let h = 2166136261 // FNV-1a basis
  for (let i = 0; i < domain.length; i++) {
    h ^= domain.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const hue = Math.abs(h) % 360
  return [`hsl(${hue} 70% 48%)`, `hsl(${(hue + 35) % 360} 70% 32%)`]
}

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}
function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => XML_ESCAPES[c] ?? c)
}

/** Wrap text into N lines of <= `maxChars`, truncating the overflow
 *  with an ellipsis on the last line. Word-aware — never breaks a
 *  word mid-character. */
function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w
    if (candidate.length <= maxChars) {
      current = candidate
      continue
    }
    if (current) {
      lines.push(current)
      if (lines.length === maxLines) {
        current = ''
        break
      }
    }
    // Single word longer than the line — hard-break.
    if (w.length > maxChars) {
      lines.push(w.slice(0, maxChars - 1) + '…')
      if (lines.length === maxLines) {
        current = ''
        break
      }
      current = ''
    } else {
      current = w
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    const last = lines[maxLines - 1]
    lines[maxLines - 1] =
      last.length > maxChars - 1 ? last.slice(0, maxChars - 1) + '…' : last + '…'
  }
  return lines
}

/** Render a 1200×630 SVG card. Title in big white type, hostname in
 *  smaller monospace below, diagonal gradient backdrop. */
function generateCardSvg(opts: { domain: string; title: string }): string {
  const titleLines = wrapText(opts.title, 28, 3).map(escapeXml)
  const safeDomain = escapeXml(opts.domain)
  const [c1, c2] = domainGradient(opts.domain)

  const TITLE_BASE_Y = 280
  const LINE_HEIGHT = 78
  const titleSpans = titleLines
    .map(
      (line, i) =>
        `<text x="80" y="${TITLE_BASE_Y + i * LINE_HEIGHT}" font-family="system-ui, -apple-system, 'Segoe UI', Helvetica, sans-serif" font-size="64" font-weight="800" fill="#fff">${line}</text>`,
    )
    .join('\n  ')

  const domainY = TITLE_BASE_Y + titleLines.length * LINE_HEIGHT + 24

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="rgba(0,0,0,0.18)" />
  ${titleSpans}
  <text x="80" y="${domainY}" font-family="ui-monospace, 'JetBrains Mono', 'SF Mono', monospace" font-size="30" fill="rgba(255,255,255,0.78)" letter-spacing="0.02em">${safeDomain}</text>
</svg>`
}

// ── Server boot ──────────────────────────────────────────────────────

console.log(`OG proxy listening on http://0.0.0.0:${PORT}`)

export default {
  port: PORT,
  hostname: '0.0.0.0',
  fetch: app.fetch,
}
