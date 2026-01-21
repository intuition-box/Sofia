/**
 * useDiscoveryScore Hook
 * Calculates user's discovery XP based on their Pioneer/Explorer/Contributor certifications
 *
 * XP Rewards:
 * - Pioneer (1st): +50 XP
 * - Explorer (2-10th): +20 XP
 * - Contributor (11+): +5 XP
 */

import { useState, useCallback, useEffect } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import type { IntentionPurpose, UserDiscoveryStats } from '../types/discovery'
import { DISCOVERY_XP_REWARDS } from '../types/discovery'
import { createHookLogger } from '../lib/utils/logger'

const logger = createHookLogger('useDiscoveryScore')

// Predicate labels for intention types - used for GraphQL query by label
// NOTE: 'visits for learning ' has a trailing space due to a bug in atom creation
const INTENTION_PREDICATE_LABELS = [
  'visits for work',
  'visits for learning ',  // trailing space (official atom)
  'visits for fun',
  'visits for inspiration',
  'visits for buying'
]

// Map predicate labels to intention purposes
const PREDICATE_LABEL_TO_INTENTION: Record<string, IntentionPurpose> = {
  'visits for work': 'for_work',
  'visits for learning ': 'for_learning',  // trailing space (official atom)
  'visits for fun': 'for_fun',
  'visits for inspiration': 'for_inspiration',
  'visits for buying': 'for_buying'
}

export interface DiscoveryScoreResult {
  stats: UserDiscoveryStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  claimedDiscoveryXP: number
  claimDiscoveryXP: (xpAmount: number) => Promise<number>
}

export const useDiscoveryScore = (): DiscoveryScoreResult => {
  const { walletAddress } = useWalletFromStorage()
  const [stats, setStats] = useState<UserDiscoveryStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [claimedDiscoveryXP, setClaimedDiscoveryXP] = useState<number>(0)

  // Load claimed discovery XP from storage on mount
  useEffect(() => {
    const loadClaimedXP = async () => {
      try {
        const result = await chrome.storage.local.get(['claimed_discovery_xp'])
        const xp = result.claimed_discovery_xp || 0
        setClaimedDiscoveryXP(xp)
        logger.debug('Loaded claimed discovery XP from storage', { xp })
      } catch (err) {
        logger.error('Failed to load claimed discovery XP', err)
      }
    }
    loadClaimedXP()
  }, [])

  // Function to claim XP for a specific discovery
  const claimDiscoveryXP = useCallback(async (xpAmount: number): Promise<number> => {
    const newTotal = claimedDiscoveryXP + xpAmount
    await chrome.storage.local.set({ claimed_discovery_xp: newTotal })
    setClaimedDiscoveryXP(newTotal)
    logger.info('Claimed discovery XP', { xpAmount, newTotal })
    return newTotal
  }, [claimedDiscoveryXP])

  const fetchDiscoveryScore = useCallback(async () => {
    console.log('🔍 [useDiscoveryScore] Starting fetch with:', {
      walletAddress,
      predicateLabels: INTENTION_PREDICATE_LABELS
    })

    if (!walletAddress) {
      console.log('🔍 [useDiscoveryScore] Skipping - no wallet')
      setStats(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userAddress = walletAddress.toLowerCase()

      logger.debug('Fetching discovery score', { userAddress })

      // PAGINATED QUERIES - fetch all user triples and all triples for rank calculation
      // Query 1: Get user's intention triples via positions
      const userTriplesQuery = `
        query UserIntentionTriples($predicateLabels: [String!]!, $userAddress: String!, $limit: Int!, $offset: Int!) {
          triples(
            where: {
              predicate: { label: { _in: $predicateLabels } }
              positions: {
                account_id: { _ilike: $userAddress }
                shares: { _gt: "0" }
              }
            }
            limit: $limit
            offset: $offset
          ) {
            term_id
            predicate {
              label
            }
            object {
              term_id
              label
            }
            positions(where: {
              account_id: { _ilike: $userAddress }
              shares: { _gt: "0" }
            }) {
              account_id
              created_at
              shares
            }
          }
        }
      `

      // Query 2: Get ALL intention triples with positions for rank calculation
      const allTriplesQuery = `
        query AllIntentionTriples($predicateLabels: [String!]!, $limit: Int!, $offset: Int!) {
          triples(
            where: {
              predicate: { label: { _in: $predicateLabels } }
              positions: { shares: { _gt: "0" } }
            }
            limit: $limit
            offset: $offset
          ) {
            term_id
            predicate {
              label
            }
            object {
              term_id
            }
            positions(
              where: { shares: { _gt: "0" } }
              order_by: { created_at: asc }
            ) {
              account_id
              created_at
            }
          }
        }
      `

      // Types for the query results
      interface UserTripleResult {
        term_id: string
        predicate: { label: string }
        object: { term_id: string; label: string }
        positions: Array<{ account_id: string; created_at: string; shares: string }>
      }

      interface AllTripleResult {
        term_id: string
        predicate: { label: string }
        object: { term_id: string }
        positions: Array<{ account_id: string; created_at: string }>
      }

      // Fetch both in parallel with pagination
      const [userTriples, allTriples] = await Promise.all([
        intuitionGraphqlClient.fetchAllPages<UserTripleResult>(
          userTriplesQuery,
          { predicateLabels: INTENTION_PREDICATE_LABELS, userAddress },
          'triples',
          100,
          100
        ),
        intuitionGraphqlClient.fetchAllPages<AllTripleResult>(
          allTriplesQuery,
          { predicateLabels: INTENTION_PREDICATE_LABELS },
          'triples',
          100,
          100
        )
      ])

      console.log('🔍 [useDiscoveryScore] Paginated results:', { userTriples: userTriples.length, allTriples: allTriples.length })

      // Debug: show all predicate labels found vs what we're looking for
      const foundPredicateLabels = new Set<string>()
      for (const triple of allTriples) {
        if (triple.predicate?.label) foundPredicateLabels.add(triple.predicate.label)
      }
      console.log('🔍 [useDiscoveryScore] Predicate labels we search for:', INTENTION_PREDICATE_LABELS)
      console.log('🔍 [useDiscoveryScore] Predicate labels found in results:', Array.from(foundPredicateLabels))

      // Debug: show all account_ids in positions to compare with userAddress
      const allAccountIds = new Set<string>()
      for (const triple of allTriples) {
        for (const pos of triple.positions || []) {
          if (pos.account_id) allAccountIds.add(pos.account_id)
        }
      }
      console.log('🔍 [useDiscoveryScore] All position account_ids:', Array.from(allAccountIds))
      console.log('🔍 [useDiscoveryScore] Looking for userAddress:', userAddress)

      console.log('🔍 [useDiscoveryScore] Found triples:', {
        userTriples: userTriples.length,
        allTriples: allTriples.length,
        userTriplesData: userTriples
      })

      logger.debug('Found triples', {
        userTriples: userTriples.length,
        allTriples: allTriples.length
      })

      // Build a map of pages -> ordered list of unique position holders (by created_at)
      // We track: objectId -> [{ accountId, createdAt }]
      const pagePositionMap = new Map<string, { accountId: string; createdAt: string }[]>()

      for (const triple of allTriples) {
        const objectId = triple.object?.term_id
        const positions = triple.positions || []

        if (!objectId) continue

        if (!pagePositionMap.has(objectId)) {
          pagePositionMap.set(objectId, [])
        }

        const pagePositions = pagePositionMap.get(objectId)!

        // Add each position holder (already sorted by created_at from GraphQL)
        for (const pos of positions) {
          const accountId = pos.account_id?.toLowerCase()
          const createdAt = pos.created_at
          // Only add if not already present (first position wins for same user)
          if (accountId && createdAt && !pagePositions.some(p => p.accountId === accountId)) {
            pagePositions.push({ accountId, createdAt })
          }
        }
      }

      // Positions are already sorted by created_at from GraphQL, but ensure sort
      for (const [, positions] of pagePositionMap) {
        positions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      }

      // Calculate user's status on each page they certified
      let pioneerCount = 0
      let explorerCount = 0
      let contributorCount = 0
      const intentionBreakdown: Record<IntentionPurpose, number> = {
        for_work: 0,
        for_learning: 0,
        for_fun: 0,
        for_inspiration: 0,
        for_buying: 0
      }

      // Track unique pages (user might have multiple intentions on same page)
      const processedPages = new Set<string>()

      for (const triple of userTriples) {
        const objectId = triple.object?.term_id
        const predicateLabel = triple.predicate?.label?.toLowerCase()

        if (!objectId) continue

        // Count intention type using label
        const intentionPurpose = predicateLabel ? PREDICATE_LABEL_TO_INTENTION[predicateLabel] : null
        if (intentionPurpose) {
          intentionBreakdown[intentionPurpose]++
        }

        // Only count discovery status once per page
        if (processedPages.has(objectId)) continue
        processedPages.add(objectId)

        // Get user's rank on this page (based on position order)
        const pagePositions = pagePositionMap.get(objectId) || []
        const userRank = pagePositions.findIndex(p => p.accountId === userAddress) + 1

        if (userRank === 1) {
          pioneerCount++
        } else if (userRank <= 10) {
          explorerCount++
        } else if (userRank > 0) {
          contributorCount++
        }
      }

      // Calculate XP
      const xpFromPioneer = pioneerCount * DISCOVERY_XP_REWARDS.PIONEER
      const xpFromExplorer = explorerCount * DISCOVERY_XP_REWARDS.EXPLORER
      const xpFromContributor = contributorCount * DISCOVERY_XP_REWARDS.CONTRIBUTOR

      const discoveryStats: UserDiscoveryStats = {
        pioneerCount,
        explorerCount,
        contributorCount,
        totalCertifications: processedPages.size,
        intentionBreakdown,
        discoveryXP: {
          fromPioneer: xpFromPioneer,
          fromExplorer: xpFromExplorer,
          fromContributor: xpFromContributor,
          total: xpFromPioneer + xpFromExplorer + xpFromContributor
        }
      }

      setStats(discoveryStats)

      logger.info('Discovery score calculated', {
        pioneerCount,
        explorerCount,
        contributorCount,
        totalXP: discoveryStats.discoveryXP.total
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch discovery score'
      logger.error('Failed to fetch discovery score', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  // Fetch on mount and when wallet changes
  useEffect(() => {
    fetchDiscoveryScore()
  }, [fetchDiscoveryScore])

  return {
    stats,
    loading,
    error,
    refetch: fetchDiscoveryScore,
    claimedDiscoveryXP,
    claimDiscoveryXP
  }
}
