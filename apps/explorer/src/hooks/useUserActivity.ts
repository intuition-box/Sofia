/**
 * useUserActivity — on-chain activity feed for a user (or a user's linked wallets).
 *
 * Callers pass an array of addresses. For viewing someone else's profile, pass
 * `[otherUser.address]`. For viewing the current user's aggregated activity,
 * pass `useLinkedWallets().addresses`.
 *
 * Backed by a persisted React Query entry so reloads paint instantly from
 * localStorage. fetchUserActivity has retry+backoff via fetchWithRetry.
 *
 * Pagination follows the shared shape: `{ items, loadMore, hasMore,
 * loading, loadingMore }`. The first page is React-Query cached for
 * 10 min and persisted across reloads; subsequent pages append to a
 * local `extra` state so the cache stays a stable snapshot of the
 * head of the feed. `hasMore` flips false when a page comes back
 * shorter than `BATCH_SIZE`.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchUserActivity } from '../services/domainActivityService'
import { fetchWithRetry } from '../utils/fetchRetry'
import type { CircleItem } from '../services/circleService'

const BATCH_SIZE = 200

export function useUserActivity(addresses: string[] | undefined) {
  const normalized = addresses ? [...addresses].sort() : []
  const cacheKey = normalized.join(',') || undefined
  const enabled = !!addresses && addresses.length > 0

  const {
    data: initial,
    isLoading,
    error,
    refetch,
  } = useQuery<CircleItem[]>({
    queryKey: cacheKey
      ? ['user-activity', cacheKey]
      : ['user-activity', undefined],
    queryFn: () =>
      fetchWithRetry(() => fetchUserActivity(addresses!, BATCH_SIZE, 0)),
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const [extra, setExtra] = useState<CircleItem[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(BATCH_SIZE)

  // Reset paged state whenever the first-page payload changes (new
  // address set, refetch, etc.) so we don't stitch pages from
  // mismatched queries.
  useEffect(() => {
    setExtra([])
    offsetRef.current = BATCH_SIZE
    setHasMore((initial?.length ?? 0) >= BATCH_SIZE)
  }, [initial])

  const loadMore = useCallback(async () => {
    if (!enabled || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const next = await fetchUserActivity(
        addresses!,
        BATCH_SIZE,
        offsetRef.current,
      )
      if (next.length === 0) {
        setHasMore(false)
      } else {
        setExtra((prev) => {
          const seen = new Set<string>([
            ...(initial ?? []).map((i) => i.id),
            ...prev.map((i) => i.id),
          ])
          return [...prev, ...next.filter((i) => !seen.has(i.id))]
        })
        offsetRef.current += BATCH_SIZE
        if (next.length < BATCH_SIZE) setHasMore(false)
      }
    } catch (err) {
      console.error('[useUserActivity] loadMore', err)
    } finally {
      setLoadingMore(false)
    }
  }, [addresses, enabled, loadingMore, hasMore, initial])

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
