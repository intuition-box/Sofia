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
import { PageCertificationDataDocument } from "@0xsofia/graphql"
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

/** Extract hostname from URL */
function getHostname(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return ""
  }
}

/** Match a triple's object URL against a target URL */
function tripleMatchesUrl(
  triple: { object?: { label?: string | null; value?: { thing?: { url?: string | null } | null } | null } | null },
  targetUrl: string
): boolean {
  const targetHostname = getHostname(targetUrl)
  if (!targetHostname) return false

  // Match by object URL (new atoms)
  const objectUrl = triple.object?.value?.thing?.url
  if (objectUrl) {
    return getHostname(objectUrl) === targetHostname &&
      objectUrl.replace(/\/$/, "") === targetUrl.replace(/\/$/, "")
  }

  // Match by object label (old atoms where label = URL)
  const label = triple.object?.label || ""
  if (label.startsWith("http")) {
    return getHostname(label) === targetHostname &&
      label.replace(/\/$/, "") === targetUrl.replace(/\/$/, "")
  }

  return false
}

/**
 * Fetch all triples for a hostname, then count unique holders
 * per specific URL (not the whole hostname).
 */
async function fetchCertCountsForUrls(
  hostname: string,
  urls: string[]
): Promise<Map<string, number>> {
  const urlCounts = new Map<string, number>()
  for (const url of urls) urlCounts.set(url, 0)

  try {
    const response = await intuitionGraphqlClient.request(
      PageCertificationDataDocument,
      {
        predicateIds: CERTIFICATION_PREDICATE_IDS,
        hostnameLike: `%${hostname}%`
      }
    )

    const triples = response?.triples || []

    // For each URL, count unique holders on triples matching that specific URL
    for (const url of urls) {
      const uniqueHolders = new Set<string>()

      for (const triple of triples) {
        if (!tripleMatchesUrl(triple, url)) continue

        for (const pos of (triple as any).positions || []) {
          const accountId = pos.account_id?.toLowerCase()
          if (accountId) {
            uniqueHolders.add(accountId)
          }
        }
      }

      urlCounts.set(url, uniqueHolders.size)
    }
  } catch (err) {
    logger.error("Failed to fetch cert counts", { hostname, error: err })
  }

  return urlCounts
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

      // Group items by hostname for batched queries
      const hostnameGroups = new Map<string, CartItemRecord[]>()
      for (const item of items) {
        const hostname = getHostname(item.url)
        if (!hostname) continue
        const group = hostnameGroups.get(hostname) || []
        group.push(item)
        hostnameGroups.set(hostname, group)
      }

      // Fetch per-URL counts (batched by hostname)
      const urlCounts = new Map<string, number>()
      for (const [hostname, groupItems] of hostnameGroups) {
        const urls = [...new Set(groupItems.map(i => i.url))]
        const counts = await fetchCertCountsForUrls(hostname, urls)
        for (const [url, count] of counts) {
          urlCounts.set(url, count)
        }
      }

      if (cancelled) return

      // Compute rewards per item (using per-URL counts)
      const rewardItems: BatchRewardItem[] = items.map(item => {
        const totalOnUrl = urlCounts.get(item.url) || 0
        // User just certified, so prevTotal = total - 1
        const prevTotal = Math.max(0, totalOnUrl - 1)
        const { tier, gold } = computeTier(prevTotal)

        return {
          item,
          tier,
          gold,
          rank: totalOnUrl
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
