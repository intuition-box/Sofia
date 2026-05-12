/**
 * useTrustedReceived — counts the trust positions other users hold on the
 * connected user's account atoms (the "Trusted" badge in the right-rail).
 *
 * Two-step fetch:
 *   1. Find the user's account atoms (one per linked wallet, by `data` =
 *      address with both checksum and lowercase casings — the indexer is
 *      inconsistent across emitters).
 *   2. Aggregate position counts on every `(I, trusts, <accountAtom>)`
 *      triple's vaults.
 *
 * Returns 0 when no addresses are provided or the fetch fails. Wrapped
 * in React Query so multiple consumers share the same cache entry.
 */

import { useQuery } from '@tanstack/react-query'
import { getAddress } from 'viem'
import { GRAPHQL_URL, SUBJECT_IDS, PREDICATE_IDS } from '@/config'

const STALE_TIME_MS = 5 * 60 * 1000
const GC_TIME_MS = 60 * 60 * 1000

const FIND_ACCOUNT_ATOMS_QUERY = `
  query FindAccountAtoms($addresses: [String!]!) {
    atoms(
      where: {
        _and: [
          { data: { _in: $addresses } }
          { type: { _eq: "Account" } }
        ]
      }
    ) {
      term_id
    }
  }
`

const TRUSTED_BY_POSITIONS_QUERY = `
  query GetTrustedByPositions($subjectId: String!, $predicateId: String!, $objectIds: [String!]!) {
    triples(
      where: {
        _and: [
          { subject_id: { _eq: $subjectId } }
          { predicate_id: { _eq: $predicateId } }
          { object_id: { _in: $objectIds } }
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

async function gqlRequest<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data as T
}

async function fetchTrustedReceived(
  addresses: readonly string[],
): Promise<number> {
  if (addresses.length === 0) return 0

  const checksum = addresses.map((a) => getAddress(a))
  const lower = addresses.map((a) => a.toLowerCase())
  const allCase = Array.from(new Set([...checksum, ...lower]))

  const atomResult = await gqlRequest<{ atoms: { term_id: string }[] }>(
    FIND_ACCOUNT_ATOMS_QUERY,
    { addresses: allCase },
  ).catch(() => ({ atoms: [] as { term_id: string }[] }))

  const myAtomIds = atomResult.atoms.map((a) => a.term_id).filter(Boolean)
  if (myAtomIds.length === 0) return 0

  const res = await gqlRequest<{
    triples: {
      term: {
        vaults: { positions_aggregate: { aggregate: { count: number } } }[]
      }
    }[]
  }>(TRUSTED_BY_POSITIONS_QUERY, {
    subjectId: SUBJECT_IDS.I,
    predicateId: PREDICATE_IDS.TRUSTS,
    objectIds: myAtomIds,
  }).catch(() => ({ triples: [] as never[] }))

  let total = 0
  for (const triple of res.triples || []) {
    for (const vault of triple.term?.vaults || []) {
      total += vault.positions_aggregate?.aggregate?.count ?? 0
    }
  }
  return total
}

export function useTrustedReceived(addresses: readonly string[] | undefined): {
  count: number
  isLoading: boolean
} {
  const sorted = addresses ? [...addresses].sort() : []
  const enabled = sorted.length > 0
  const cacheKey = sorted.join(',')

  const { data, isLoading } = useQuery<number>({
    queryKey: ['trusted-received', cacheKey],
    queryFn: () => fetchTrustedReceived(sorted),
    enabled,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    refetchOnWindowFocus: false,
  })

  return { count: data ?? 0, isLoading: enabled && isLoading }
}
