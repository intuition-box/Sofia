/**
 * URL sanitization for indexer-supplied data.
 *
 * The Intuition indexer returns user-supplied atom URLs that are then
 * rendered into `<a href={...}>`. Without scheme validation, an indexer
 * compromise (or a maliciously-crafted atom) could inject `javascript:`
 * or `data:` URIs that execute on click. React 18 mitigates `javascript:`
 * with a warning + sanitization but does NOT block `data:` — and
 * `<a href="data:text/html,<script>...">` is a well-known XSS vector.
 */

/**
 * Returns the URL only if it parses as an absolute http(s) URL,
 * undefined otherwise. Use as `<a href={safeHref(url)}>`.
 */
export function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
  } catch {
    // Not a valid absolute URL.
  }
  return undefined
}
