/**
 * usePageIntentionStats Hook
 * Fetches intention statistics for a specific page from Intuition
 * Shows breakdown of intentions (work, learning, fun, inspiration, buying)
 * Computes both domain-level and page-level stats for toggle filtering
 */

import { useState, useCallback, useEffect } from "react"
import { intuitionGraphqlClient } from "~/lib/clients/graphql-client"
import type { IntentionPurpose } from "~/types/discovery"
import {
  INTENTION_PREDICATE_IDS,
  PREDICATE_ID_TO_INTENTION
} from "~/lib/config/predicateConstants"
import { createHookLogger } from "~/lib/utils"
import { IntentionStatsDocument } from "@0xsofia/graphql"

const logger = createHookLogger("usePageIntentionStats")

const EMPTY_INTENTIONS: Record<IntentionPurpose, number> = {
  for_work: 0,
  for_learning: 0,
  for_fun: 0,
  for_inspiration: 0,
  for_buying: 0,
  for_music: 0
}

export interface PageIntentionStats {
  intentions: Record<IntentionPurpose, number>
  pageIntentions: Record<IntentionPurpose, number>
  totalCertifications: number
  pageTotalCertifications: number
  maxIntentionCount: number
  pageMaxIntentionCount: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const usePageIntentionStats = (
  pageUrl: string | null,
  pageAtomIds?: string[]
): PageIntentionStats => {
  const [intentions, setIntentions] =
    useState<Record<IntentionPurpose, number>>(EMPTY_INTENTIONS)
  const [pageIntentions, setPageIntentions] =
    useState<Record<IntentionPurpose, number>>(EMPTY_INTENTIONS)
  const [totalCertifications, setTotalCertifications] = useState(0)
  const [pageTotalCertifications, setPageTotalCertifications] = useState(0)
  const [maxIntentionCount, setMaxIntentionCount] = useState(0)
  const [pageMaxIntentionCount, setPageMaxIntentionCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchIntentionStats = useCallback(async () => {
    if (!pageUrl || INTENTION_PREDICATE_IDS.length === 0) {
      setIntentions(EMPTY_INTENTIONS)
      setPageIntentions(EMPTY_INTENTIONS)
      setTotalCertifications(0)
      setPageTotalCertifications(0)
      setMaxIntentionCount(0)
      setPageMaxIntentionCount(0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const hostname = new URL(pageUrl).hostname

      logger.debug("Fetching intention stats", { pageUrl, hostname })

      const response = await intuitionGraphqlClient.request(
        IntentionStatsDocument,
        {
          predicateIds: INTENTION_PREDICATE_IDS,
          hostnameLike: `%${hostname}%`
        }
      )

      const triples = response?.triples || []

      logger.debug("Found intention triples for stats", {
        count: triples.length
      })

      // Two sets of counters: domain (all triples) and page (filtered by atom)
      const pageAtomSet = new Set(pageAtomIds || [])

      const domainCounts: Record<IntentionPurpose, Set<string>> = {
        for_work: new Set(),
        for_learning: new Set(),
        for_fun: new Set(),
        for_inspiration: new Set(),
        for_buying: new Set(),
        for_music: new Set()
      }

      const pageCounts: Record<IntentionPurpose, Set<string>> = {
        for_work: new Set(),
        for_learning: new Set(),
        for_fun: new Set(),
        for_inspiration: new Set(),
        for_buying: new Set(),
        for_music: new Set()
      }

      for (const triple of triples) {
        const predicateId = triple.predicate_id
        const intentionPurpose = PREDICATE_ID_TO_INTENTION[predicateId]

        if (intentionPurpose && triple.positions) {
          const isPageTriple =
            pageAtomSet.size > 0 &&
            pageAtomSet.has(triple.object?.term_id)

          for (const position of triple.positions) {
            const accountId = position.account_id?.toLowerCase()
            if (!accountId) continue

            domainCounts[intentionPurpose].add(accountId)
            if (isPageTriple) {
              pageCounts[intentionPurpose].add(accountId)
            }
          }
        }
      }

      // Convert sets to counts
      const domainResult: Record<IntentionPurpose, number> = {
        for_work: domainCounts.for_work.size,
        for_learning: domainCounts.for_learning.size,
        for_fun: domainCounts.for_fun.size,
        for_inspiration: domainCounts.for_inspiration.size,
        for_buying: domainCounts.for_buying.size,
        for_music: domainCounts.for_music.size
      }

      const pageResult: Record<IntentionPurpose, number> = {
        for_work: pageCounts.for_work.size,
        for_learning: pageCounts.for_learning.size,
        for_fun: pageCounts.for_fun.size,
        for_inspiration: pageCounts.for_inspiration.size,
        for_buying: pageCounts.for_buying.size,
        for_music: pageCounts.for_music.size
      }

      const domainTotal = Object.values(domainResult).reduce(
        (sum, count) => sum + count,
        0
      )
      const domainMax = Math.max(...Object.values(domainResult), 1)

      const pageTotal = Object.values(pageResult).reduce(
        (sum, count) => sum + count,
        0
      )
      const pageMax = Math.max(...Object.values(pageResult), 1)

      setIntentions(domainResult)
      setPageIntentions(pageResult)
      setTotalCertifications(domainTotal)
      setPageTotalCertifications(pageTotal)
      setMaxIntentionCount(domainMax)
      setPageMaxIntentionCount(pageMax)

      logger.info("Intention stats calculated", {
        domain: domainTotal,
        page: pageTotal
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch intention stats"
      logger.error("Failed to fetch intention stats", err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [pageUrl, pageAtomIds])

  useEffect(() => {
    fetchIntentionStats()
  }, [fetchIntentionStats])

  return {
    intentions,
    pageIntentions,
    totalCertifications,
    pageTotalCertifications,
    maxIntentionCount,
    pageMaxIntentionCount,
    loading,
    error,
    refetch: fetchIntentionStats
  }
}
