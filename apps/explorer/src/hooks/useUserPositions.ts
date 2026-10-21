/**
 * useUserPositions — a wallet's active positions (platforms, atoms,
 * claims) plus the summary header figures, for `/positions` and
 * `/positions/:address`.
 *
 * Not a paginated feed: the summary (total value, change, "brought to
 * platforms") must cover every position, so the service walks all pages
 * up front. Defaults to the active Privy wallet — the one an exit redeems
 * from; pass `address` to read any other wallet (read-only), or `null`
 * while that address is still unknown (e.g. ENS resolving) to stay idle.
 * What mined txs did but the indexer doesn't show yet is merged in (see
 * optimisticPositions).
 */
import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import {
  EMPTY_OPTIMISTIC,
  mergeOptimisticPositions,
  optimisticPositionsKey,
  pruneOptimisticPositions,
  userPositionsKey,
  type OptimisticPositions,
} from '@/lib/realtime/optimisticPositions'

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

export function useUserPositions(
  address?: string | null,
): UseUserPositionsResult {
  const { user } = usePrivy()
  const qc = useQueryClient()
  const walletAddress =
    address === undefined ? user?.wallet?.address : address || undefined

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
    // 'v3': per-curve legs + exit-value pricing — drop older persisted entries
    queryKey: userPositionsKey(walletAddress),
    queryFn: () =>
      fetchWithRetry(() => fetchUserPositions(addresses, PLATFORM_TERM_IDS)),
    enabled: addresses.length > 0,
    staleTime: 60_000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  // Written by WeightModal when a tx is mined; never fetched. No
  // initialData: it would outrank the persisted overlay on reload.
  const { data: overlay } = useQuery<OptimisticPositions>({
    queryKey: optimisticPositionsKey(walletAddress ?? ''),
    queryFn: () => EMPTY_OPTIMISTIC,
    enabled: false,
    staleTime: Infinity,
  })

  const indexed = useMemo(() => data?.positions ?? [], [data])
  const pending = overlay ?? EMPTY_OPTIMISTIC
  const hasPending = pending.exited.length > 0 || pending.added.length > 0

  // Reconcile: drop what the indexer now reflects
  useEffect(() => {
    if (!data || !hasPending || !walletAddress) return
    const next = pruneOptimisticPositions(data.positions, pending)
    if (
      next.exited.length !== pending.exited.length ||
      next.added.length !== pending.added.length
    ) {
      qc.setQueryData(optimisticPositionsKey(walletAddress), next)
    }
  }, [data, pending, hasPending, walletAddress, qc])

  const positions = useMemo(
    () => (hasPending ? mergeOptimisticPositions(indexed, pending) : indexed),
    [indexed, pending, hasPending],
  )
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
