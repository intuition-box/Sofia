import { TRACKING_URL_PARAMS } from '../../background/constants'

/**
 * Normalize a URL for cache keying and matching.
 * - Lowercase, remove www., remove trailing slash, remove protocol
 * - KEEP content query params (v=abc on YouTube)
 * - STRIP tracking query params (utm_*, fbclid, etc.)
 */
export function normalizeUrl(url: string): { label: string; isRootDomain: boolean } {
  const urlObj = new URL(url)
  let hostname = urlObj.hostname.toLowerCase()
  const pathname = urlObj.pathname

  if (hostname.startsWith('www.')) hostname = hostname.slice(4)

  // Strip tracking params, keep content params
  const cleanParams = new URLSearchParams()
  urlObj.searchParams.forEach((value, key) => {
    if (!TRACKING_URL_PARAMS.has(key.toLowerCase())) {
      cleanParams.set(key, value)
    }
  })
  const search = cleanParams.toString() ? `?${cleanParams.toString()}` : ''

  const fullPath = pathname + search
  const hasPath = fullPath && fullPath !== '/'
  const label = hasPath
    ? `${hostname}${fullPath.replace(/\/$/, '')}`.toLowerCase()
    : hostname

  return { label, isRootDomain: !hasPath }
}
