/**
 * useUserDiscoveryScore
 *
 * Computes discovery stats for any wallet address (read-only).
 * Same logic as DiscoveryScoreService but without singleton lifecycle,
 * Gold syncing, or chrome.storage coupling.
 *
 * Strategy: fetch user's certifications first, then fetch positions
 * only for those specific pages (bounded by user's activity, not network size).
 */

import { useState, useEffect, useRef, useCallback } from "react"

import {
  UserIntentionTriplesDocument,
  TriplePositionsByObjectsDocument,
  type UserIntentionTriplesQuery,
  type TriplePositionsByObjectsQuery
} from "@0xsofia/graphql"

import { intuitionGraphqlClient } from "~/lib/clients/graphql-client"
import { CERTIFICATION_PREDICATE_LABELS } from "~/lib/config/predicateConstants"
import {
  buildPagePositionMap,
  calculateDiscoveryRanking,
  calculateDiscoveryGold,
  buildDiscoveryStats,
  createHookLogger
} from "~/lib/utils"
import type { UserDiscoveryStats } from "~/types/discovery"

const logger = createHookLogger("useUserDiscoveryScore")

type UserTripleResult = UserIntentionTriplesQuery["triples"][number]
type PositionTripleResult =
  TriplePositionsByObjectsQuery["triples"][number]

export const useUserDiscoveryScore = (walletAddress?: string) => {
  const [stats, setStats] = useState<UserDiscoveryStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isFetchingRef = useRef(false)

  const fetchDiscoveryScore = useCallback(async () => {
    if (!walletAddress) return
    if (isFetchingRef.current) {
      logger.debug("Skipping fetch — already in progress")
      return
    }
    isFetchingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const userAddress = walletAddress.toLowerCase()

      // Step 1: Fetch user's certifications (small, bounded set)
      const userTriples =
        await intuitionGraphqlClient.fetchAllPages<UserTripleResult>(
          UserIntentionTriplesDocument,
          {
            predicateLabels: CERTIFICATION_PREDICATE_LABELS,
            userAddress
          },
          "triples",
          100,
          100
        )

      if (userTriples.length === 0) {
        setStats(
          buildDiscoveryStats(
            {
              pioneerCount: 0,
              explorerCount: 0,
              contributorCount: 0,
              totalCertifications: 0,
              intentionBreakdown: {
                for_work: 0,
                for_learning: 0,
                for_fun: 0,
                for_inspiration: 0,
                for_buying: 0,
                for_music: 0
              },
              trustBreakdown: { trusted: 0, distrusted: 0 }
            },
            { fromPioneer: 0, fromExplorer: 0, fromContributor: 0, total: 0 }
          )
        )
        return
      }

      // Step 2: Extract unique object term_ids from user's triples
      const objectTermIds = [
        ...new Set(
          userTriples
            .map((t) => t.object?.term_id)
            .filter((id): id is string => !!id)
        )
      ]

      // Step 3: Fetch positions only for those specific pages
      const positionTriples =
        await intuitionGraphqlClient.fetchAllPages<PositionTripleResult>(
          TriplePositionsByObjectsDocument,
          {
            predicateLabels: CERTIFICATION_PREDICATE_LABELS,
            objectTermIds
          },
          "triples",
          100,
          100
        )

      // Step 4: Calculate ranking from scoped data
      const pagePositionMap = buildPagePositionMap(positionTriples)
      const ranking = calculateDiscoveryRanking(
        userTriples,
        pagePositionMap
      )
      const gold = calculateDiscoveryGold(ranking)
      const discoveryStats = buildDiscoveryStats(ranking, gold)

      setStats(discoveryStats)
      logger.debug("Discovery score calculated", {
        userTriples: userTriples.length,
        scopedPages: objectTermIds.length,
        pioneer: ranking.pioneerCount,
        explorer: ranking.explorerCount,
        contributor: ranking.contributorCount
      })
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to fetch discovery score"
      logger.error("Failed to fetch discovery score", err)
      setError(msg)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [walletAddress])

  useEffect(() => {
    fetchDiscoveryScore()
  }, [fetchDiscoveryScore])

  return { stats, loading, error, refetch: fetchDiscoveryScore }
}
