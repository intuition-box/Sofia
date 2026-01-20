/**
 * useGroupOnChainCertifications Hook
 * Fetches on-chain certification status for all URLs in an intention group
 * Determines which URLs the user has already certified on-chain
 */

import { useState, useCallback, useEffect } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'
import { intuitionGraphqlClient } from '../lib/clients/graphql-client'
import { PREDICATE_IDS } from '../lib/config/chainConfig'
import type { IntentionPurpose } from '../types/discovery'
import { createHookLogger } from '../lib/utils/logger'

const logger = createHookLogger('useGroupOnChainCertifications')

// Predicate IDs for intention certifications
const INTENTION_PREDICATE_IDS = [
  PREDICATE_IDS.VISITS_FOR_WORK,
  PREDICATE_IDS.VISITS_FOR_LEARNING,
  PREDICATE_IDS.VISITS_FOR_FUN,
  PREDICATE_IDS.VISITS_FOR_INSPIRATION,
  PREDICATE_IDS.VISITS_FOR_BUYING
].filter(id => id) // Filter out empty strings

// Map predicate IDs to intention types
const PREDICATE_TO_INTENTION: Record<string, IntentionPurpose> = {
  [PREDICATE_IDS.VISITS_FOR_WORK]: 'for_work',
  [PREDICATE_IDS.VISITS_FOR_LEARNING]: 'for_learning',
  [PREDICATE_IDS.VISITS_FOR_FUN]: 'for_fun',
  [PREDICATE_IDS.VISITS_FOR_INSPIRATION]: 'for_inspiration',
  [PREDICATE_IDS.VISITS_FOR_BUYING]: 'for_buying'
}

// Map IntentionPurpose to CertificationType (for local DB sync)
const intentionToCertification: Record<IntentionPurpose, string> = {
  for_work: 'work',
  for_learning: 'learning',
  for_fun: 'fun',
  for_inspiration: 'inspiration',
  for_buying: 'buying'
}

export interface UrlCertificationStatus {
  url: string
  isCertifiedOnChain: boolean
  intention?: IntentionPurpose
  certificationLabel?: string // 'work', 'learning', etc.
}

export interface GroupCertificationStats {
  certifiedCount: number      // URLs certified by user on-chain
  totalUrls: number           // Total active URLs in group
  certifiedUrls: Map<string, UrlCertificationStatus> // URL -> status
  xpEarned: number           // XP already earned (certifiedCount * 10)
  xpToNextLevel: number      // XP needed for next level
  currentLevel: number       // Current level based on certifications
  progressPercent: number    // Progress toward next level (0-100)
}

// Level thresholds (certifications needed per level)
const LEVEL_THRESHOLDS = [0, 3, 7, 12, 18, 25, 33, 42, 52, 63, 75] // Level 1 starts at 0

/**
 * Calculate level and progress from certification count
 */
function calculateLevelProgress(certifiedCount: number): { level: number; xpToNext: number; progress: number } {
  let level = 1
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (certifiedCount >= LEVEL_THRESHOLDS[i]) {
      level = i + 1
    } else {
      break
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 10
  const xpToNext = nextThreshold - certifiedCount
  const progress = ((certifiedCount - currentThreshold) / (nextThreshold - currentThreshold)) * 100

  return { level, xpToNext: Math.max(0, xpToNext), progress: Math.min(100, Math.max(0, progress)) }
}

export interface UseGroupOnChainCertificationsResult {
  stats: GroupCertificationStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  isUrlCertified: (url: string) => boolean
  getUrlCertification: (url: string) => UrlCertificationStatus | undefined
}

/**
 * Hook to fetch on-chain certifications for a group's URLs
 */
export const useGroupOnChainCertifications = (
  domain: string | null,
  urls: string[]
): UseGroupOnChainCertificationsResult => {
  const { walletAddress } = useWalletFromStorage()
  const [stats, setStats] = useState<GroupCertificationStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCertifications = useCallback(async () => {
    if (!domain || urls.length === 0 || INTENTION_PREDICATE_IDS.length === 0) {
      setStats(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      logger.debug('Fetching on-chain certifications for group', { domain, urlCount: urls.length })

      // Query for all intention triples where:
      // - predicate is one of the intention predicates
      // - object atom label contains the domain
      // - user has a position (shares > 0)
      const query = `
        query GroupCertifications($predicateIds: [String!]!, $domainLike: String!, $userAddress: String) {
          triples(
            where: {
              predicate_id: { _in: $predicateIds }
              object: { label: { _ilike: $domainLike } }
            }
          ) {
            term_id
            predicate_id
            object {
              label
            }
            positions(
              where: {
                account_id: { _ilike: $userAddress }
                shares: { _gt: "0" }
              }
            ) {
              account_id
              shares
            }
          }
        }
      `

      const userAddress = walletAddress?.toLowerCase() || ''

      const response = await intuitionGraphqlClient.request(query, {
        predicateIds: INTENTION_PREDICATE_IDS,
        domainLike: `%${domain}%`,
        userAddress: userAddress ? `%${userAddress}%` : '%impossible%'
      })

      const triples = response?.triples || []
      logger.debug('Found certification triples', { count: triples.length })

      // Build a map of certified URLs
      const certifiedUrls = new Map<string, UrlCertificationStatus>()

      for (const triple of triples) {
        // Only count if user has a position
        const hasUserPosition = triple.positions && triple.positions.length > 0
        if (!hasUserPosition) continue

        const objectLabel = triple.object?.label || ''
        const predicateId = triple.predicate_id
        const intention = PREDICATE_TO_INTENTION[predicateId]

        if (!intention) continue

        // Try to match with group URLs
        for (const url of urls) {
          try {
            const urlObj = new URL(url)
            const urlHostname = urlObj.hostname
            const urlPath = urlObj.pathname

            // Create expected label format (domain or domain + path)
            const expectedLabelShort = urlHostname
            const expectedLabelFull = urlPath && urlPath !== '/'
              ? `${urlHostname}${urlPath}`
              : urlHostname

            // Check if this triple's object matches
            if (objectLabel === expectedLabelShort || objectLabel === expectedLabelFull || objectLabel.includes(urlHostname)) {
              certifiedUrls.set(url, {
                url,
                isCertifiedOnChain: true,
                intention,
                certificationLabel: intentionToCertification[intention]
              })
            }
          } catch {
            // Invalid URL, skip
          }
        }
      }

      // Calculate stats
      const certifiedCount = certifiedUrls.size
      const { level, xpToNext, progress } = calculateLevelProgress(certifiedCount)

      const newStats: GroupCertificationStats = {
        certifiedCount,
        totalUrls: urls.length,
        certifiedUrls,
        xpEarned: certifiedCount * 10,
        xpToNextLevel: xpToNext * 10, // Convert certification count to XP
        currentLevel: level,
        progressPercent: progress
      }

      setStats(newStats)
      logger.info('Group certification stats calculated', {
        domain,
        certifiedCount,
        totalUrls: urls.length,
        level,
        progress
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch certifications'
      logger.error('Failed to fetch group certifications', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [domain, urls, walletAddress])

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchCertifications()
  }, [fetchCertifications])

  // Helper to check if a specific URL is certified
  const isUrlCertified = useCallback((url: string): boolean => {
    return stats?.certifiedUrls.has(url) || false
  }, [stats])

  // Helper to get certification details for a URL
  const getUrlCertification = useCallback((url: string): UrlCertificationStatus | undefined => {
    return stats?.certifiedUrls.get(url)
  }, [stats])

  return {
    stats,
    loading,
    error,
    refetch: fetchCertifications,
    isUrlCertified,
    getUrlCertification
  }
}

export default useGroupOnChainCertifications
