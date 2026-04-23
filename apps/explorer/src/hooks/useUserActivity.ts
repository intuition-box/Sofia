/**
 * useUserActivity — on-chain activity feed for a user (or a user's linked wallets).
 *
 * Callers pass an array of addresses. For viewing someone else's profile, pass
 * `[otherUser.address]`. For viewing the current user's aggregated activity,
 * pass `useLinkedWallets().addresses`.
 *
 * Backed by a persisted React Query entry so reloads paint instantly from
 * localStorage. fetchUserActivity has retry+backoff via fetchWithRetry.
 */

import { useQuery } from '@tanstack/react-query'
import { fetchUserActivity } from '../services/domainActivityService'
import { fetchWithRetry } from '../utils/fetchRetry'
import type { CircleItem } from '../services/circleService'

const BATCH_SIZE = 200

export function useUserActivity(addresses: string[] | undefined) {
  const normalized = addresses ? [...addresses].sort() : []
  const cacheKey = normalized.join(',') || undefined

  const { data, isLoading, error, refetch } = useQuery<CircleItem[]>({
    queryKey: cacheKey ? ['user-activity', cacheKey] : ['user-activity', undefined],
    queryFn: () => fetchWithRetry(() => fetchUserActivity(addresses!, BATCH_SIZE, 0)),
    enabled: !!addresses && addresses.length > 0,
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
