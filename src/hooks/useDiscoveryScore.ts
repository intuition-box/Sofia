/**
 * useDiscoveryScore — Pioneer/Explorer/Contributor/Trusted counts.
 *
 * Stays HTTP-pull (server-side aggregates aren't streamed by the WS layer),
 * but converted to useQuery so the persister holds the value across reloads
 * and the user isn't left watching a "loading" flash every time.
 */

import { useQuery } from '@tanstack/react-query'
import { fetchDiscoveryStats } from '@/services/discoveryScoreService'
import type { DiscoveryStats } from '@/services/discoveryScoreService'

export type { DiscoveryStats }

export function useDiscoveryScore(walletAddress: string | undefined) {
  const address = walletAddress?.toLowerCase()

  const { data, isLoading } = useQuery({
    queryKey: address ? ['discovery-score', address] : ['discovery-score', undefined],
    queryFn: () => fetchDiscoveryStats(walletAddress!),
    enabled: !!walletAddress,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return { stats: data ?? null, loading: isLoading }
}
