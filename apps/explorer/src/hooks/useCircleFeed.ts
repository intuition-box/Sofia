import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCircleFeed, type CircleItem } from '../services/circleService'
import { fetchWithRetry } from '../utils/fetchRetry'

const BATCH_SIZE = 200

/**
 * Circle feed across all linked wallets. Callers pass the full addresses
 * array from `useLinkedWallets()`; the service unions trust relationships
 * before pulling activity.
 */
export function useCircleFeed(addresses: string[] | undefined) {
  const normalized = addresses ? [...addresses].sort() : []
  const cacheKey = normalized.join(',') || undefined
  const enabled = !!addresses && addresses.length > 0

  const { data: initial, isLoading, error, refetch } = useQuery<CircleItem[]>({
    queryKey: cacheKey ? ['circle-feed', cacheKey] : ['circle-feed', undefined],
    queryFn: () => fetchWithRetry(() => fetchCircleFeed(addresses!, BATCH_SIZE, 0)),
    enabled,
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
    if (!enabled || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const newItems = await fetchCircleFeed(addresses!, BATCH_SIZE, offsetRef.current)
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
  }, [addresses, enabled, loadingMore, hasMore, initial])

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
