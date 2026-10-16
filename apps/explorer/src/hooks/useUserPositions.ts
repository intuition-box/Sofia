/**
 * useUserPositions — the connected wallet's active positions (platforms,
 * atoms, claims) plus the summary header figures, for `/positions`.
 *
 * Not a paginated feed: the summary (total value, change, "brought to
 * platforms") must cover every position, so the service walks all pages
 * up front. Uses the active Privy wallet — the one an exit redeems from.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePrivy } from '@privy-io/react-auth'
import { getAddress } from 'viem'
import {
  fetchUserPositions,
  summarizePositions,
  type MarketPosition,
  type PositionsSummary,
} from '@/services/userPositionsService'
import { PLATFORM_ATOM_IDS } from '@/config/atomIds'
import { fetchWithRetry } from '@/utils/fetchRetry'

const PLATFORM_TERM_IDS: ReadonlySet<string> = new Set(
  Object.values(PLATFORM_ATOM_IDS).map((id) => id.toLowerCase()),
)

export interface UseUserPositionsResult {
  walletAddress: string | undefined
  positions: MarketPosition[]
  summary: PositionsSummary
  loading: boolean
  /** Any request in flight (refresh button state). */
  fetching: boolean
  error: string | null
  truncated: boolean
  refresh: () => void
}

export function useUserPositions(): UseUserPositionsResult {
  const { user } = usePrivy()
  const walletAddress = user?.wallet?.address

  // The indexer stores account_id in mixed casings — query both.
  const addresses = useMemo(() => {
    if (!walletAddress) return []
    const set = new Set([walletAddress.toLowerCase()])
    try {
      set.add(getAddress(walletAddress))
    } catch {
      // malformed address — lowercase only
    }
    return [...set]
  }, [walletAddress])

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['user-market-positions', walletAddress?.toLowerCase()],
    queryFn: () =>
      fetchWithRetry(() => fetchUserPositions(addresses, PLATFORM_TERM_IDS)),
    enabled: addresses.length > 0,
    staleTime: 60_000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const positions = useMemo(() => data?.positions ?? [], [data])
  const summary = useMemo(() => summarizePositions(positions), [positions])

  return {
    walletAddress,
    positions,
    summary,
    loading: isLoading,
    fetching: isFetching,
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
    truncated: data?.truncated ?? false,
    refresh: () => {
      refetch()
    },
  }
}
