/**
 * useBatchRewards Hook
 * Fetches per-page certification counts after batch TX,
 * computes reward tiers, and manages bulk gold claiming.
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { intuitionGraphqlClient } from "../lib/clients/graphql-client"
import { discoveryScoreService } from "~/lib/services"
import { PREDICATE_IDS } from "../lib/config/chainConfig"
import { createHookLogger } from "~/lib/utils"
import { DISCOVERY_GOLD_REWARDS, DISCOVERY_THRESHOLDS } from "~/types/discovery"
import { CertificationTriplesDocument } from "@0xsofia/graphql"
import type { CartItemRecord } from "~/lib/database"

const logger = createHookLogger("useBatchRewards")

const INDEXER_DELAY = 3000

const CERTIFICATION_PREDICATE_IDS = [
  PREDICATE_IDS.VISITS_FOR_WORK,
  PREDICATE_IDS.VISITS_FOR_LEARNING,
  PREDICATE_IDS.VISITS_FOR_FUN,
  PREDICATE_IDS.VISITS_FOR_INSPIRATION,
  PREDICATE_IDS.VISITS_FOR_BUYING,
  PREDICATE_IDS.VISITS_FOR_MUSIC,
  PREDICATE_IDS.TRUSTS,
  PREDICATE_IDS.DISTRUST
].filter(id => id)

export interface BatchRewardItem {
  item: CartItemRecord
  tier: "Pioneer" | "Explorer" | "Contributor"
  gold: number
  rank: number
}

function computeTier(prevTotal: number): {
  tier: "Pioneer" | "Explorer" | "Contributor"
  gold: number
} {
  if (prevTotal === 0) {
    return { tier: "Pioneer", gold: DISCOVERY_GOLD_REWARDS.PIONEER }
  } else if (prevTotal < DISCOVERY_THRESHOLDS.EXPLORER_MAX) {
    return { tier: "Explorer", gold: DISCOVERY_GOLD_REWARDS.EXPLORER }
  }
  return { tier: "Contributor", gold: DISCOVERY_GOLD_REWARDS.CONTRIBUTOR }
}

async function fetchCertCountForHostname(
  hostname: string
): Promise<number> {
  try {
    const response = await intuitionGraphqlClient.request(
      CertificationTriplesDocument,
      {
        predicateIds: CERTIFICATION_PREDICATE_IDS,
        hostnameLike: `%${hostname}%`
      }
    )

    const triples = response?.triples || []
    const uniqueHolders = new Set<string>()

    for (const triple of triples) {
      for (const pos of (triple as any).positions || []) {
        const accountId = pos.account_id?.toLowerCase()
        if (accountId) {
          uniqueHolders.add(accountId)
        }
      }
    }

    return uniqueHolders.size
  } catch (err) {
    logger.error("Failed to fetch cert count", { hostname, error: err })
    return 0
  }
}

export const useBatchRewards = (
  items: CartItemRecord[],
  txSuccess: boolean
) => {
  const [rewards, setRewards] = useState<BatchRewardItem[]>([])
  const [loading, setLoading] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [totalGoldInBatch, setTotalGoldInBatch] = useState(0)
  const fetchedRef = useRef(false)

  // Fetch cert counts and compute rewards when TX succeeds
  useEffect(() => {
    if (!txSuccess || items.length === 0 || fetchedRef.current) return
    fetchedRef.current = true

    let cancelled = false

    const compute = async () => {
      setLoading(true)

      // Wait for indexer to process the batch TX
      await new Promise(resolve => setTimeout(resolve, INDEXER_DELAY))
      if (cancelled) return

      // Get unique hostnames
      const hostnameMap = new Map<string, number>()
      for (const item of items) {
        try {
          const hostname = new URL(item.url)
            .hostname.toLowerCase()
            .replace(/^www\./, "")
          if (!hostnameMap.has(hostname)) {
            hostnameMap.set(hostname, 0)
          }
        } catch {
          // Invalid URL, skip
        }
      }

      // Fetch cert counts in parallel
      const hostnames = Array.from(hostnameMap.keys())
      const counts = await Promise.all(
        hostnames.map(h => fetchCertCountForHostname(h))
      )
      for (let i = 0; i < hostnames.length; i++) {
        hostnameMap.set(hostnames[i], counts[i])
      }

      if (cancelled) return

      // Compute rewards per item
      const rewardItems: BatchRewardItem[] = items.map(item => {
        let hostname = ""
        try {
          hostname = new URL(item.url)
            .hostname.toLowerCase()
            .replace(/^www\./, "")
        } catch {
          // fallback
        }

        const totalOnPage = hostnameMap.get(hostname) || 0
        // User just certified, so prevTotal = total - 1
        const prevTotal = Math.max(0, totalOnPage - 1)
        const { tier, gold } = computeTier(prevTotal)

        return {
          item,
          tier,
          gold,
          rank: totalOnPage
        }
      })

      const batchTotal = rewardItems.reduce((sum, r) => sum + r.gold, 0)
      setRewards(rewardItems)
      setTotalGoldInBatch(batchTotal)
      setLoading(false)

      logger.info("Batch rewards computed", {
        count: rewardItems.length,
        totalGold: batchTotal
      })
    }

    compute()
    return () => { cancelled = true }
  }, [txSuccess, items])

  // Claim all rewards at once
  const claimAll = useCallback(async () => {
    if (claimed || rewards.length === 0) return

    try {
      await discoveryScoreService.claimGold(totalGoldInBatch)
      setClaimed(true)
      logger.info("All rewards claimed", {
        count: rewards.length,
        totalGold: totalGoldInBatch
      })
    } catch (err) {
      logger.error("Failed to claim all rewards", { error: err })
    }
  }, [rewards, claimed, totalGoldInBatch])

  // Reset state
  const reset = useCallback(() => {
    setRewards([])
    setClaimed(false)
    setTotalGoldInBatch(0)
    setLoading(false)
    fetchedRef.current = false
  }, [])

  return {
    rewards,
    loading,
    claimed,
    totalGoldInBatch,
    claimAll,
    reset
  }
}
