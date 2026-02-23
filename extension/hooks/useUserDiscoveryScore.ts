/**
 * useUserDiscoveryScore
 *
 * Computes discovery stats for any wallet address (read-only).
 * Same logic as DiscoveryScoreService but without singleton lifecycle,
 * Gold syncing, or chrome.storage coupling.
 */

import { useState, useEffect, useRef, useCallback } from "react"

import {
  UserIntentionTriplesDocument,
  AllIntentionTriplesDocument,
  type UserIntentionTriplesQuery,
  type AllIntentionTriplesQuery
} from "@0xsofia/graphql"

import { intuitionGraphqlClient } from "../lib/clients/graphql-client"
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
type AllTripleResult = AllIntentionTriplesQuery["triples"][number]

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

      const [userTriples, allTriples] = await Promise.all([
        intuitionGraphqlClient.fetchAllPages<UserTripleResult>(
          UserIntentionTriplesDocument,
          { predicateLabels: CERTIFICATION_PREDICATE_LABELS, userAddress },
          "triples",
          100,
          100
        ),
        intuitionGraphqlClient.fetchAllPages<AllTripleResult>(
          AllIntentionTriplesDocument,
          { predicateLabels: CERTIFICATION_PREDICATE_LABELS },
          "triples",
          100,
          100
        )
      ])

      const pagePositionMap = buildPagePositionMap(allTriples)
      const ranking = calculateDiscoveryRanking(userTriples, pagePositionMap, userAddress)
      const gold = calculateDiscoveryGold(ranking)
      const discoveryStats = buildDiscoveryStats(ranking, gold)

      setStats(discoveryStats)
      logger.debug("Discovery score calculated", {
        pioneer: ranking.pioneerCount,
        explorer: ranking.explorerCount,
        contributor: ranking.contributorCount
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch discovery score"
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
