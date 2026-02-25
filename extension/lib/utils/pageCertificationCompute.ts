/**
 * Pure computation functions for page certification data
 *
 * Replaces scattered logic from usePageDiscovery, usePageIntentionStats,
 * and usePageBlockchainData trust/distrust blocks.
 * All functions are stateless — input triples, output derived data.
 */

import type { DiscoveryStatus } from "~/types/discovery"
import type { IntentionPurpose } from "~/types/intentionCategories"
import {
  PREDICATE_ID_TO_INTENTION,
  PREDICATE_LABEL_TO_TRUST
} from "~/lib/config/predicateConstants"

// ── Types ──

/** Minimal triple shape from the PageCertificationData query */
export interface CertTriple {
  term_id: string
  predicate_id: string
  predicate: { term_id: string; label: string }
  object: { term_id: string; label: string }
  positions: Array<{
    account_id: string
    shares: string
    created_at: string
  }>
}

export interface DiscoveryResult {
  discoveryStatus: DiscoveryStatus
  certificationRank: number | null
  totalCertifications: number
  userHasCertified: boolean
}

export interface IntentionStatsResult {
  intentions: Record<IntentionPurpose, number>
  pageIntentions: Record<IntentionPurpose, number>
  totalCertifications: number
  pageTotalCertifications: number
  maxIntentionCount: number
  pageMaxIntentionCount: number
}

export interface TrustCountsResult {
  trustCount: number
  distrustCount: number
  totalSupport: number
  trustRatio: number
  domainTrustCount: number
  domainDistrustCount: number
  domainTotalSupport: number
  domainTrustRatio: number
}

// ── Helpers ──

const EMPTY_INTENTIONS: Record<IntentionPurpose, number> = {
  for_work: 0,
  for_learning: 0,
  for_fun: 0,
  for_inspiration: 0,
  for_buying: 0,
  for_music: 0
}

const emptyIntentionSets = (): Record<IntentionPurpose, Set<string>> => ({
  for_work: new Set(),
  for_learning: new Set(),
  for_fun: new Set(),
  for_inspiration: new Set(),
  for_buying: new Set(),
  for_music: new Set()
})

const setsToNumbers = (
  sets: Record<IntentionPurpose, Set<string>>
): Record<IntentionPurpose, number> => ({
  for_work: sets.for_work.size,
  for_learning: sets.for_learning.size,
  for_fun: sets.for_fun.size,
  for_inspiration: sets.for_inspiration.size,
  for_buying: sets.for_buying.size,
  for_music: sets.for_music.size
})

// ── Compute Functions ──

/**
 * Compute discovery status from certification triples.
 * Counts unique position holders across ALL certification types,
 * sorted by earliest created_at to determine Pioneer/Explorer/Contributor.
 */
export function computeDiscoveryData(
  certTriples: CertTriple[],
  pageAtomIds: string[],
  walletAddress: string | null
): DiscoveryResult {
  // Filter to page-specific triples
  const pageAtomSet = new Set(pageAtomIds)
  const triples =
    pageAtomSet.size > 0
      ? certTriples.filter((t) => pageAtomSet.has(t.object?.term_id))
      : []

  // Collect unique holders with their earliest created_at
  const uniqueHolders = new Map<string, string>()
  for (const triple of triples) {
    for (const pos of triple.positions || []) {
      const accountId = pos.account_id?.toLowerCase()
      const createdAt = pos.created_at
      if (accountId && createdAt) {
        if (
          !uniqueHolders.has(accountId) ||
          createdAt < uniqueHolders.get(accountId)!
        ) {
          uniqueHolders.set(accountId, createdAt)
        }
      }
    }
  }

  // Sort by created_at to get rank order
  const sortedHolders = Array.from(uniqueHolders.entries())
    .sort(
      (a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime()
    )
    .map(([accountId]) => accountId)

  const total = sortedHolders.length
  const userAddress = walletAddress?.toLowerCase()
  const userRank = userAddress ? sortedHolders.indexOf(userAddress) + 1 : 0

  if (userRank > 0) {
    let status: DiscoveryStatus = "Contributor"
    if (userRank === 1) status = "Pioneer"
    else if (userRank <= 10) status = "Explorer"

    return {
      discoveryStatus: status,
      certificationRank: userRank,
      totalCertifications: total,
      userHasCertified: true
    }
  }

  return {
    discoveryStatus: null,
    certificationRank: null,
    totalCertifications: total,
    userHasCertified: false
  }
}

/**
 * Compute intention stats (domain + page) from certification triples.
 * Only counts triples whose predicate_id maps to an IntentionPurpose.
 */
export function computeIntentionStats(
  certTriples: CertTriple[],
  pageAtomIds: string[]
): IntentionStatsResult {
  const pageAtomSet = new Set(pageAtomIds)
  const domainCounts = emptyIntentionSets()
  const pageCounts = emptyIntentionSets()

  for (const triple of certTriples) {
    const purpose = PREDICATE_ID_TO_INTENTION[triple.predicate_id]
    if (!purpose) continue

    const isPageTriple =
      pageAtomSet.size > 0 && pageAtomSet.has(triple.object?.term_id)

    for (const pos of triple.positions || []) {
      const accountId = pos.account_id?.toLowerCase()
      if (!accountId) continue

      domainCounts[purpose].add(accountId)
      if (isPageTriple) {
        pageCounts[purpose].add(accountId)
      }
    }
  }

  const intentions = setsToNumbers(domainCounts)
  const pageIntentions = setsToNumbers(pageCounts)

  const totalCertifications = Object.values(intentions).reduce(
    (sum, c) => sum + c,
    0
  )
  const pageTotalCertifications = Object.values(pageIntentions).reduce(
    (sum, c) => sum + c,
    0
  )

  return {
    intentions,
    pageIntentions,
    totalCertifications,
    pageTotalCertifications,
    maxIntentionCount: Math.max(...Object.values(intentions), 1),
    pageMaxIntentionCount: Math.max(...Object.values(pageIntentions), 1)
  }
}

/**
 * Compute trust/distrust counts (domain + page) from certification triples.
 * Only counts triples whose predicate.label maps via PREDICATE_LABEL_TO_TRUST.
 */
export function computeTrustCounts(
  certTriples: CertTriple[],
  pageAtomIds: string[]
): TrustCountsResult {
  const pageAtomSet = new Set(pageAtomIds)

  const domainTrust = new Set<string>()
  const domainDistrust = new Set<string>()
  const pageTrust = new Set<string>()
  const pageDistrust = new Set<string>()

  for (const triple of certTriples) {
    const trustType = PREDICATE_LABEL_TO_TRUST[triple.predicate?.label]
    if (!trustType) continue

    const isDomainTrust = trustType === "trusted"
    const isPageTriple =
      pageAtomSet.size > 0 && pageAtomSet.has(triple.object?.term_id)

    for (const pos of triple.positions || []) {
      const accountId = pos.account_id?.toLowerCase()
      if (!accountId) continue

      if (isDomainTrust) {
        domainTrust.add(accountId)
        if (isPageTriple) pageTrust.add(accountId)
      } else {
        domainDistrust.add(accountId)
        if (isPageTriple) pageDistrust.add(accountId)
      }
    }
  }

  const domainTotalSupport = domainTrust.size + domainDistrust.size
  const totalSupport = pageTrust.size + pageDistrust.size

  return {
    trustCount: pageTrust.size,
    distrustCount: pageDistrust.size,
    totalSupport,
    trustRatio:
      totalSupport > 0
        ? Math.round((pageTrust.size / totalSupport) * 100)
        : 50,
    domainTrustCount: domainTrust.size,
    domainDistrustCount: domainDistrust.size,
    domainTotalSupport,
    domainTrustRatio:
      domainTotalSupport > 0
        ? Math.round((domainTrust.size / domainTotalSupport) * 100)
        : 50
  }
}
