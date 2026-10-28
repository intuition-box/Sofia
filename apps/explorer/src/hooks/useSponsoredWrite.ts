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
 * Free Recommends for email / Google accounts (Privy embedded wallet). Only
 * when the wallet in use is that embedded wallet: a crypto-wallet account
 * keeps signing and paying itself. The relayer decides eligibility.
 */
export function useSponsoredWrite(items: CartItem[]): SponsoredWriteResult {
  const { authenticated, user, getAccessToken } = usePrivy()
  const { wallets } = useWallets()
  const qc = useQueryClient()
  const enabled =
    !!WRITE_RELAYER_URL &&
    authenticated &&
    !!(user?.email || user?.google) &&
    wallets[0]?.walletClientType === 'privy'
  const userId = user?.id

  const { data: quota } = useQuery({
    queryKey: ['sponsor-quota', userId],
    queryFn: async () => {
      const token = await getAccessToken()
      if (!token) throw new Error('Not signed in')
      return fetchSponsorQuota(token)
    },
    enabled,
    staleTime: 60_000,
  })

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
    const send = () => requestSponsoredRecommends(token, request.pages)
    let result: SponsorResult
    try {
      result = await send()
    } catch (err) {
      if (!(err instanceof RelayerError && err.needsApproval) || !wallets[0])
        throw err
      // First free Recommend: the wallet approves Sofia once (gas from us)
      await requestApprovalGas(token)
      await approveSofiaProxy(wallets[0])
      result = await send()
    }
    qc.setQueryData<SponsorQuota>(['sponsor-quota', userId], (q) =>
      q ? { ...q, left: result.left } : q,
    )
    return result
  }, [request, getAccessToken, qc, userId, wallets])

  return { active, left, hint, request, submit }
}
