/**
 * useOnChainStreak
 * Fetches streak count + activity dates for the current user from on-chain
 * deposit data (same source as LeaderboardTab).
 */

import { useState, useEffect, useCallback } from "react"
import {
  type GetProxyDepositDaysQuery,
  GetProxyDepositDaysDocument
} from "@0xsofia/graphql"
import { intuitionGraphqlClient } from "../lib/clients/graphql-client"
import { SOFIA_PROXY_ADDRESS } from "../lib/config/chainConfig"
import { calculateStreaks, extractUserActivityDates } from "../lib/utils"
import { createHookLogger } from "../lib/utils/logger"

const logger = createHookLogger("useOnChainStreak")

export interface OnChainStreakResult {
  streak: number
  activityDates: string[]
  loading: boolean
}

export const useOnChainStreak = (
  atomId: string,
  walletAddress?: string | null
): OnChainStreakResult => {
  const [streak, setStreak] = useState(0)
  const [activityDates, setActivityDates] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchStreak = useCallback(async () => {
    if (!atomId || !walletAddress || !SOFIA_PROXY_ADDRESS) {
      setStreak(0)
      setActivityDates([])
      return
    }

    setLoading(true)
    try {
      const response = await intuitionGraphqlClient.request(
        GetProxyDepositDaysDocument,
        { senderId: SOFIA_PROXY_ADDRESS, termId: atomId }
      ) as GetProxyDepositDaysQuery

      const deposits = response.deposits || []

      // Extract activity dates for this user
      const dates = extractUserActivityDates(deposits, walletAddress)
      setActivityDates([...dates].sort())

      // Calculate streak from all deposits (reuse leaderboard logic)
      const streakMap = calculateStreaks(deposits)
      const userStreak = streakMap.get(walletAddress.toLowerCase()) || 0
      setStreak(userStreak)

      logger.debug("On-chain streak fetched", {
        streak: userStreak,
        dates: dates.size
      })
    } catch (err) {
      logger.error("Failed to fetch on-chain streak", err)
      setStreak(0)
      setActivityDates([])
    } finally {
      setLoading(false)
    }
  }, [atomId, walletAddress])

  useEffect(() => {
    fetchStreak()
  }, [fetchStreak])

  return { streak, activityDates, loading }
}
