import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCircleFeed, type CircleItem } from '../services/circleService'
import { fetchWithRetry } from '../utils/fetchRetry'

const BATCH_SIZE = 200

/**
 * Same pattern as useAllActivity — initial page is persisted in the
 * React Query cache, additional pagination lives in local state.
 */
export function useCircleFeed(walletAddress: string | undefined) {
  const address = walletAddress?.toLowerCase()

  const { data: initial, isLoading, error, refetch } = useQuery<CircleItem[]>({
    queryKey: address ? ['circle-feed', address] : ['circle-feed', undefined],
    queryFn: () => fetchWithRetry(() => fetchCircleFeed(walletAddress!, BATCH_SIZE, 0)),
    enabled: !!walletAddress,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const [extra, setExtra] = useState<CircleItem[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(BATCH_SIZE)

  useEffect(() => {
    setExtra([])
    offsetRef.current = BATCH_SIZE
    setHasMore((initial?.length ?? 0) >= BATCH_SIZE)
  }, [initial])

  const loadMore = useCallback(async () => {
    if (!walletAddress || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const newItems = await fetchCircleFeed(walletAddress, BATCH_SIZE, offsetRef.current)
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
      console.error('[useCircleFeed] loadMore', err)
    } finally {
      setLoadingMore(false)
    }
  }, [walletAddress, loadingMore, hasMore, initial])

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
