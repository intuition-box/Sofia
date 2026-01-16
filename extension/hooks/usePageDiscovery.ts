/**
 * usePageDiscovery Hook
 * Determines user's discovery status (Pioneer/Explorer/Contributor) for a page
 * Based on the order of intention certifications
 */

import { useState, useCallback, useEffect } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { PREDICATE_IDS } from '../lib/config/chainConfig'
import type { DiscoveryStatus } from '../types/discovery'
import { createHookLogger } from '../lib/utils/logger'

const logger = createHookLogger('usePageDiscovery')

// Predicate IDs for all intention types
const INTENTION_PREDICATE_IDS = [
  PREDICATE_IDS.VISITS_FOR_WORK,
  PREDICATE_IDS.VISITS_FOR_LEARNING,
  PREDICATE_IDS.VISITS_FOR_FUN,
  PREDICATE_IDS.VISITS_FOR_INSPIRATION,
  PREDICATE_IDS.VISITS_FOR_BUYING
].filter(id => id) // Filter out empty strings (dev config)

export interface PageDiscoveryResult {
  discoveryStatus: DiscoveryStatus
  certificationRank: number | null // User's rank (1 = Pioneer, 2-10 = Explorer, 11+ = Contributor)
  totalCertifications: number // Total number of certifications on this page
  userHasCertified: boolean // Whether current user has certified this page
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const usePageDiscovery = (pageUrl: string | null): PageDiscoveryResult => {
  const { walletAddress } = useWalletFromStorage()
  const [discoveryStatus, setDiscoveryStatus] = useState<DiscoveryStatus>(null)
  const [certificationRank, setCertificationRank] = useState<number | null>(null)
  const [totalCertifications, setTotalCertifications] = useState(0)
  const [userHasCertified, setUserHasCertified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDiscoveryStatus = useCallback(async () => {
    if (!pageUrl || INTENTION_PREDICATE_IDS.length === 0) {
      setDiscoveryStatus(null)
      setCertificationRank(null)
      setTotalCertifications(0)
      setUserHasCertified(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Extract hostname for matching
      const hostname = new URL(pageUrl).hostname

      logger.debug('Fetching discovery status', { pageUrl, hostname, walletAddress })
      console.log('🔍 [usePageDiscovery] Query params:', {
        predicateIds: INTENTION_PREDICATE_IDS,
        hostnameLike: `%${hostname}%`,
        predicateCount: INTENTION_PREDICATE_IDS.length
      })

      // Query to find all intention triples for this page
      // We look for triples where:
      // - predicate is one of the intention predicates
      // - object atom label contains the hostname
      const query = `
        query IntentionTriples($predicateIds: [String!]!, $hostnameLike: String!) {
          triples(
            where: {
              predicate_id: { _in: $predicateIds }
              object: { label: { _ilike: $hostnameLike } }
            }
            order_by: { block_number: asc }
          ) {
            term_id
            subject {
              label
            }
            predicate {
              label
            }
            object {
              label
            }
            creator_id
            block_number
          }
        }
      `

      const response = await intuitionGraphqlClient.request(query, {
        predicateIds: INTENTION_PREDICATE_IDS,
        hostnameLike: `%${hostname}%`
      })

      const triples = response?.triples || []

      logger.debug('Found intention triples', { count: triples.length })

      // Count unique creators (each person counts once, even if they certified multiple intentions)
      const uniqueCreators = new Map<string, number>() // creator_id -> first block_number

      for (const triple of triples) {
        const creatorId = triple.creator_id?.toLowerCase()
        if (creatorId && !uniqueCreators.has(creatorId)) {
          uniqueCreators.set(creatorId, triple.block_number)
        }
      }

      // Sort creators by block number to get the order
      const sortedCreators = Array.from(uniqueCreators.entries())
        .sort((a, b) => a[1] - b[1])
        .map(([creatorId]) => creatorId)

      const total = sortedCreators.length
      setTotalCertifications(total)

      // Check if current user has certified
      const userAddress = walletAddress?.toLowerCase()
      const userRank = userAddress
        ? sortedCreators.indexOf(userAddress) + 1
        : 0

      if (userRank > 0) {
        setUserHasCertified(true)
        setCertificationRank(userRank)

        // Determine status based on rank
        if (userRank === 1) {
          setDiscoveryStatus('Pioneer')
        } else if (userRank <= 10) {
          setDiscoveryStatus('Explorer')
        } else {
          setDiscoveryStatus('Contributor')
        }

        logger.info('User discovery status', {
          userRank,
          status: userRank === 1 ? 'Pioneer' : userRank <= 10 ? 'Explorer' : 'Contributor',
          totalCertifications: total
        })
      } else {
        setUserHasCertified(false)
        setCertificationRank(null)
        setDiscoveryStatus(null)

        logger.debug('User has not certified this page', { totalCertifications: total })
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch discovery status'
      logger.error('Failed to fetch discovery status', err)
      console.error('❌ [usePageDiscovery] Full error:', err)
      console.error('❌ [usePageDiscovery] INTENTION_PREDICATE_IDS:', INTENTION_PREDICATE_IDS)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [pageUrl, walletAddress])

  // Fetch on mount and when URL/wallet changes
  useEffect(() => {
    fetchDiscoveryStatus()
  }, [fetchDiscoveryStatus])

  return {
    discoveryStatus,
    certificationRank,
    totalCertifications,
    userHasCertified,
    loading,
    error,
    refetch: fetchDiscoveryStatus
  }
}
