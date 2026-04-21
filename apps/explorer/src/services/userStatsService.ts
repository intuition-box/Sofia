import type { Address } from 'viem'
import type { AlphaTester, PoolPosition, UserStats } from '@/types'

export function calculateUserStats(
  walletAddress: Address | null,
  alphaLeaderboard: AlphaTester[],
  poolPositions: PoolPosition[] | null,
): UserStats {
  if (!walletAddress) {
    return { isAlphaTester: false, alphaData: null, alphaRank: null, poolData: null, poolRank: null }
  }

  const addrLower = walletAddress.toLowerCase()

  // Alpha rank by TX (default sort)
  const alphaSorted = [...alphaLeaderboard].sort((a, b) => b.tx - a.tx)
  const alphaIndex = alphaSorted.findIndex(t => t.address.toLowerCase() === addrLower)
  const alphaData = alphaIndex >= 0 ? alphaSorted[alphaIndex] : null
  const alphaRank = alphaIndex >= 0 ? alphaIndex + 1 : null

  // Pool rank by P&L%
  const poolSorted = poolPositions
    ? [...poolPositions].sort((a, b) => b.pnlPercent - a.pnlPercent)
    : []
  const poolIndex = poolSorted.findIndex(p => p.address.toLowerCase() === addrLower)
  const poolData = poolIndex >= 0 ? poolSorted[poolIndex] : null
  const poolRank = poolIndex >= 0 ? poolIndex + 1 : null

  return { isAlphaTester: alphaIndex >= 0, alphaData, alphaRank, poolData, poolRank }
}
