/**
 * useCredibilityAnalysis Hook
 * Computes trust/distrust ratios, bar colors, and atom stats from blockchain data
 */

import { useMemo } from "react"
import type { PageBlockchainCounts, PageAtomInfo, PageBlockchainTriplet } from "~/types/page"

const getBarColor = (ratio: number, support: number): string => {
  if (support === 0) return "#6B7280"
  if (ratio >= 80) return "#22c55e"
  if (ratio >= 60) return "#84cc16"
  if (ratio >= 40) return "#eab308"
  if (ratio >= 20) return "#f97316"
  return "#ef4444"
}

export const getTotalShares = (triplet: PageBlockchainTriplet): number => {
  if (!triplet.positions) return 0
  return triplet.positions.reduce((sum, pos) => {
    return sum + (Number(pos.shares || 0) / 1e18)
  }, 0)
}

export interface CredibilityAnalysis {
  trustCount: number
  distrustCount: number
  totalSupport: number
  trustRatio: number
  barColor: string
  atomsCount: number
  triplesCount: number
  atomsList: PageAtomInfo[]
}

export const useCredibilityAnalysis = (
  counts: PageBlockchainCounts,
  atomsList: PageAtomInfo[]
): CredibilityAnalysis => {
  return useMemo(() => ({
    trustCount: counts.trustCount,
    distrustCount: counts.distrustCount,
    totalSupport: counts.totalSupport,
    trustRatio: counts.trustRatio,
    barColor: getBarColor(counts.trustRatio, counts.totalSupport),
    atomsCount: counts.atomsCount,
    triplesCount: counts.triplesCount,
    atomsList
  }), [counts, atomsList])
}
