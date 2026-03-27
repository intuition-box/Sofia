/**
 * useDiscoveryScore Hook
 * Calculates user's discovery Gold based on their Pioneer/Explorer/Contributor certifications
 *
 * Uses DiscoveryScoreService singleton — all consumers share one GraphQL fetch
 *
 * Gold Rewards:
 * - Pioneer (1st): +50 Gold
 * - Explorer (2-10th): +20 Gold
 * - Contributor (11+): +10 Gold
 */

import { useSyncExternalStore } from "react"
import type { UserDiscoveryStats } from "../types/discovery"
import { discoveryScoreService } from "../lib/services/DiscoveryScoreService"

export interface DiscoveryScoreResult {
  stats: UserDiscoveryStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  claimedDiscoveryGold: number
  claimDiscoveryGold: (goldAmount: number) => Promise<number>
}

export const useDiscoveryScore = (): DiscoveryScoreResult => {
  const state = useSyncExternalStore(
    discoveryScoreService.subscribe,
    discoveryScoreService.getSnapshot
  )

  return {
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    claimedDiscoveryGold: state.claimedDiscoveryGold,
    refetch: () => discoveryScoreService.refetch(),
    claimDiscoveryGold: (amount) => discoveryScoreService.claimGold(amount)
  }
}
