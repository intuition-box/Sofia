/**
 * Circle Interest Utilities
 * Pure functions for fetching member domain activity.
 */

import { intuitionGraphqlClient } from "../clients/graphql-client"
import { GetUserIntentionPositionsDocument } from "@0xsofia/graphql"
import type { DomainActivityGroup } from "../../types/interests"
import { extractDomain } from "./domainUtils"
import {
  INTENTION_PREDICATE_IDS,
  PREDICATE_ID_TO_LABEL
} from "../config/predicateConstants"

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
      total_shares: "0",
      predicates
    }
  })
}

export type { DomainActivityGroup }
