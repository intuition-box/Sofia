/**
 * Circle Interest Utilities
 * Pure functions for fetching member domain activity.
 */

import { intuitionGraphqlClient } from '../clients/graphql-client'
import { GetUserIntentionPositionsDocument } from '@0xsofia/graphql'
import { PREDICATE_IDS, PREDICATE_NAMES } from '../config/chainConfig'
import type { DomainActivityGroup } from '../../types/interests'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Only intention predicates (not OAuth)
const INTENTION_PREDICATE_IDS = [
  PREDICATE_IDS.VISITS_FOR_WORK,
  PREDICATE_IDS.VISITS_FOR_LEARNING,
  PREDICATE_IDS.VISITS_FOR_FUN,
  PREDICATE_IDS.VISITS_FOR_INSPIRATION,
  PREDICATE_IDS.VISITS_FOR_BUYING
].filter(Boolean)

// Map predicate ID → predicate label (for DomainActivityGroup format)
const PREDICATE_ID_TO_LABEL: Record<string, string> = {}
if (PREDICATE_IDS.VISITS_FOR_WORK) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_WORK] = PREDICATE_NAMES.VISITS_FOR_WORK
if (PREDICATE_IDS.VISITS_FOR_LEARNING) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_LEARNING] = PREDICATE_NAMES.VISITS_FOR_LEARNING
if (PREDICATE_IDS.VISITS_FOR_FUN) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_FUN] = PREDICATE_NAMES.VISITS_FOR_FUN
if (PREDICATE_IDS.VISITS_FOR_INSPIRATION) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_INSPIRATION] = PREDICATE_NAMES.VISITS_FOR_INSPIRATION
if (PREDICATE_IDS.VISITS_FOR_BUYING) PREDICATE_ID_TO_LABEL[PREDICATE_IDS.VISITS_FOR_BUYING] = PREDICATE_NAMES.VISITS_FOR_BUYING

// ---------------------------------------------------------------------------
// Domain extraction
// ---------------------------------------------------------------------------

function normalizeDomain(domain: string): string {
  const lower = domain.toLowerCase()
  const prefixes = ['www.', 'open.', 'm.', 'mobile.', 'app.', 'web.']
  for (const prefix of prefixes) {
    if (lower.startsWith(prefix)) return lower.slice(prefix.length)
  }
  return lower
}

function extractDomain(label: string): string | null {
  if (!label) return null
  try {
    const cleaned = label.replace(/^https?:\/\//, '')
    const domain = cleaned.split('/')[0]
    if (domain && domain.includes('.')) return normalizeDomain(domain)
    return null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Fetch member domain activity via GraphQL
// ---------------------------------------------------------------------------

/**
 * Fetch a single member's certified URLs grouped by domain.
 * Returns DomainActivityGroup[] in the same format the skillsAnalysisAgent expects.
 */
export async function fetchMemberDomainActivity(walletAddress: string): Promise<DomainActivityGroup[]> {
  if (INTENTION_PREDICATE_IDS.length === 0) return []

  const response = await intuitionGraphqlClient.request(GetUserIntentionPositionsDocument, {
    predicateIds: INTENTION_PREDICATE_IDS,
    userAddress: `%${walletAddress.toLowerCase()}%`
  })

  const triples = response?.triples || []
  const domainMap = new Map<string, Record<string, number>>()

  for (const triple of triples) {
    const url = triple.object?.value?.thing?.url || triple.object?.label || ''
    const domain = extractDomain(url)
    if (!domain) continue

    const predicateId = triple.predicate?.term_id || ''
    const predicateLabel = PREDICATE_ID_TO_LABEL[predicateId]
    if (!predicateLabel) continue

    if (!domainMap.has(domain)) {
      domainMap.set(domain, {})
    }
    const predicates = domainMap.get(domain)!
    predicates[predicateLabel] = (predicates[predicateLabel] || 0) + 1
  }

  // Convert to DomainActivityGroup format
  return Array.from(domainMap.entries()).map(([domain, predicates]) => {
    const count = Object.values(predicates).reduce((sum, n) => sum + n, 0)
    return {
      key: domain,
      count,
      total_shares: '0',
      predicates
    }
  })
}

export type { DomainActivityGroup }
