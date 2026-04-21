import { PLATFORM_CATALOG } from '../config/platformCatalog'

/** Map of normalized domain → platform slug, built once at module load */
const domainToSlug = new Map<string, string>()

function normalize(domain: string): string {
  return domain.toLowerCase().replace(/^www\./, '')
}

for (const p of PLATFORM_CATALOG) {
  // id itself as domain (e.g. "github" → "github.com")
  domainToSlug.set(`${p.id}.com`, p.id)

  if (p.website) {
    try { domainToSlug.set(normalize(new URL(p.website).hostname), p.id) } catch {}
  }
  if (p.apiBaseUrl) {
    try {
      const host = normalize(new URL(p.apiBaseUrl).hostname)
      // Skip generic API subdomains (api.github.com → github.com already covered)
      if (!host.startsWith('api.')) domainToSlug.set(host, p.id)
    } catch {}
  }
}

/**
 * Returns local favicon path if the domain matches a known platform,
 * otherwise falls back to Google Favicon API.
 */
export function getFaviconUrl(domain: string, size: number = 64): string {
  const normalized = normalize(domain)
  const slug = domainToSlug.get(normalized)
  if (slug) return `/favicons/${slug}.png`
  return `https://www.google.com/s2/favicons?domain=${normalized}&sz=${size}`
}
