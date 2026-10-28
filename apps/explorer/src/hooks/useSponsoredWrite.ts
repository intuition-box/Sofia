import { useCallback, useMemo } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { WRITE_RELAYER_URL } from '../config'
import type { CartItem } from './useCart'
import { refreshAfterIndexing } from '../utils/refreshAfterIndexing'
import {
  buildSponsoredRequest,
  fetchSponsorQuota,
  requestSponsoredRecommends,
  sendWithApproval,
  type SponsorQuota,
  type SponsorResult,
  type SponsoredRequest,
} from '../services/sponsoredWriteService'

export interface SponsoredWriteResult {
  /** This cart goes through the relayer — no signature, no TRUST */
  active: boolean
  /** Free Recommends left for this account */
  left: number
  /** Why an eligible account's cart isn't free, or null */
  hint: string | null
  request: SponsoredRequest | null
  submit: () => Promise<SponsorResult>
}

/**
 * The account's free Recommends (relayer quota, Trend Hunter credits
 * included). Shared by the cart and the Trend Hunter progress.
 */
export function useSponsorQuota() {
  const { authenticated, user, getAccessToken } = usePrivy()
  const { wallets } = useWallets()
  const enabled = !!WRITE_RELAYER_URL && authenticated && wallets.length > 0
  const { data, isError } = useQuery({
    queryKey: ['sponsor-quota', user?.id],
    queryFn: async () => {
      const token = await getAccessToken()
      if (!token) throw new Error('Not signed in')
      return fetchSponsorQuota(token)
    },
    enabled,
    staleTime: 60_000,
  })
  // A cached quota from an earlier visit says nothing once the relayer is
  // unreachable: the cart goes back through the wallet
  return { quota: enabled && !isError ? data : undefined, enabled }
}

/**
 * Free Recommends for every signed-in account — email / Google (Privy
 * embedded wallet) or a crypto wallet alike. The positions go to the wallet
 * in use; the relayer decides eligibility.
 */
export function useSponsoredWrite(items: CartItem[]): SponsoredWriteResult {
  const { user, getAccessToken } = usePrivy()
  const { wallets } = useWallets()
  const qc = useQueryClient()
  const wallet = wallets[0]
  const userId = user?.id
  const { quota, enabled } = useSponsorQuota()

  const request = useMemo(() => buildSponsoredRequest(items), [items])
  const left = quota?.left ?? 0
  const eligible = enabled && !!quota?.eligible
  const active =
    eligible && !quota?.paused && !!request && request.pages.length <= left

  const hint = !eligible
    ? null
    : quota?.paused
      ? 'Free Recommends are paused for this month'
      : !request
        ? 'Free Recommends cover up to 5 Recommends (and their tags) per cart'
        : request.pages.length > left
          ? `${left} free Recommend${left === 1 ? '' : 's'} left for now`
          : null

  const submit = useCallback(async () => {
    if (!request) throw new Error('Nothing to recommend')
    const token = await getAccessToken()
    if (!token) throw new Error('Not signed in')
    if (!wallet) throw new Error('No wallet connected')
    const result = await sendWithApproval(token, wallet, () =>
      requestSponsoredRecommends(token, wallet.address, request.pages),
    )
    qc.setQueryData<SponsorQuota>(['sponsor-quota', userId], (q) =>
      q ? { ...q, left: result.left } : q,
    )
    refreshAfterIndexing(qc, [['missions'], ['sort-queue']])
    return result
  }, [request, getAccessToken, qc, userId, wallet])

  return { active, left, hint, request, submit }
}
