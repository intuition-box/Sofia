/**
 * useDiscoveryScore — Pioneer/Explorer/Contributor/Trusted counts, unioned
 * across the user's linked wallets.
 *
 * Stays HTTP-pull (server-side aggregates aren't streamed by the WS layer),
 * but converted to useQuery so the persister holds the value across reloads
 * and the user isn't left watching a "loading" flash every time.
 */

import { useQuery } from '@tanstack/react-query'
import { fetchDiscoveryStats } from '@/services/discoveryScoreService'
import type { DiscoveryStats } from '@/services/discoveryScoreService'

export type { DiscoveryStats }

export function useDiscoveryScore(addresses: string[] | undefined) {
  const normalized = addresses ? [...addresses].sort() : []
  const cacheKey = normalized.join(',') || undefined
  const enabled = !!addresses && addresses.length > 0

  const { data, isLoading } = useQuery({
    queryKey: cacheKey ? ['discovery-score', cacheKey] : ['discovery-score', undefined],
    queryFn: () => fetchDiscoveryStats(addresses!),
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return { stats: data ?? null, loading: isLoading }
}
