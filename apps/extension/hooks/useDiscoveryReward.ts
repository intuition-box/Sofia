/**
 * useDiscoveryReward Hook
 * Manages discovery reward state: celebration animation, gold earned, reward claiming
 */

import { useState, useCallback } from "react"
import { createHookLogger } from "~/lib/utils/logger"
import { DISCOVERY_GOLD_REWARDS, DISCOVERY_THRESHOLDS } from "~/types/discovery"

const logger = createHookLogger("useDiscoveryReward")

const CELEBRATION_DURATION = 3000

export interface DiscoveryRewardResult {
  showCelebration: boolean
  goldEarned: number | null
  discoveryReward: { status: "Pioneer" | "Explorer" | "Contributor"; gold: number } | null
  rewardClaimed: boolean
  calculateAndTriggerReward: (prevTotalCertifications: number) => void
  handleClaimReward: (claimFn: (gold: number) => Promise<number>) => Promise<void>
  resetReward: () => void
}

export const useDiscoveryReward = (): DiscoveryRewardResult => {
  const [showCelebration, setShowCelebration] = useState(false)
  const [goldEarned, setGoldEarned] = useState<number | null>(null)
  const [discoveryReward, setDiscoveryReward] = useState<{
    status: "Pioneer" | "Explorer" | "Contributor"
    gold: number
  } | null>(null)
  const [rewardClaimed, setRewardClaimed] = useState(false)

  const calculateAndTriggerReward = useCallback((prevTotal: number) => {
    if (prevTotal === 0) {
      setDiscoveryReward({ status: "Pioneer", gold: DISCOVERY_GOLD_REWARDS.PIONEER })
      setGoldEarned(DISCOVERY_GOLD_REWARDS.PIONEER)
    } else if (prevTotal < DISCOVERY_THRESHOLDS.EXPLORER_MAX) {
      setDiscoveryReward({ status: "Explorer", gold: DISCOVERY_GOLD_REWARDS.EXPLORER })
      setGoldEarned(DISCOVERY_GOLD_REWARDS.EXPLORER)
    } else {
      setDiscoveryReward({ status: "Contributor", gold: DISCOVERY_GOLD_REWARDS.CONTRIBUTOR })
      setGoldEarned(DISCOVERY_GOLD_REWARDS.CONTRIBUTOR)
    }

    setShowCelebration(true)
    setTimeout(() => {
      setShowCelebration(false)
      setGoldEarned(null)
    }, CELEBRATION_DURATION)
  }, [])

  const handleClaimReward = useCallback(async (claimFn: (gold: number) => Promise<number>) => {
    if (!discoveryReward) return
    try {
      await claimFn(discoveryReward.gold)
      setRewardClaimed(true)
      logger.info("Discovery Gold claimed", { gold: discoveryReward.gold })
    } catch (error) {
      logger.error("Failed to claim reward", error)
    }
  }, [discoveryReward])

  const resetReward = useCallback(() => {
    setDiscoveryReward(null)
    setRewardClaimed(false)
  }, [])

  return {
    showCelebration,
    goldEarned,
    discoveryReward,
    rewardClaimed,
    calculateAndTriggerReward,
    handleClaimReward,
    resetReward
  }
}
