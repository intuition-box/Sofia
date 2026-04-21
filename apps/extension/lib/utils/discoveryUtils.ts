/**
 * Discovery calculation utilities
 *
 * Pure functions for calculating discovery rankings and Gold rewards.
 * Extracted from useDiscoveryScore hook.
 */

import type { IntentionPurpose, UserDiscoveryStats } from '../../types/discovery'
import { DISCOVERY_GOLD_REWARDS } from '../../types/discovery'
import {
  PREDICATE_LABEL_TO_INTENTION,
  PREDICATE_LABEL_TO_TRUST
} from '../config/predicateConstants'

/** Minimal triple shape for position mapping (avoids coupling to GraphQL types) */
interface TripleWithPositions {
  object?: { term_id?: string } | null
  positions?: { account_id?: string; created_at?: string }[] | null
}

/** Minimal triple shape for ranking calculation */
interface TripleWithPredicate {
  object?: { term_id?: string } | null
  predicate?: { label?: string } | null
}

export interface DiscoveryRanking {
  pioneerCount: number
  explorerCount: number
  contributorCount: number
  totalCertifications: number
  intentionBreakdown: Record<IntentionPurpose, number>
  trustBreakdown: { trusted: number; distrusted: number }
}

export interface DiscoveryGold {
  fromPioneer: number
  fromExplorer: number
  fromContributor: number
  total: number
}

/**
 * Build a map of pages → ordered list of unique position holders (by created_at).
 * Each page (objectTermId) maps to its position holders in chronological order.
 */
export function buildPagePositionMap(
  allTriples: TripleWithPositions[]
): Map<string, { accountId: string; createdAt: string }[]> {
  // Collect earliest createdAt per account per object
  const raw = new Map<string, Map<string, string>>()

  for (const triple of allTriples) {
    const objectId = triple.object?.term_id
    if (!objectId) continue

    if (!raw.has(objectId)) raw.set(objectId, new Map())
    const accounts = raw.get(objectId)!

    for (const pos of triple.positions || []) {
      const accountId = pos.account_id?.toLowerCase()
      const createdAt = pos.created_at
      if (!accountId || !createdAt) continue

      const existing = accounts.get(accountId)
      if (!existing || createdAt < existing) {
        accounts.set(accountId, createdAt)
      }
    }
  }

  // Sort by createdAt → index + 1 = rank
  const result = new Map<string, { accountId: string; createdAt: string }[]>()
  for (const [objectId, accounts] of raw) {
    result.set(
      objectId,
      [...accounts.entries()]
        .map(([accountId, createdAt]) => ({ accountId, createdAt }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    )
  }

  return result
}

/**
 * Calculate user's discovery ranking from their triples and the global position map.
 * Determines Pioneer (1st), Explorer (2-10th), and Contributor (11+) counts.
 */
export function calculateDiscoveryRanking(
  userTriples: TripleWithPredicate[],
  pagePositionMap: Map<string, { accountId: string; createdAt: string }[]>
): DiscoveryRanking {
  let pioneerCount = 0
  let explorerCount = 0
  let contributorCount = 0
  const intentionBreakdown: Record<IntentionPurpose, number> = {
    for_work: 0,
    for_learning: 0,
    for_fun: 0,
    for_inspiration: 0,
    for_buying: 0,
    for_music: 0
  }
  const trustBreakdown = { trusted: 0, distrusted: 0 }

  const processedPages = new Set<string>()

  for (const triple of userTriples) {
    const objectId = triple.object?.term_id
    const predicateLabel = triple.predicate?.label

    if (!objectId) continue

    // Track intention/trust breakdowns
    const intentionPurpose = predicateLabel ? PREDICATE_LABEL_TO_INTENTION[predicateLabel] : null
    if (intentionPurpose) {
      intentionBreakdown[intentionPurpose]++
    }
    const trustType = predicateLabel ? PREDICATE_LABEL_TO_TRUST[predicateLabel] : null
    if (trustType) {
      trustBreakdown[trustType]++
    }

    // Skip already-processed pages for ranking (avoid double-counting)
    if (processedPages.has(objectId)) continue
    processedPages.add(objectId)

    const pagePositions = pagePositionMap.get(objectId) || []
    const totalCertifiers = pagePositions.length

    if (totalCertifiers <= 1) {
      pioneerCount++
    } else if (totalCertifiers <= 10) {
      explorerCount++
    } else {
      contributorCount++
    }
  }

  return {
    pioneerCount,
    explorerCount,
    contributorCount,
    totalCertifications: processedPages.size,
    intentionBreakdown,
    trustBreakdown
  }
}

/**
 * Calculate Gold rewards from discovery ranking.
 */
export function calculateDiscoveryGold(ranking: DiscoveryRanking): DiscoveryGold {
  const fromPioneer = ranking.pioneerCount * DISCOVERY_GOLD_REWARDS.PIONEER
  const fromExplorer = ranking.explorerCount * DISCOVERY_GOLD_REWARDS.EXPLORER
  const fromContributor = ranking.contributorCount * DISCOVERY_GOLD_REWARDS.CONTRIBUTOR

  return {
    fromPioneer,
    fromExplorer,
    fromContributor,
    total: fromPioneer + fromExplorer + fromContributor
  }
}

/**
 * Build complete discovery stats from ranking and gold calculations.
 */
export function buildDiscoveryStats(
  ranking: DiscoveryRanking,
  gold: DiscoveryGold
): UserDiscoveryStats {
  return {
    ...ranking,
    discoveryGold: gold
  }
}
