/**
 * useUrlPreviewAsync — React Query wrapper around the async preview
 * dispatcher. Returns the upgraded preview when an async provider
 * matches the URL; returns undefined while loading or when no provider
 * can enrich. Callers stay on their sync fallback (favicon / YouTube /
 * GitHub) until the async hit lands.
 *
 * Caching:
 *  - keyed by URL (deduplicated across cards rendering the same URL)
 *  - 24h staleTime: preview images rarely change mid-day
 *  - 7d gcTime: keeps recently seen URLs warm across navigations
 *  - PersistQueryClient already persists the cache to IndexedDB, so a
 *    second visit boots with previews ready
 */
import { useQuery } from '@tanstack/react-query'
import {
  fetchAsyncUrlPreview,
  hasAsyncProvider,
} from '@/utils/asyncUrlPreview'
import type { UrlPreview } from '@/utils/urlPreview'

// Injected into the React Query key so that flipping the OG proxy env
// var (e.g. from "unset" to "set") naturally invalidates every cached
// preview. Without this, a `null` cached when the proxy was off would
// keep being served after the proxy comes online — for the cache's
// full 7-day gcTime.
const PROXY_FINGERPRINT = import.meta.env.VITE_OG_PROXY_URL
  ? 'proxy-on'
  : 'proxy-off'

export function useUrlPreviewAsync(url: string | undefined): {
  data: UrlPreview | undefined
  isLoading: boolean
} {
  const enabled = !!url && hasAsyncProvider(url)
  const { data, isLoading } = useQuery({
    queryKey: ['url-preview', PROXY_FINGERPRINT, url],
    queryFn: () => fetchAsyncUrlPreview(url!),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  return { data: data ?? undefined, isLoading }
}
