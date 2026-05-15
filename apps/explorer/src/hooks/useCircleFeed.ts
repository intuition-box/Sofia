import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCircleFeed, type CircleItem } from '../services/circleService'
import { fetchWithRetry } from '../utils/fetchRetry'
import { useLinkedWallets } from './useLinkedWallets'

// First-page size bumped from 200 → 1000 once we switched to the
// positions-table query: each row is a (user, triple) endorsement
// scoped to Sofia-proxy-created triples, so we want a wide net up
// front and let pagination scroll for the long tail.
const BATCH_SIZE = 1000

/**
 * Activity authored by the circle's roster.
 *
 * `certifierWallets` is the roster — Trust Circle members for the trust
 * circle, claimed group members for an on-chain group. The viewer's own
 * linked wallets are pulled from `useLinkedWallets()` for the per-item
 * support/oppose stake flags.
 */
export function useCircleFeed(certifierWallets: string[] | undefined) {
  const { addresses: viewerWallets } = useLinkedWallets()

  const normalized = certifierWallets ? [...certifierWallets].sort() : []
  const viewerNormalized = [...viewerWallets].sort()
  const cacheKey = normalized.join(',') || undefined
  const viewerKey = viewerNormalized.join(',')
  const enabled = !!certifierWallets && certifierWallets.length > 0

  const {
    data: initial,
    isLoading,
    error,
    refetch,
  } = useQuery<CircleItem[]>({
    queryKey: cacheKey
      ? ['circle-feed', cacheKey, viewerKey]
      : ['circle-feed', undefined, viewerKey],
    queryFn: () =>
      fetchWithRetry(() =>
        fetchCircleFeed(certifierWallets!, viewerWallets, BATCH_SIZE, 0),
      ),
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
    // Optimistic `hasMore` — the service does dedup + grouping
    // between the indexer page (BATCH_SIZE triples) and `items`
    // (one card per (user, URL)), so `items.length >= BATCH_SIZE`
    // is no longer a reliable end-of-stream signal. We trust the
    // indexer to flip us to "done" when `loadMore` comes back
    // empty (handled below).
    setHasMore((initial?.length ?? 0) > 0)
  }, [initial])

  const loadMore = useCallback(async () => {
    if (!enabled || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const newItems = await fetchCircleFeed(
        certifierWallets!,
        viewerWallets,
        BATCH_SIZE,
        offsetRef.current,
      )
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
  }, [certifierWallets, viewerWallets, enabled, loadingMore, hasMore, initial])

  const items = [...(initial ?? []), ...extra]

  return {
    items,
    loading: isLoading && items.length === 0,
    loadingMore,
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
    hasMore,
    loadMore,
    refresh: () => {
      refetch()
    },
  }
}
