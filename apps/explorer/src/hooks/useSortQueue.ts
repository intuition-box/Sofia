/**
 * useSortQueue — today's pages to sort (/spotters): pages only one other
 * person recommended, five at a time. Recommend / Oppose go through the
 * write-relayer for free (second opinions, outside the quota); without it
 * (relayer down, cap reached) they land in the cart instead. Skip is local:
 * the next page takes the slot.
 */
import { useCallback, useMemo, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { startOfUtcDay } from '@0xsofia/quests'
import { useCart } from '@/hooks/useCart'
import { useSponsorQuota } from '@/hooks/useSponsoredWrite'
import { pageVoteCartItem } from '@/services/pageMarketCartService'
import {
  fetchSortCandidates,
  type SortCandidate,
} from '@/services/sortQueueService'
import {
  requestSponsoredOpposes,
  requestSponsoredRecommends,
  sendWithApproval,
} from '@/services/sponsoredWriteService'
import { getFaviconUrl } from '@/utils/favicon'
import { refreshAfterIndexing } from '@/utils/refreshAfterIndexing'

/** Pages shown at once */
export const SORT_QUEUE_SIZE = 5

export type SortVerdict = 'recommend' | 'oppose'

const skippedKey = () => `sofia:sort-skipped:${startOfUtcDay()}`

function readSkipped(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(skippedKey()) ?? '[]'))
  } catch {
    return new Set()
  }
}

function saveSkipped(ids: Set<string>) {
  try {
    localStorage.setItem(skippedKey(), JSON.stringify([...ids]))
  } catch {
    // skips last for this session only
  }
}

export function useSortQueue(walletAddress?: string | null) {
  const { getAccessToken } = usePrivy()
  const { wallets } = useWallets()
  const { quota } = useSponsorQuota()
  const cart = useCart()
  const qc = useQueryClient()
  const [skipped, setSkipped] = useState(readSkipped)
  /** Sorted this session — the indexer takes a moment to show it */
  const [done, setDone] = useState<Set<string>>(() => new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const own = useMemo(
    () => wallets.map((w) => w.address).concat(walletAddress ?? []),
    [wallets, walletAddress],
  )
  const { data, isLoading } = useQuery({
    queryKey: ['sort-queue', walletAddress?.toLowerCase()],
    queryFn: () => fetchSortCandidates(own),
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000,
  })

  const items = useMemo(
    () =>
      (data ?? [])
        .filter((c) => !skipped.has(c.objectId) && !done.has(c.objectId))
        .slice(0, SORT_QUEUE_SIZE),
    [data, skipped, done],
  )

  const skip = useCallback((item: SortCandidate) => {
    setSkipped((prev) => {
      const next = new Set(prev).add(item.objectId)
      saveSkipped(next)
      return next
    })
  }, [])

  const free = !!quota?.eligible && (quota.opinionsLeft ?? 0) > 0

  const sort = useCallback(
    async (item: SortCandidate, verdict: SortVerdict) => {
      setError(null)
      const wallet = wallets[0]
      if (!free || !wallet) {
        // No free opinion left: the cart takes it, paid from the wallet
        const row = pageVoteCartItem(
          verdict === 'recommend' ? 'support' : 'oppose',
          {
            objectId: item.objectId,
            title: item.title,
            favicon: item.domain ? getFaviconUrl(item.domain, 32) : '',
          },
          true,
        )
        if (row) cart.addItem(row)
        setDone((prev) => new Set(prev).add(item.objectId))
        return
      }
      setBusy(item.objectId)
      try {
        const token = await getAccessToken()
        if (!token) throw new Error('Not signed in')
        await sendWithApproval<unknown>(token, wallet, () =>
          verdict === 'recommend'
            ? requestSponsoredRecommends(token, wallet.address, [
                { objectId: item.objectId, tags: [] },
              ])
            : requestSponsoredOpposes(token, wallet.address, [item.objectId]),
        )
        setDone((prev) => new Set(prev).add(item.objectId))
        void qc.invalidateQueries({ queryKey: ['sponsor-quota'] })
        refreshAfterIndexing(qc, [['missions']])
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setBusy(null)
      }
    },
    [free, wallets, cart, getAccessToken, qc],
  )

  return {
    items,
    loading: isLoading && !!walletAddress,
    /** Free Recommend / Oppose available (else they go to the cart) */
    free,
    busy,
    error,
    sort,
    skip,
  }
}
