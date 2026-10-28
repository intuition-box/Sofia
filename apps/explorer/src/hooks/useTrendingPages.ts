/**
 * useTrendingPages — paginated feed of the pages gaining positions inside a
 * time window (`/trending`). Follows the Paginated Feed Hook Shape.
 *
 * The window ranking (cheap: one row per position) is its own cached query;
 * page cards are then fetched one BATCH_SIZE slice of that ranking at a time.
 * Page 0 lives in the React Query cache, later pages in local `extra` state,
 * reset whenever the first page changes (new window, refetch).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  fetchTrendingRanking,
  fetchTrendingPageDetails,
  type TrendingPage,
  type TrendingWindow,
} from '@/services/trendingPagesService'
import { fetchWithRetry } from '@/utils/fetchRetry'

const BATCH_SIZE = 20
/** Bump when the persisted ranking / page shape changes (v2: pages keyed by
 *  web key across atoms and apps) so old cache entries are never read. */
const CACHE_VERSION = 'v2'
const STALE = 10 * 60 * 1000
const GC = 24 * 60 * 60 * 1000

export interface UseTrendingPagesResult {
  items: TrendingPage[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
  error: string | null
  /** The ranking walk stopped before the window cutoff. */
  truncated: boolean
  /** The list shown is the previous one while a fresher one loads */
  refreshing: boolean
}

function message(err: unknown): string | null {
  if (!err) return null
  return err instanceof Error ? err.message : String(err)
}

/** Window ranking query — shared (same cache entry) with useMissions */
export const trendingRankingQuery = (timeWindow: TrendingWindow) => ({
  queryKey: ['trending-pages-ranking', CACHE_VERSION, timeWindow],
  queryFn: () => fetchWithRetry(() => fetchTrendingRanking(timeWindow)),
  staleTime: STALE,
  gcTime: GC,
  refetchOnWindowFocus: false,
  // Switching window keeps the current list up while the new one loads
  placeholderData: keepPreviousData,
})

export function useTrendingPages(
  timeWindow: TrendingWindow,
): UseTrendingPagesResult {
  const ranking = useQuery(trendingRankingQuery(timeWindow))
  const ranks = useMemo(() => ranking.data?.ranks ?? [], [ranking.data])

  const firstSlice = useMemo(() => ranks.slice(0, BATCH_SIZE), [ranks])
  const firstPage = useQuery({
    queryKey: [
      'trending-pages',
      CACHE_VERSION,
      timeWindow,
      firstSlice.map((r) => `${r.key}:${r.windowPositions}`).join(','),
    ],
    queryFn: () => fetchWithRetry(() => fetchTrendingPageDetails(firstSlice)),
    enabled: ranking.isSuccess,
    staleTime: STALE,
    gcTime: GC,
    refetchOnWindowFocus: false,
    // The key moves with the ranking's counts: keep the list in place
    placeholderData: keepPreviousData,
  })

  const [extra, setExtra] = useState<TrendingPage[]>([])
  const [offset, setOffset] = useState(BATCH_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState<string | null>(null)

  // New head-of-list (window switch / refetch) → drop the appended pages.
  useEffect(() => {
    setExtra([])
    setOffset(BATCH_SIZE)
    setMoreError(null)
  }, [firstPage.data])

  const items = useMemo(() => {
    const seen = new Set<string>()
    const out: TrendingPage[] = []
    for (const item of [...(firstPage.data ?? []), ...extra]) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      out.push(item)
    }
    return out
  }, [firstPage.data, extra])

  const hasMore = firstPage.isSuccess && offset < ranks.length

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return
    const slice = ranks.slice(offset, offset + BATCH_SIZE)
    setLoadingMore(true)
    setMoreError(null)
    fetchWithRetry(() => fetchTrendingPageDetails(slice))
      .then((pages) => {
        setExtra((prev) => [...prev, ...pages])
        setOffset((o) => o + BATCH_SIZE)
      })
      .catch((err) => setMoreError(message(err)))
      .finally(() => setLoadingMore(false))
  }, [hasMore, loadingMore, ranks, offset])

  const refresh = useCallback(() => {
    ranking.refetch()
  }, [ranking])

  return {
    items,
    loading: ranking.isLoading || (ranking.isSuccess && firstPage.isLoading),
    loadingMore,
    hasMore,
    loadMore,
    refresh,
    error: message(ranking.error) ?? message(firstPage.error) ?? moreError,
    truncated: ranking.data?.truncated ?? false,
    refreshing: ranking.isPlaceholderData || firstPage.isPlaceholderData,
  }
}
