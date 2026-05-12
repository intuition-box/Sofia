/**
 * useAddressInterests — read-only mirror of `useInterestsHydration`
 * that works for ANY wallet address, not just the connected user.
 *
 * Calls the same on-chain `getShares` reads against every topic /
 * category atom and returns the slugs the address has a non-zero
 * position on. The personal profile flow keeps using
 * `useInterestsHydration` so it can also merge into the local
 * selection store; this hook is the pure-read variant for public
 * profile pages where there's no local store to merge into.
 */

import { useQuery } from '@tanstack/react-query'
import { TOPIC_ATOM_IDS, CATEGORY_ATOM_IDS } from '@/config/atomIds'
import { getSharesBatch, getSharesBatchChunked } from '@/services/redeemService'

const STALE = 10 * 60 * 1000
const GC = 24 * 60 * 60 * 1000

function pickOwned(
  shares: Map<string, bigint>,
  slugToTerm: Record<string, string>,
): string[] {
  const owned: string[] = []
  for (const [slug, termId] of Object.entries(slugToTerm)) {
    if ((shares.get(termId) ?? 0n) > 0n) owned.push(slug)
  }
  return owned
}

export interface UseAddressInterestsResult {
  /** Topic slugs the address has a position on. */
  topics: string[]
  /** Category slugs the address has a position on. */
  categories: string[]
  /** True while the underlying queries are still running. */
  isLoading: boolean
}

export function useAddressInterests(
  address: string | undefined,
): UseAddressInterestsResult {
  const normalized = address?.toLowerCase()
  const enabled = !!normalized

  const topicsQ = useQuery<string[]>({
    queryKey: ['address-interests', 'topics', normalized],
    queryFn: async () =>
      pickOwned(
        await getSharesBatch(normalized!, Object.values(TOPIC_ATOM_IDS)),
        TOPIC_ATOM_IDS,
      ),
    enabled,
    staleTime: STALE,
    gcTime: GC,
    refetchOnWindowFocus: false,
  })

  // Categories runs only after topics resolved — same cascade as
  // `useInterestsHydration` so the first paint is on topics (14 reads)
  // and the heavier category batch (161 reads) lands after.
  const categoriesQ = useQuery<string[]>({
    queryKey: ['address-interests', 'categories', normalized],
    queryFn: async () =>
      pickOwned(
        await getSharesBatchChunked(
          normalized!,
          Object.values(CATEGORY_ATOM_IDS),
          25,
        ),
        CATEGORY_ATOM_IDS,
      ),
    enabled: enabled && topicsQ.isSuccess,
    staleTime: STALE,
    gcTime: GC,
    refetchOnWindowFocus: false,
  })

  return {
    topics: topicsQ.data ?? [],
    categories: categoriesQ.data ?? [],
    isLoading: topicsQ.isLoading || categoriesQ.isLoading,
  }
}
