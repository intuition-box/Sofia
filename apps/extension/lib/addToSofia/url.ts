// Host label helper for the Add-to-Sofia modal preview. Favicons reuse the
// shared `getFaviconUrl` from ~lib/utils — don't duplicate it here.

/** Bare host of a URL ("https://a.com/x?y" → "a.com"), best-effort. */
export function hostOf(url: string): string {
  try {
    return new URL(
      url.startsWith("http") ? url : `https://${url}`
    ).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}
