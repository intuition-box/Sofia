/**
 * topicCertificationsService
 * Fetches platforms certified "in context of" a given topic.
 * Two-step query:
 *   1. Get "in context of" triples where object = topic atom
 *   2. Resolve the subject cert triples to get platform details
 */

import { GRAPHQL_URL } from '@/config'
import { TOPIC_ATOM_IDS } from '@/config/atomIds'
import { extractDomain } from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'

// ── Types ──

export interface TopicCertification {
  /** Cert triple term_id */
  termId: string
  /** Platform name / label */
  platformLabel: string
  /** Platform domain (e.g. "github.com") */
  domain: string
  /** Favicon URL */
  favicon: string
  /** Full URL of the certified page */
  url: string
  /** Predicate label (e.g. "visits for work") */
  intention: string
  /** Number of holders on this cert triple */
  positionCount: number
  /** Market cap in raw bigint string */
  marketCap: string
  /** Certifier account IDs */
  certifiers: string[]
}

// ── Queries ──

const GET_CONTEXT_TRIPLES = `
  query GetTopicContextTriples($topicTermId: String!) {
    triples(
      where: {
        predicate: { label: { _eq: "in context of" } }
        object: { term_id: { _eq: $topicTermId } }
      }
      limit: 200
    ) {
      subject_id
    }
  }
`

const GET_CERT_TRIPLES = `
  query GetCertTriples($termIds: [String!]!, $address: String) {
    triples(where: { term_id: { _in: $termIds } }) {
      term_id
      predicate { label }
      object {
        label
        image
        value { thing { url name } }
      }
      term {
        vaults {
          position_count
          market_cap
          positions(where: { account_id: { _ilike: $address } }) {
            shares
          }
        }
      }
    }
  }
`

// ── Fetch ──

export async function fetchTopicCertifications(
  topicId: string,
  walletAddress?: string,
): Promise<TopicCertification[]> {
  const topicTermId = TOPIC_ATOM_IDS[topicId]
  if (!topicTermId) return []

  // Step 1: get cert triple IDs linked to this topic
  const ctxRes = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: GET_CONTEXT_TRIPLES,
      variables: { topicTermId },
    }),
  })
  const ctxJson = await ctxRes.json()
  const contextTriples = ctxJson.data?.triples || []
  const certTermIds = contextTriples
    .map((t: any) => t.subject_id)
    .filter(Boolean) as string[]

  if (certTermIds.length === 0) return []

  // Step 2: resolve cert triples
  const address = walletAddress || '0x0000000000000000000000000000000000000000'
  const certRes = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: GET_CERT_TRIPLES,
      variables: { termIds: certTermIds, address },
    }),
  })
  const certJson = await certRes.json()
  const certTriples = certJson.data?.triples || []

  return certTriples.map((triple: any) => {
    const obj = triple.object
    const thingUrl = obj?.value?.thing?.url || ''
    const domain = thingUrl ? extractDomain(thingUrl) : ''
    const vaults = triple.term?.vaults || []

    let totalPositionCount = 0
    let totalMarketCap = 0n
    const certifiers: string[] = []

    for (const vault of vaults) {
      totalPositionCount += vault.position_count || 0
      totalMarketCap += BigInt(vault.market_cap || '0')
      for (const pos of vault.positions || []) {
        if (pos.shares && BigInt(pos.shares) > 0n) {
          certifiers.push(pos.account_id || '')
        }
      }
    }

    return {
      termId: triple.term_id,
      platformLabel: obj?.value?.thing?.name || obj?.label || domain,
      domain,
      favicon: obj?.image || (domain ? getFaviconUrl(domain) : ''),
      url: thingUrl,
      intention: triple.predicate?.label || '',
      positionCount: totalPositionCount,
      marketCap: String(totalMarketCap),
      certifiers,
    }
  })
}
