import { useCallback, useMemo } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { WRITE_RELAYER_URL } from '../config'
import type { CartItem } from './useCart'
import { approveSofiaProxy } from '../services/proxyApprovalService'
import {
  buildSponsoredRequest,
  fetchSponsorQuota,
  RelayerError,
  requestApprovalGas,
  requestSponsoredRecommends,
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
  const { data } = useQuery({
    queryKey: ['sponsor-quota', user?.id],
    queryFn: async () => {
      const token = await getAccessToken()
      if (!token) throw new Error('Not signed in')
      return fetchSponsorQuota(token)
    },
    enabled,
    staleTime: 60_000,
  })
  return { quota: enabled ? data : undefined, enabled }
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
    const send = () =>
      requestSponsoredRecommends(token, wallet.address, request.pages)
    let result: SponsorResult
    try {
      result = await send()
    } catch (err) {
      if (!(err instanceof RelayerError && err.needsApproval)) throw err
      // First free Recommend: the wallet approves Sofia once (gas from us
      // when it holds none)
      await requestApprovalGas(token, wallet.address)
      await approveSofiaProxy(wallet)
      result = await send()
    }
    qc.setQueryData<SponsorQuota>(['sponsor-quota', userId], (q) =>
      q ? { ...q, left: result.left } : q,
    )
    return result
  }, [request, getAccessToken, qc, userId, wallet])

  return { active, left, hint, request, submit }
}
