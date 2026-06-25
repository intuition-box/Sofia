/**
 * @0xsofia/url-key — canonical URL normalisation, the SINGLE source of truth for
 * the bookmark key across the extension, circle-pro-mvp and circle-pro-api.
 *
 * THE INVARIANT: this output must equal the URL used to derive a bookmark's
 * on-chain atom. When URLs go on-chain (Intuition atoms), an off-chain row is
 * matched to its atom by recomputing this key — so it must never drift. That's
 * the whole reason it lives in one shared package.
 *
 * Rules: force https, drop `www.`, strip the hash + common tracking params,
 * trim a trailing slash.
 */
const TRACKING_PARAM =
  /^(utm_[a-z]+|fbclid|gclid|gbraid|wbraid|mc_[a-z]+|ref|ref_src|igshid|si|spm|yclid)$/i

export function normalizeUrl(raw: string): string {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return ""

  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  let u: URL
  try {
    u = new URL(withProto)
  } catch {
    return trimmed.toLowerCase()
  }

  u.protocol = "https:"
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, "")
  u.hash = ""

  const kept = new URLSearchParams()
  for (const [k, v] of u.searchParams) {
    if (!TRACKING_PARAM.test(k)) kept.append(k, v)
  }
  u.search = kept.toString()

  const path = u.pathname.replace(/\/+$/, "")
  u.pathname = path || "/"

  return u.toString().replace(/\/$/, "")
}

/** Canonical bookmark key — alias of normalizeUrl (the name circle-pro-mvp uses). */
export const bookmarkKey = normalizeUrl

/** Host without `www.`, for display. */
export function hostOf(url: string): string {
  try {
    return new URL(
      /^https?:\/\//i.test(url) ? url : `https://${url}`,
    ).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}
