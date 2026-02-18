/**
 * useGroupOnChainCertifications Hook
 * Uses the global certifications cache to determine certification status for group URLs
 * NO GraphQL queries - just local matching from the cached data
 */

import { useMemo, useCallback } from 'react'
import { useUserCertifications, type TripleDetail } from './useUserCertifications'
import { useWalletFromStorage } from './useWalletFromStorage'
import type { IntentionPurpose } from '../types/discovery'
import { createHookLogger } from '../lib/utils/logger'
import { normalizeUrl } from '../lib/utils'

const logger = createHookLogger('useGroupOnChainCertifications')

// Map IntentionPurpose to CertificationType (for display)
const intentionToCertification: Record<IntentionPurpose, string> = {
  for_work: 'work',
  for_learning: 'learning',
  for_fun: 'fun',
  for_inspiration: 'inspiration',
  for_buying: 'buying',
  for_music: 'music'
}

// Map trust predicate labels to certification types
const trustToCertification: Record<string, string> = {
  trusts: 'trusted',
  distrust: 'distrusted'
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
  tripleDetails?: TripleDetail[]     // Triple details for redeem operations
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
 * Uses shared normalizeUrl utility (strips tracking params, keeps content params)
 */
function normalizeUrlToLabel(url: string): { label: string; isRootDomain: boolean } | null {
  try {
    return normalizeUrl(url)
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

  // Stabilize urls reference
  const urlsKey = urls.join('|')

  // Compute stats synchronously from the global cache (no useEffect/setState to avoid render cascades)
  const stats = useMemo((): GroupCertificationStats | null => {
    if (!domain || urls.length === 0) {
      return null
    }

    // Return null while global cache is still loading
    if (globalLoading) {
      return null
    }

    const certifiedUrls = new Map<string, UrlCertificationStatus>()

    for (const url of urls) {
      const normalized = normalizeUrlToLabel(url)
      if (!normalized) continue

      const { label: normalizedLabel, isRootDomain: urlIsRootDomain } = normalized

      // Look up in the global cache
      const certification = certifications.get(normalizedLabel)

      if (certification) {
        // STRICT MATCHING RULE:
        // - Root domain certification (e.g., "youtube.com") only matches root domain URLs
        // - Page certification (e.g., "youtube.com/watch?v=xxx") only matches that exact page
        // This prevents "youtube.com" from matching all YouTube URLs

        if (certification.isRootDomain && !urlIsRootDomain) {
          continue
        }

        // Build all certification labels (intentions + OAuth + trust predicates)
        const intentionLabels = certification.intentions.map(i => intentionToCertification[i])
        const oauthLabels = certification.oauthPredicates || []
        const trustLabels = (certification.trustPredicates || []).map(t => trustToCertification[t] || t)
        const allLabels = [...intentionLabels, ...oauthLabels, ...trustLabels]

        // Primary label: prefer intention, fall back to trust, then OAuth predicate
        const primaryIntention = certification.intentions[0]
        const primaryLabel = primaryIntention
          ? intentionToCertification[primaryIntention]
          : trustLabels[0] || oauthLabels[0]

        certifiedUrls.set(url, {
          url,
          isCertifiedOnChain: true,
          intention: primaryIntention,
          certificationLabel: primaryLabel,
          allIntentions: certification.intentions,
          allCertificationLabels: allLabels,
          oauthPredicates: oauthLabels,
          tripleDetails: certification.triples
        })
      }
    }

    // Calculate stats
    const certifiedCount = certifiedUrls.size
    const { level, xpToNext, progress } = calculateLevelProgress(certifiedCount)

    return {
      certifiedCount,
      totalUrls: urls.length,
      certifiedUrls,
      xpEarned: certifiedCount * 10,
      xpToNextLevel: xpToNext * 10,
      currentLevel: level,
      progressPercent: progress
    }
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
