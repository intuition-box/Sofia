/**
 * useMyEns — resolves the current user's ENS display + avatar from their
 * primary (= first linked) wallet only.
 *
 * Rule: for the logged-in user's identity we always show `addresses[0]`,
 * never the union. Embedded wallets (created post-subscription) have no
 * ENS, so the primary is effectively the user's external wallet with the
 * public identity.
 *
 * For displaying OTHER users' labels, keep using `useEnsNames(addresses)`
 * directly with the batch resolver in `ensService`.
 */

import { useEnsNames } from './useEnsNames'
import { useLinkedWallets } from './useLinkedWallets'

export interface MyEns {
  address: string | undefined
  displayName: string
  avatar: string
}

export function useMyEns(): MyEns {
  const { primary } = useLinkedWallets()
  const { getDisplay, getAvatar } = useEnsNames(primary ? [primary] : [])

  return {
    address: primary,
    displayName: primary ? getDisplay(primary) : '',
    avatar: primary ? getAvatar(primary) : '',
  }
}
