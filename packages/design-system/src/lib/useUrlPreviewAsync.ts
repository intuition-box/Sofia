/**
 * useUrlPreviewAsync — React Query wrapper around the async preview
 * dispatcher. Returns the upgraded preview when an async provider
 * matches the URL; returns undefined while loading or when no provider
 * can enrich. Callers stay on their sync fallback (favicon / YouTube /
 * GitHub) until the async hit lands.
 *
 * The OG proxy base URL is passed in by the caller (read from its own
 * env: `VITE_OG_PROXY_URL` in the explorer, `PLASMO_PUBLIC_OG_PROXY_URL`
 * in the extension) so this hook stays env-agnostic across Vite/Plasmo.
 *
 * Caching:
 *  - keyed by URL + proxy base (deduplicated across cards on the same URL)
 *  - 24h staleTime: preview images rarely change mid-day
 *  - 7d gcTime: keeps recently seen URLs warm across navigations
 *  - When the host app persists its React Query cache (PersistQueryClient
 *    → IndexedDB), a second visit boots with previews ready.
 */
import { useQuery } from '@tanstack/react-query'
import { fetchAsyncUrlPreview, hasAsyncProvider } from './asyncUrlPreview'
import type { UrlPreview } from './urlPreview'

// Bumped whenever the preview-resolution logic changes in a way that
// should invalidate already-cached results (incl. the IndexedDB-persisted
// ones). v2: drop the proxy's generated `/render` placeholder cards so
// they fall back to the client brand gradient.
const CACHE_VERSION = 'v2'

export function useUrlPreviewAsync(
  url: string | undefined,
  ogProxyUrl?: string,
): {
  data: UrlPreview | undefined
  isLoading: boolean
} {
  // The proxy base is embedded in the React Query key so that flipping the
  // env var (e.g. swapping localhost for a Coolify URL, or unsetting it)
  // naturally invalidates every cached preview — nulls cached while
  // pointing at a dead endpoint would otherwise stick around for the
  // cache's full 7-day gcTime, even after the env flipped to a working one.
  const fingerprint = ogProxyUrl ?? 'proxy-off'
  const enabled = !!url && hasAsyncProvider(url, ogProxyUrl)
  const { data, isLoading } = useQuery({
    queryKey: ['url-preview', CACHE_VERSION, fingerprint, url],
    queryFn: () => fetchAsyncUrlPreview(url!, ogProxyUrl),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  return { data: data ?? undefined, isLoading }
}
