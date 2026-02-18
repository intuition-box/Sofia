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
import { CertificationTriplesDocument } from '@0xsofia/graphql'

const logger = createHookLogger('usePageDiscovery')

// Predicate IDs for all certification types (intentions + trust/distrust)
const CERTIFICATION_PREDICATE_IDS = [
  PREDICATE_IDS.VISITS_FOR_WORK,
  PREDICATE_IDS.VISITS_FOR_LEARNING,
  PREDICATE_IDS.VISITS_FOR_FUN,
  PREDICATE_IDS.VISITS_FOR_INSPIRATION,
  PREDICATE_IDS.VISITS_FOR_BUYING,
  PREDICATE_IDS.VISITS_FOR_MUSIC,
  PREDICATE_IDS.TRUSTS,
  PREDICATE_IDS.DISTRUST
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
    if (!pageUrl || CERTIFICATION_PREDICATE_IDS.length === 0) {
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
      const hostname = new URL(pageUrl).hostname.toLowerCase().replace(/^www\./, '')

      logger.debug('Fetching discovery status', { pageUrl, hostname, walletAddress })
      console.log('🔍 [usePageDiscovery] Query params:', {
        predicateIds: CERTIFICATION_PREDICATE_IDS,
        hostnameLike: `%${hostname}%`,
        predicateCount: CERTIFICATION_PREDICATE_IDS.length
      })

      // Query to find all certification triples for this page via POSITIONS
      // Using document from @0xsofia/graphql
      const response = await intuitionGraphqlClient.request(CertificationTriplesDocument, {
        predicateIds: CERTIFICATION_PREDICATE_IDS,
        hostnameLike: `%${hostname}%`
      })

      const triples = response?.triples || []

      console.log('🔍 [usePageDiscovery] Found triples:', triples.length, triples)
      logger.debug('Found certification triples', { count: triples.length })

      // Count unique position holders (each person counts once, even if they certified multiple types)
      // Use created_at to determine order (who arrived first = Pioneer)
      const uniqueHolders = new Map<string, string>() // account_id -> first created_at

      for (const triple of triples) {
        for (const pos of triple.positions || []) {
          const accountId = pos.account_id?.toLowerCase()
          const createdAt = pos.created_at
          if (accountId && createdAt) {
            // Only keep the earliest created_at for each account
            if (!uniqueHolders.has(accountId) || createdAt < uniqueHolders.get(accountId)!) {
              uniqueHolders.set(accountId, createdAt)
            }
          }
        }
      }

      // Sort holders by created_at to get the order
      const sortedHolders = Array.from(uniqueHolders.entries())
        .sort((a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime())
        .map(([accountId]) => accountId)

      const total = sortedHolders.length
      console.log('🔍 [usePageDiscovery] Unique holders:', total, 'sortedHolders:', sortedHolders)
      setTotalCertifications(total)

      // Check if current user has certified (use _ilike matching for checksummed addresses)
      const userAddress = walletAddress?.toLowerCase()
      const userRank = userAddress
        ? sortedHolders.indexOf(userAddress) + 1
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
      console.error('❌ [usePageDiscovery] CERTIFICATION_PREDICATE_IDS:', CERTIFICATION_PREDICATE_IDS)
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
