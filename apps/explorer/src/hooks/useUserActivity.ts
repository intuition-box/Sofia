/**
 * useUserActivity — user's recent on-chain activity feed.
 *
 * Backed by a persisted React Query entry so reloads paint instantly
 * from localStorage while the background refresh (when triggered) pulls
 * the latest events. fetchUserActivity already has retry+backoff via
 * fetchWithRetry.
 */

import { useQuery } from '@tanstack/react-query'
import { fetchUserActivity } from '../services/domainActivityService'
import { fetchWithRetry } from '../utils/fetchRetry'
import type { CircleItem } from '../services/circleService'

const BATCH_SIZE = 200

export function useUserActivity(walletAddress: string | undefined) {
  const address = walletAddress?.toLowerCase()

  const { data, isLoading, error, refetch } = useQuery<CircleItem[]>({
    queryKey: address ? ['user-activity', address] : ['user-activity', undefined],
    queryFn: () => fetchWithRetry(() => fetchUserActivity(walletAddress!, BATCH_SIZE, 0)),
    enabled: !!walletAddress,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const items = data ?? []

  return {
    items,
    loading: isLoading && items.length === 0,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    hasMore: items.length >= BATCH_SIZE,
    refresh: () => { refetch() },
  }
}
