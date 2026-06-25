// URL normalisation — the stable key for a shared page, mirrors circle-pro-mvp's
// bookmarkKey: force https, drop `www.`, strip the hash + common tracking params,
// trim a trailing slash. Keeps the key identical whether bookmarks end up
// off-chain or on-chain later.
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

/** Host without `www.`, for display. */
export function hostOf(url: string): string {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(
      /^www\./,
      "",
    )
  } catch {
    return url
  }
}
