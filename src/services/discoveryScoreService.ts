/**
 * Discovery Score Service
 *
 * Calculates Pioneer / Explorer / Contributor / Trusted counts.
 * Optimized: uses server-side aggregates instead of client-side pagination.
 *
 * - Pioneer: user is the only certifier (1 position holder)
 * - Explorer: 2-10 certifiers
 * - Contributor: 11+ certifiers
 * - Trusted: count of trust positions on the user
 * - Signals: total terms_aggregate (same as extension)
 */

import { useGetUserSignalsCountQuery } from '@0xsofia/dashboard-graphql'
import { GRAPHQL_URL, SUBJECT_IDS, PREDICATE_IDS } from '../config'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscoveryStats {
  pioneerCount: number
  explorerCount: number
  contributorCount: number
  trustedCount: number
  totalCertifications: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CERTIFICATION_PREDICATE_LABELS = [
  'visits for work',
  'visits for learning',
  'visits for learning ', // legacy trailing space
  'visits for fun',
  'visits for inspiration',
  'visits for buying',
  'visits for music',
  'trusts',
  'distrust',
]

// ---------------------------------------------------------------------------
// GraphQL — single query with positions_aggregate for certifier counts
// ---------------------------------------------------------------------------

const USER_TRIPLES_WITH_COUNTS_QUERY = `
  query UserTriplesWithCounts(
    $predicateLabels: [String!]!
    $userAddress: String!
    $limit: Int!
    $offset: Int!
  ) {
    triples(
      where: {
        predicate: { label: { _in: $predicateLabels } }
        positions: {
          account_id: { _ilike: $userAddress }
          shares: { _gt: "0" }
        }
      }
      limit: $limit
      offset: $offset
    ) {
      object { term_id }
      positions_aggregate(where: { shares: { _gt: "0" } }) {
        aggregate { count }
      }
    }
  }
`

const FIND_ACCOUNT_ATOM_QUERY = `
  query FindAccountAtom($address: String!) {
    atoms(
      where: {
        _and: [
          { data: { _ilike: $address } }
          { type: { _eq: "Account" } }
        ]
      }
      limit: 1
    ) {
      term_id
    }
  }
`

const TRUSTED_BY_POSITIONS_QUERY = `
  query GetTrustedByPositions($subjectId: String!, $predicateId: String!, $objectId: String!) {
    triples(
      where: {
        _and: [
          { subject_id: { _eq: $subjectId } }
          { predicate_id: { _eq: $predicateId } }
          { object_id: { _eq: $objectId } }
        ]
      }
    ) {
      term {
        vaults {
          positions_aggregate(where: { shares: { _gt: "0" } }) {
            aggregate { count }
          }
        }
      }
    }
  }
`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function gqlRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data as T
}

// ---------------------------------------------------------------------------
// Main fetch function
// ---------------------------------------------------------------------------

interface TripleWithCount {
  object?: { term_id?: string }
  positions_aggregate?: { aggregate?: { count?: number } }
}

export async function fetchDiscoveryStats(walletAddress: string): Promise<DiscoveryStats> {
  const userAddress = walletAddress.toLowerCase()

  // Launch all independent queries in parallel
  const [triplesResult, signalsResult, atomResult] = await Promise.all([
    // 1. User triples with position counts (server-side aggregate)
    gqlRequest<{ triples: TripleWithCount[] }>(USER_TRIPLES_WITH_COUNTS_QUERY, {
      predicateLabels: CERTIFICATION_PREDICATE_LABELS,
      userAddress,
      limit: 1000,
      offset: 0,
    }),

    // 2. Signals count (same as extension)
    useGetUserSignalsCountQuery.fetcher({
      accountId: walletAddress,
      subjectId: SUBJECT_IDS.I,
    })().catch(() => null),

    // 3. Account atom for trusted count
    gqlRequest<{ atoms: { term_id: string }[] }>(FIND_ACCOUNT_ATOM_QUERY, {
      address: `%${userAddress}%`,
    }).catch(() => ({ atoms: [] })),
  ])

  // Calculate Pioneer / Explorer / Contributor from server-side counts
  let pioneerCount = 0
  let explorerCount = 0
  let contributorCount = 0
  const processedPages = new Set<string>()

  for (const triple of triplesResult.triples) {
    const objectId = triple.object?.term_id
    if (!objectId || processedPages.has(objectId)) continue
    processedPages.add(objectId)

    const totalCertifiers = triple.positions_aggregate?.aggregate?.count ?? 0
    if (totalCertifiers <= 1) {
      pioneerCount++
    } else if (totalCertifiers <= 10) {
      explorerCount++
    } else {
      contributorCount++
    }
  }

  // Trusted count — fetch if we found the account atom
  let trustedCount = 0
  const myAtomId = atomResult.atoms?.[0]?.term_id
  if (myAtomId) {
    try {
      const res = await gqlRequest<{
        triples: {
          term: { vaults: { positions_aggregate: { aggregate: { count: number } } }[] }
        }[]
      }>(TRUSTED_BY_POSITIONS_QUERY, {
        subjectId: SUBJECT_IDS.I,
        predicateId: PREDICATE_IDS.TRUSTS,
        objectId: myAtomId,
      })
      for (const triple of res.triples || []) {
        for (const vault of triple.term?.vaults || []) {
          trustedCount += vault.positions_aggregate?.aggregate?.count ?? 0
        }
      }
    } catch {
      // non-critical
    }
  }

  const signalsCount = signalsResult?.signalsCount?.aggregate?.count ?? processedPages.size

  return {
    pioneerCount,
    explorerCount,
    contributorCount,
    trustedCount,
    totalCertifications: signalsCount,
  }
}
