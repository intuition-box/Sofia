/**
 * useInterestsHydration — loads on-chain topic/category ownership into the
 * local selection store on auth.
 *
 * Two waves:
 *   1. Topics (14 reads) — fast, unblocks the UI first.
 *   2. Categories (161 reads, chunked) — runs after topics resolve.
 *
 * The merge is union-only: on-chain positions are added to local state,
 * but local-only (pending) selections are never removed. React Query's
 * persister + refetchOnMount:false keeps reloads instant.
 */

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { TOPIC_ATOM_IDS, CATEGORY_ATOM_IDS } from '@/config/atomIds'
import { getSharesBatch, getSharesBatchChunked } from '@/services/redeemService'
import { mergeRemoteSelection } from './useDomainSelection'

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

export function useInterestsHydration() {
  const { ready, authenticated } = usePrivy()
  const { wallets } = useWallets()
  const wallet = wallets[0]
  const address = wallet?.address?.toLowerCase()

  const topicsQ = useQuery<string[]>({
    queryKey: ['interests-hydration', 'topics', address],
    queryFn: async () =>
      pickOwned(
        await getSharesBatch(wallet!.address, Object.values(TOPIC_ATOM_IDS)),
        TOPIC_ATOM_IDS,
      ),
    enabled: ready && authenticated && !!address,
    staleTime: STALE,
    gcTime: GC,
    refetchOnWindowFocus: false,
  })

  const categoriesQ = useQuery<string[]>({
    queryKey: ['interests-hydration', 'categories', address],
    queryFn: async () =>
      pickOwned(
        await getSharesBatchChunked(wallet!.address, Object.values(CATEGORY_ATOM_IDS), 25),
        CATEGORY_ATOM_IDS,
      ),
    enabled: ready && authenticated && !!address && topicsQ.isSuccess,
    staleTime: STALE,
    gcTime: GC,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!topicsQ.isSuccess) return
    mergeRemoteSelection({
      topics: topicsQ.data ?? [],
      categories: categoriesQ.data ?? [],
    })
  }, [topicsQ.isSuccess, topicsQ.data, categoriesQ.isSuccess, categoriesQ.data])
}
