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

export function usePortfolioHistory(walletAddress?: string) {
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
    queryKey: ['portfolio-history', walletAddress?.toLowerCase()],
    queryFn: () => fetchWithRetry(() => fetchPortfolioHistory(addresses)),
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
