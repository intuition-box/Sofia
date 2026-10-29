import { getFaviconUrl } from "./formatters"
import { normalizeUrl } from "./normalizeUrl"

/**
 * The fields pinned for a page atom — one shape everywhere (right-click,
 * free Recommends through the write-relayer, cartService.toBatchInputs), so
 * the same page always resolves to the same atom.
 */
export function pageAtomData(url: string, title: string | null) {
  const { label } = normalizeUrl(url)
  return {
    name: title || label,
    description: `Page: ${label}`,
    url,
    image: getFaviconUrl(url, 128) || undefined
  }
}
