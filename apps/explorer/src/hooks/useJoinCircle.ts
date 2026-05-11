/**
 * useJoinCircle — orchestrates a "join group" intent into the cart.
 *
 * Resolves the user's Account atom (subject of the membership triple),
 * watches the cart for an existing duplicate, surfaces a friendly
 * blocked-reason when prerequisites aren't met yet, and exposes a
 * single `join()` callback the overlay button can fire.
 *
 * The cart-item shape lives in `circleJoinService` so the React layer
 * never deals with predicate ids directly.
 */

import { useCallback, useMemo } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useUserAccountAtom } from './useUserAccountAtom'
import { useCart } from './useCart'
import { buildJoinCartItem, joinCartId } from '@/services/circleJoinService'
import type { CircleData } from '@/types/circle'

export type JoinBlockedReason = 'no-wallet' | 'no-account-atom' | 'loading'

export interface UseJoinCircleResult {
  /** Adds the join intent to the cart and opens the drawer. Becomes a
   *  no-op when `disabledReason` is set or `circle.isMember` is true. */
  join: () => void
  /** True when an item with the same `joinCartId(termId)` is already
   *  queued — the overlay swaps its CTA for a "confirm in cart" hint. */
  inCart: boolean
  /** Reason the join button must be disabled, if any. Mapped to a UX
   *  string by the overlay (`disabledReason` text). */
  disabledReason: JoinBlockedReason | null
  /** Pre-mapped UX string for `disabledReason`. Convenience so callers
   *  don't re-implement the lookup. */
  disabledHint: string | null
}

const REASON_HINT: Record<JoinBlockedReason, string> = {
  'no-wallet': 'Connect your wallet to join',
  'no-account-atom':
    'Make any cert first to register your account on Intuition',
  loading: 'Resolving your identity…',
}

export function useJoinCircle(circle: CircleData | null): UseJoinCircleResult {
  const { user, authenticated } = usePrivy()
  const userWallet = user?.wallet?.address
  const {
    termId: userAccountAtomId,
    exists: accountAtomExists,
    isLoading: accountAtomLoading,
  } = useUserAccountAtom(userWallet)
  const cart = useCart()

  const targetTermId = circle?.joinAction?.atomTermId ?? null

  const inCart = useMemo(() => {
    if (!targetTermId) return false
    const id = joinCartId(targetTermId)
    return cart.items.some((i) => i.id === id)
  }, [cart.items, targetTermId])

  const disabledReason = useMemo<JoinBlockedReason | null>(() => {
    if (!authenticated) return 'no-wallet'
    if (accountAtomLoading) return 'loading'
    if (!accountAtomExists) return 'no-account-atom'
    return null
  }, [authenticated, accountAtomLoading, accountAtomExists])

  const join = useCallback(() => {
    if (!circle || !targetTermId || !userAccountAtomId) return
    if (disabledReason) return
    if (inCart) {
      cart.open()
      return
    }
    const item = buildJoinCartItem({
      groupTermId: targetTermId,
      groupLabel: circle.name,
      groupImage: circle.members[0]?.image ?? null,
      userAccountAtomId,
      color: circle.color,
    })
    if (!item) return
    cart.addItem(item)
    cart.open()
  }, [
    circle,
    targetTermId,
    userAccountAtomId,
    disabledReason,
    inCart,
    cart,
  ])

  return {
    join,
    inCart,
    disabledReason,
    disabledHint: disabledReason ? REASON_HINT[disabledReason] : null,
  }
}
