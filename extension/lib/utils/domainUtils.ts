/**
 * Domain Utilities
 * Shared domain extraction and normalization functions.
 * Consolidates duplicate implementations from 4 files:
 * - hooks/useOnChainIntentionGroups.ts
 * - hooks/useIntentionGroups.ts
 * - hooks/useTrendingCertifications.ts
 * - lib/utils/circleInterestUtils.ts
 */

import { EXCLUDED_URL_PATTERNS } from "~/background/constants"

/**
 * Normalize domain by removing common subdomains (www, open, m, mobile, etc.)
 */
export function normalizeDomain(domain: string): string {
  const lower = domain.toLowerCase()
  const prefixes = ["www.", "open.", "m.", "mobile.", "app.", "web."]
  for (const prefix of prefixes) {
    if (lower.startsWith(prefix)) {
      return lower.slice(prefix.length)
    }
  }
  return lower
}

/**
 * Extract and normalize domain from a label or URL string.
 * Returns null if the string is not a valid domain.
 */
export function extractDomain(label: string): string | null {
  if (!label) return null
  try {
    const cleaned = label.replace(/^https?:\/\//, "")
    const domain = cleaned.split("/")[0]
    if (domain && domain.includes(".")) {
      return normalizeDomain(domain)
    }
    return null
  } catch {
    return null
  }
}

/**
 * Extract raw hostname from a URL string (no subdomain normalization beyond www).
 * Always returns a string (never null).
 */
export function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url.split("/")[0] || url
  }
}

/**
 * Check if a domain should be excluded from display (auth pages, system pages, etc.)
 */
export function shouldExcludeDomain(domain: string): boolean {
  return EXCLUDED_URL_PATTERNS.some((p) =>
    domain.toLowerCase().includes(p.toLowerCase())
  )
}
