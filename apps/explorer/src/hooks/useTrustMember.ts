/**
 * useTrustMember — orchestrates a "trust this member" intent into the
 * cart. Resolves the user's Account atom (subject of the trust triple),
 * watches the cart for a duplicate, surfaces a friendly blocked-reason
 * when prerequisites aren't met yet, and exposes a single `trust()`
 * callback the action button can fire.
 *
 * The cart-item shape lives in `trustEmissionService` so the React
 * layer never deals with predicate ids directly. Mirrors useJoinCircle.
 */

import { useCallback, useMemo } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useUserAccountAtom } from './useUserAccountAtom'
import { useCart } from './useCart'
import {
  buildTrustCartItem,
  trustCartId,
} from '@/services/trustEmissionService'
import type { TrustCircleAccount } from '@/services/trustCircleService'

export type TrustBlockedReason = 'no-wallet' | 'no-account-atom' | 'loading'

export interface UseTrustMemberResult {
  /** Adds the trust intent to the cart and opens the drawer. No-op when
   *  `disabledReason` is set or the item is already queued. */
  trust: () => void
  /** True when an item with the same `trustCartId(termId)` is already
   *  queued — the button swaps its label for a "queued" hint. */
  inCart: boolean
  /** Reason the trust button must be disabled, if any. */
  disabledReason: TrustBlockedReason | null
  /** Pre-mapped UX string for `disabledReason`. */
  disabledHint: string | null
}

const REASON_HINT: Record<TrustBlockedReason, string> = {
  'no-wallet': 'Connect your wallet to trust',
  'no-account-atom':
    'Make any cert first to register your account on Intuition',
  loading: 'Resolving your identity…',
}

export function useTrustMember(
  member: TrustCircleAccount | null,
): UseTrustMemberResult {
  const { user, authenticated } = usePrivy()
  const userWallet = user?.wallet?.address
  const {
    termId: userAccountAtomId,
    exists: accountAtomExists,
    isLoading: accountAtomLoading,
  } = useUserAccountAtom(userWallet)
  const cart = useCart()

  const memberTermId = member?.termId ?? null

  const inCart = useMemo(() => {
    if (!memberTermId) return false
    const id = trustCartId(memberTermId)
    return cart.items.some((i) => i.id === id)
  }, [cart.items, memberTermId])

  const disabledReason = useMemo<TrustBlockedReason | null>(() => {
    if (!authenticated) return 'no-wallet'
    if (accountAtomLoading) return 'loading'
    if (!accountAtomExists) return 'no-account-atom'
    return null
  }, [authenticated, accountAtomLoading, accountAtomExists])

  const trust = useCallback(() => {
    if (!member || !memberTermId || !userAccountAtomId) return
    if (disabledReason) return
    if (inCart) {
      cart.open()
      return
    }
    const item = buildTrustCartItem({
      memberTermId,
      memberLabel: member.label,
      memberImage: member.image,
      userAccountAtomId,
    })
    if (!item) return
    cart.addItem(item)
    cart.open()
  }, [member, memberTermId, userAccountAtomId, disabledReason, inCart, cart])

  return {
    trust,
    inCart,
    disabledReason,
    disabledHint: disabledReason ? REASON_HINT[disabledReason] : null,
  }
}
