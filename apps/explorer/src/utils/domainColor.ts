/**
 * domainColor — resolve a stable brand-ish colour for a domain.
 *
 * Used to tint the URL-preview fallback (the gradient shown when no
 * thumbnail / OG image could be fetched). Known platforms use their real
 * brand colour from the platform catalog (YouTube red, Spotify green, …);
 * everything else gets a deterministic hue hashed from the host so the
 * same domain always lands on the same colour.
 */
import { PLATFORM_CATALOG } from '../config/platformCatalog'

const normalize = (domain: string): string =>
  domain.toLowerCase().replace(/^www\./, '')

// domain → brand colour, built once from the catalog using the same
// host resolution as utils/favicon.ts so the colour matches the favicon.
const domainToColor = new Map<string, string>()
for (const p of PLATFORM_CATALOG) {
  if (!p.color) continue
  domainToColor.set(`${p.id}.com`, p.color)
  for (const candidate of [p.website, p.apiBaseUrl]) {
    if (!candidate) continue
    try {
      const host = normalize(new URL(candidate).hostname)
      // Skip generic API subdomains (api.github.com → github.com covered).
      if (!host.startsWith('api.')) domainToColor.set(host, p.color)
    } catch {
      // Ignore malformed catalog URLs.
    }
  }
}

/** Deterministic hue (0–359) from a string — same input, same colour. */
function hashHue(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash % 360
}

/** Brand colour for a known platform domain, else a stable hashed hue.
 *  Returns a CSS colour string ready to drop into a gradient. */
export function getDomainColor(domain: string | undefined): string {
  if (!domain) return 'var(--ds-accent, #888888)'
  const host = normalize(domain)
  const known = domainToColor.get(host)
  if (known) return known
  return `hsl(${hashHue(host)}, 52%, 52%)`
}
