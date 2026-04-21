import { useMemo } from 'react'
import type { Address } from 'viem'
import type { AlphaTester, PoolPosition, UserStats } from '@/types'
import { calculateUserStats } from '@/services/userStatsService'

export function useUserStats(
  walletAddress: Address | null,
  alphaLeaderboard: AlphaTester[],
  poolPositions: PoolPosition[] | null,
): UserStats {
  return useMemo(
    () => calculateUserStats(walletAddress, alphaLeaderboard, poolPositions),
    [walletAddress, alphaLeaderboard, poolPositions],
  )
}
