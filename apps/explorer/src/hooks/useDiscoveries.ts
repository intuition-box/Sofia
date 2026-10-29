/**
 * useDiscoveries — pages a wallet recommended first, with the followers that
 * came after and the P&L of those positions. Facade over discoveriesService.
 */
import { useQuery } from '@tanstack/react-query'
import {
  fetchDiscoveries,
  type DiscoveriesResult,
} from '@/services/discoveriesService'
import type { MarketPosition } from '@/services/userPositionsService'

const EMPTY: DiscoveriesResult = { discoveries: [], followers: 0, change: '0' }

export function useDiscoveries(
  walletAddress: string | undefined,
  positions: readonly MarketPosition[],
) {
  const { data, isLoading } = useQuery({
    queryKey: ['discoveries', walletAddress?.toLowerCase(), positions.length],
    queryFn: () => fetchDiscoveries(walletAddress!, positions),
    enabled: !!walletAddress && positions.length > 0,
    staleTime: 5 * 60_000,
  })
  return { ...(data ?? EMPTY), loading: isLoading && !!walletAddress }
}
