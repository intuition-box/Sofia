/**
 * useSofiaFeed — canonical paginated feed hook.
 *
 * One hook, one cache key family, one shape. All Sofia feed surfaces
 * (Home All Activity, Home My Circle, /circles/:id, profile drawer
 * Last Activity, Echoes Bento when migrated) route through this
 * hook. React Query keys are derived from the call params so two
 * surfaces with the same `(accountIds, predicateLabels)` share a
 * single cache entry — navigation between them is instant and the
 * indexer is hit once.
 *
 * Internals delegate to `fetchSofiaFeed` which routes to one of two
 * GraphQL queries depending on whether `accountIds` is provided:
 *   - empty/undefined → global Sofia feed
 *   - non-empty       → scoped to those accounts' active endorsements
 *
 * Both queries are triples-based + predicate-label-filtered (the
 * Echoes pattern), so the data is robust against proxy redeploys.
 *
 * Pagination follows the documented convention
 * (`apps/explorer/PAGINATION.md`) — page 0 lives in `useInfiniteQuery`'s
 * cache, `loadMore` fetches the next page, `hasMore` flips when the
 * indexer returns a short page.
 */
import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getAddress } from 'viem'
import { useLinkedWallets } from './useLinkedWallets'
import {
  fetchSofiaFeed,
  SOFIA_PREDICATE_LABELS,
} from '../services/sofiaFeedService'
import { fetchWithRetry } from '../utils/fetchRetry'
import type { CircleItem } from '../services/circleService'

const BATCH_SIZE = 1000

export interface UseSofiaFeedParams {
  /** When non-empty, scope the feed to triples any of these wallets
   *  actively endorses. When empty/undefined, return the global feed. */
  accountIds?: readonly string[]
  /** Predicate label allow-list. Defaults to the full Sofia set. */
  predicateLabels?: readonly string[]
  /** When false, the hook stays idle (no network) — useful while
   *  upstream params are still loading. */
  enabled?: boolean
}

export interface UseSofiaFeedResult {
  items: CircleItem[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
  error: string | null
}

export function useSofiaFeed({
  accountIds,
  predicateLabels = SOFIA_PREDICATE_LABELS,
  enabled = true,
}: UseSofiaFeedParams = {}): UseSofiaFeedResult {
  const { addresses: viewerWallets } = useLinkedWallets()

  // Stable cache keys — checksummed + sorted so two consumers passing
  // the same wallets in different order share the cache entry.
  const accountsKey = useMemo(() => {
    if (!accountIds || accountIds.length === 0) return ''
    return [...accountIds.map((a) => getAddress(a))].sort().join(',')
  }, [accountIds])

  const viewerKey = useMemo(
    () => [...viewerWallets.map((a) => getAddress(a))].sort().join(','),
    [viewerWallets],
  )

  const labelsKey = useMemo(
    () => [...predicateLabels].sort().join(','),
    [predicateLabels],
  )

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery<CircleItem[]>({
    queryKey: ['sofia-feed', accountsKey, viewerKey, labelsKey],
    queryFn: ({ pageParam }) =>
      fetchWithRetry(() =>
        fetchSofiaFeed({
          accountIds,
          viewerWallets,
          predicateLabels,
          limit: BATCH_SIZE,
          offset: pageParam as number,
        }),
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length > 0 ? allPages.length * BATCH_SIZE : undefined,
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  // Flatten + dedup by id. Indexer pagination is offset-based, so a
  // new event landing between two page fetches can briefly surface
  // the same id twice — drop those.
  const items = useMemo(() => {
    const seen = new Set<string>()
    const out: CircleItem[] = []
    for (const page of data?.pages ?? []) {
      for (const item of page) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        out.push(item)
      }
    }
    return out
  }, [data])

  return {
    items,
    loading: isLoading && items.length === 0,
    loadingMore: isFetchingNextPage,
    hasMore: !!hasNextPage,
    loadMore: () => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage()
    },
    refresh: () => {
      refetch()
    },
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
  }
}
