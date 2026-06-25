// Display-only URL helpers for the share modal (host label + favicon). The
// canonical normalisation that derives the on-chain key happens server-side
// (@0xsofia/url-key in circle-pro-api) — never trusted from the client.

/** Bare host of a URL ("https://a.com/x?y" → "a.com"), best-effort. */
export function hostOf(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(
      /^www\./,
      ""
    )
  } catch {
    return url
  }
}

export function faviconFor(url: string): string {
  return `https://www.google.com/s2/favicons?domain=${hostOf(url)}&sz=128`
}
