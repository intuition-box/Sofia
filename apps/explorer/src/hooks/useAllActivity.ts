import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchAllActivity } from '../services/activityService'
import { fetchWithRetry } from '../utils/fetchRetry'
import type { CircleItem } from '../services/circleService'

const BATCH_SIZE = 200

/**
 * Infinite-scrolling activity feed. The first page is persisted by React Query
 * so reloads paint instantly; subsequent pages live in the same cache and are
 * fetched on demand via loadMore().
 */
export function useAllActivity() {
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery<CircleItem[]>({
    queryKey: ['all-activity'],
    queryFn: ({ pageParam }) =>
      fetchWithRetry(() => fetchAllActivity(BATCH_SIZE, pageParam as number)),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === BATCH_SIZE ? allPages.length * BATCH_SIZE : undefined,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  // Flatten + dedup. Indexer pagination is offset-based, so on edge cases
  // (a new event landing between two page fetches) the same id can appear
  // in two consecutive pages — drop those.
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
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
    hasMore: !!hasNextPage,
    loadMore: () => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage()
    },
    refresh: () => {
      refetch()
    },
  }
}
