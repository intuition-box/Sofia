/**
 * useMissions — the connected wallet's Trend Hunter missions (day + week).
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAddress } from 'viem'
import { startOfUtcDay } from '@0xsofia/quests'
import { fetchMissions, type MissionsResult } from '@/services/missionsService'
import { keepPreviousIfSame } from '@/utils/keepPrevious'

export interface UseMissionsResult {
  missions: MissionsResult | null
  loading: boolean
  refresh: () => void
}

export function useMissions(walletAddress?: string | null): UseMissionsResult {
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
    // New UTC day → recompute
    queryKey: ['missions', addresses[0], startOfUtcDay()],
    queryFn: () => fetchMissions(addresses),
    enabled: addresses.length > 0,
    staleTime: 5 * 60 * 1000,
    // The day rolls the key: keep this wallet's missions up meanwhile
    placeholderData: keepPreviousIfSame(1, addresses[0]),
  })

  return {
    missions: data ?? null,
    loading: isLoading,
    refresh: () => void refetch(),
  }
}
