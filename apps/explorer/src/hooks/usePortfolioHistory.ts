/**
 * usePortfolioHistory — daily value of a wallet's positions, for the chart
 * on `/positions`. Same address casings as useUserPositions (the indexer
 * stores account_id in mixed case; `_in` on both is fast, `_ilike` is not).
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAddress } from 'viem'
import { fetchPortfolioHistory } from '@/services/portfolioHistoryService'
import { fetchWithRetry } from '@/utils/fetchRetry'
import type { MarketPosition } from '@/services/userPositionsService'

export function usePortfolioHistory(
  walletAddress?: string,
  positions: readonly MarketPosition[] = [],
) {
  // Per term: real value ÷ spot value today — corrects the spot-priced
  // history so the curve ends on the P&L the page shows
  const valueRatios = useMemo(() => {
    const out: Record<string, number> = {}
    for (const p of positions) {
      const mark = Number(p.markValue ?? '0')
      if (mark > 0) out[p.termId] = Number(p.value) / mark
    }
    return out
  }, [positions])
  const ratioKey = useMemo(
    () =>
      Object.values(valueRatios)
        .reduce((a, b) => a + b, 0)
        .toFixed(4),
    [valueRatios],
  )

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

  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolio-history', walletAddress?.toLowerCase(), ratioKey],
    queryFn: () =>
      fetchWithRetry(() => fetchPortfolioHistory(addresses, valueRatios)),
    enabled: addresses.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    points: data ?? [],
    loading: isLoading && addresses.length > 0,
    error: error ? String(error) : null,
  }
}
