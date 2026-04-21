import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAllActivity } from '../services/activityService'
import { fetchWithRetry } from '../utils/fetchRetry'
import type { CircleItem } from '../services/circleService'

const BATCH_SIZE = 200

/**
 * The initial BATCH_SIZE items are persisted via React Query so reloads
 * paint instantly. loadMore() appends subsequent pages to local state
 * only — those aren't persisted (cost vs benefit: initial page is the
 * fold-above-fold view; deeper scroll is a re-scroll action anyway).
 */
export function useAllActivity() {
  const { data: initial, isLoading, error, refetch } = useQuery<CircleItem[]>({
    queryKey: ['all-activity'],
    queryFn: () => fetchWithRetry(() => fetchAllActivity(BATCH_SIZE, 0)),
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const [extra, setExtra] = useState<CircleItem[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(BATCH_SIZE)

  // Reset pagination whenever the initial batch changes (refetch or first load).
  useEffect(() => {
    setExtra([])
    offsetRef.current = BATCH_SIZE
    setHasMore((initial?.length ?? 0) >= BATCH_SIZE)
  }, [initial])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const newItems = await fetchAllActivity(BATCH_SIZE, offsetRef.current)
      if (newItems.length === 0) {
        setHasMore(false)
      } else {
        setExtra((prev) => {
          const seen = new Set<string>([
            ...(initial ?? []).map((i) => i.id),
            ...prev.map((i) => i.id),
          ])
          return [...prev, ...newItems.filter((i) => !seen.has(i.id))]
        })
        offsetRef.current += BATCH_SIZE
      }
    } catch (err) {
      console.error('[useAllActivity] loadMore', err)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, initial])

  const items = [...(initial ?? []), ...extra]

  return {
    items,
    loading: isLoading && items.length === 0,
    loadingMore,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    hasMore,
    loadMore,
    refresh: () => { refetch() },
  }
}
