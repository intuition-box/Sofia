/**
 * useMissions — the connected wallet's Trend Hunter missions (day + week).
 * Trending keys come from the shared 7-day ranking cache entry.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAddress } from 'viem'
import { startOfUtcDay } from '@0xsofia/quests'
import { trendingRankingQuery } from '@/hooks/useTrendingPages'
import { fetchMissions, type MissionsResult } from '@/services/missionsService'
import { keepPreviousIfSame } from '@/utils/keepPrevious'

/** "Back a trend" counts pages in the top of the 7-day Trending */
const TRENDING_TOP = 50

export interface UseMissionsResult {
  missions: MissionsResult | null
  loading: boolean
  refresh: () => void
}

export function useMissions(walletAddress?: string | null): UseMissionsResult {
  const ranking = useQuery(trendingRankingQuery('7d'))
  const trendingKeys = useMemo(
    () =>
      new Set(
        (ranking.data?.ranks ?? []).slice(0, TRENDING_TOP).map((r) => r.key),
      ),
    [ranking.data],
  )

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

  const { data, isLoading, refetch } = useQuery({
    // New UTC day or fresher Trending → recompute
    queryKey: [
      'missions',
      addresses[0],
      startOfUtcDay(),
      ranking.dataUpdatedAt,
    ],
    queryFn: () => fetchMissions(addresses, trendingKeys),
    enabled: addresses.length > 0 && !ranking.isLoading,
    staleTime: 5 * 60 * 1000,
    // Fresher Trending moves the key: keep this wallet's missions up
    placeholderData: keepPreviousIfSame(1, addresses[0]),
  })

  return {
    missions: data ?? null,
    loading: isLoading,
    refresh: () => void refetch(),
  }
}
