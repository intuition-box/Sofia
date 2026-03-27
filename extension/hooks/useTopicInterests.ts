/**
 * useTopicInterests Hook
 * Fetches user's on-chain topic interest positions from Sofia Explorer.
 * Uses TopicPositionsService singleton via useSyncExternalStore.
 */

import { useSyncExternalStore, useEffect, useMemo } from "react"
import { topicPositionsService } from "~/lib/services"
import { useWalletFromStorage } from "./useWalletFromStorage"
import type { UserTopicPosition } from "~/lib/services/TopicPositionsService"

export interface TopicInterestsResult {
  interests: UserTopicPosition[]
  topInterests: UserTopicPosition[]
  isLoading: boolean
  hasInterests: boolean
}

export const useTopicInterests = (): TopicInterestsResult => {
  const { walletAddress } = useWalletFromStorage()

  const state = useSyncExternalStore(
    topicPositionsService.subscribe,
    topicPositionsService.getSnapshot
  )

  useEffect(() => {
    if (walletAddress) {
      topicPositionsService.fetchUserTopicPositions(walletAddress)
    }
  }, [walletAddress])

  const topInterests = useMemo(
    () => topicPositionsService.getTopInterests(3),
    [state.positions]
  )

  return {
    interests: state.positions,
    topInterests,
    isLoading: state.loading,
    hasInterests: state.positions.length > 0,
  }
}
