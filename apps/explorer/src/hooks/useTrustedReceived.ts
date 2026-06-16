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
import {
  useFindAccountAtomsQuery,
  useGetTrustedByPositionsQuery,
} from '@0xsofia/graphql'
import { SUBJECT_IDS, PREDICATE_IDS } from '@/config'

const STALE_TIME_MS = 5 * 60 * 1000
const GC_TIME_MS = 60 * 60 * 1000

async function fetchTrustedReceived(
  addresses: readonly string[],
): Promise<number> {
  if (addresses.length === 0) return 0

  const checksum = addresses.map((a) => getAddress(a))
  const lower = addresses.map((a) => a.toLowerCase())
  const allCase = Array.from(new Set([...checksum, ...lower]))

  const atomResult = await useFindAccountAtomsQuery
    .fetcher({ addresses: allCase })()
    .catch(() => ({ atoms: [] as { term_id: string }[] }))

  const myAtomIds = atomResult.atoms.map((a) => a.term_id).filter(Boolean)
  if (myAtomIds.length === 0) return 0

  const res = await useGetTrustedByPositionsQuery
    .fetcher({
      subjectId: SUBJECT_IDS.I,
      predicateId: PREDICATE_IDS.TRUSTS,
      objectIds: myAtomIds,
    })()
    .catch(() => ({ triples: [] as never[] }))

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
