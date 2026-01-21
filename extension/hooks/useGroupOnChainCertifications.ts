/**
 * useGroupOnChainCertifications Hook
 * Uses the global certifications cache to determine certification status for group URLs
 * NO GraphQL queries - just local matching from the cached data
 */

import { useState, useCallback, useEffect } from 'react'
import { useUserCertifications } from './useUserCertifications'
import { useWalletFromStorage } from './useWalletFromStorage'
import type { IntentionPurpose } from '../types/discovery'
import { createHookLogger } from '../lib/utils/logger'

const logger = createHookLogger('useGroupOnChainCertifications')

// Map IntentionPurpose to CertificationType (for display)
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
  certificationLabel?: string // 'work', 'learning', 'follow', etc.
  // Support multiple certifications per URL
  allIntentions?: IntentionPurpose[]
  allCertificationLabels?: string[]  // Includes both intention labels and OAuth predicates
  oauthPredicates?: string[]         // OAuth predicates like 'follow', 'member_of'
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

/**
 * Normalize a URL to the label format for matching
 * IMPORTANT: Must match the normalization in useUserCertifications (all lowercase)
 */
function normalizeUrlToLabel(url: string): { label: string; isRootDomain: boolean } | null {
  try {
    const urlObj = new URL(url)
    let hostname = urlObj.hostname.toLowerCase()
    const pathname = urlObj.pathname
    const search = urlObj.search

    // Remove www.
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4)
    }

    // Build full path with query params
    const fullPath = pathname + search
    const hasPath = fullPath && fullPath !== '/'

    // IMPORTANT: Lowercase the entire label to match cache keys
    const label = hasPath
      ? `${hostname}${fullPath.replace(/\/$/, '')}`.toLowerCase()
      : hostname

    return { label, isRootDomain: !hasPath }
  } catch {
    return null
  }
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
 * Hook to get on-chain certifications for a group's URLs
 * Uses the global cache - NO GraphQL queries!
 */
export const useGroupOnChainCertifications = (
  domain: string | null,
  urls: string[]
): UseGroupOnChainCertificationsResult => {
  const { walletAddress } = useWalletFromStorage()
  const { certifications, loading: globalLoading, error: globalError, refetch: globalRefetch } = useUserCertifications(walletAddress)
  const [stats, setStats] = useState<GroupCertificationStats | null>(null)

  // Stabilize urls reference
  const urlsKey = urls.join('|')

  // Compute stats from the global cache
  useEffect(() => {
    if (!domain || urls.length === 0) {
      setStats(null)
      return
    }

    // Skip if global cache is still loading
    if (globalLoading) {
      return
    }

    logger.debug('Computing group certifications from cache', { domain, urlCount: urls.length, cacheSize: certifications.size })

    const certifiedUrls = new Map<string, UrlCertificationStatus>()

    for (const url of urls) {
      const normalized = normalizeUrlToLabel(url)
      if (!normalized) continue

      const { label: normalizedLabel, isRootDomain: urlIsRootDomain } = normalized

      // Look up in the global cache
      const certification = certifications.get(normalizedLabel)

      // Debug: Log URL matching attempts for domains like github
      if (normalizedLabel.includes('github') || url.includes('github')) {
        logger.debug('URL matching attempt:', {
          originalUrl: url,
          normalizedLabel,
          urlIsRootDomain,
          foundInCache: !!certification,
          cacheKeys: Array.from(certifications.keys()).filter(k => k.includes('github'))
        })
      }

      if (certification) {
        // STRICT MATCHING RULE:
        // - Root domain certification (e.g., "youtube.com") only matches root domain URLs
        // - Page certification (e.g., "youtube.com/watch?v=xxx") only matches that exact page
        // This prevents "youtube.com" from matching all YouTube URLs

        if (certification.isRootDomain && !urlIsRootDomain) {
          // Root domain certification should NOT match URLs with paths
          logger.debug('Skipping root domain match for URL with path', {
            url,
            certificationLabel: certification.label
          })
          continue
        }

        // Build all certification labels (intentions + OAuth predicates)
        const intentionLabels = certification.intentions.map(i => intentionToCertification[i])
        const oauthLabels = certification.oauthPredicates || []
        const allLabels = [...intentionLabels, ...oauthLabels]

        // Primary label: prefer intention, fall back to OAuth predicate
        const primaryIntention = certification.intentions[0]
        const primaryLabel = primaryIntention
          ? intentionToCertification[primaryIntention]
          : oauthLabels[0]

        certifiedUrls.set(url, {
          url,
          isCertifiedOnChain: true,
          intention: primaryIntention,
          certificationLabel: primaryLabel,
          allIntentions: certification.intentions,
          allCertificationLabels: allLabels,
          oauthPredicates: oauthLabels
        })
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
      xpToNextLevel: xpToNext * 10,
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
  }, [domain, urlsKey, certifications, globalLoading])

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
    loading: globalLoading,
    error: globalError,
    refetch: globalRefetch,
    isUrlCertified,
    getUrlCertification
  }
}

export default useGroupOnChainCertifications
