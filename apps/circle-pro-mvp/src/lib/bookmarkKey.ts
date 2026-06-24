/**
 * bookmarkKey — the stable join key between a bookmark and its off-chain data
 * (comments today). A normalised URL, so the key holds whether bookmarks end
 * up on-chain (atom term_id, mappable from this URL) or off-chain later.
 *
 * Conceptually aligned with the extension's `normalizeUrl`: force https, drop
 * `www.`, strip the hash + common tracking params, and trim a trailing slash —
 * so `https://www.example.com/post/?utm_source=x#section` and
 * `example.com/post` resolve to the same key.
 */
const TRACKING_PARAM =
  /^(utm_[a-z]+|fbclid|gclid|gbraid|wbraid|mc_[a-z]+|ref|ref_src|igshid|si|spm|yclid)$/i

export function bookmarkKey(raw: string): string {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return ''

  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  let u: URL
  try {
    u = new URL(withProto)
  } catch {
    return trimmed.toLowerCase()
  }

  u.protocol = 'https:'
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, '')
  u.hash = ''

  const kept = new URLSearchParams()
  for (const [k, v] of u.searchParams) {
    if (!TRACKING_PARAM.test(k)) kept.append(k, v)
  }
  u.search = kept.toString()

  const path = u.pathname.replace(/\/+$/, '')
  u.pathname = path || '/'

  // Drop the trailing slash on a bare host (https://example.com/ → …com).
  return u.toString().replace(/\/$/, '')
}
