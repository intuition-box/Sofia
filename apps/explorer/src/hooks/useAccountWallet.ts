import { useEffect, useMemo } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import {
  forgetAccount,
  rememberAccount,
  rememberedAccount,
} from '@/services/lastAccountService'
import { useLinkedWallets } from './useLinkedWallets'

export interface AccountWallet {
  /** The account's wallet for reads — Privy's, or the remembered one while
   *  Privy restores the session */
  address: string | undefined
  /** Signed in — or, while Privy restores, signed in last time */
  signedIn: boolean
  /** Privy hasn't confirmed yet: render cached data, don't offer writes */
  provisional: boolean
}

/**
 * The signed-in wallet for rendering pages. While Privy restores the session
 * after a reload, falls back to the account signed in last time so cached
 * data shows at once; Privy's answer replaces it when ready.
 */
export function useAccountWallet(): AccountWallet {
  const { ready, authenticated, user } = usePrivy()
  return useMemo(() => {
    if (ready)
      return {
        address: authenticated ? user?.wallet?.address : undefined,
        signedIn: authenticated,
        provisional: false,
      }
    const last = rememberedAccount()
    return {
      address: last?.primary,
      signedIn: !!last,
      provisional: true,
    }
  }, [ready, authenticated, user?.wallet?.address])
}

/** Keeps the remembered account in sync with Privy — mount once (App). */
export function useRememberAccount(): void {
  const { ready, authenticated, user } = usePrivy()
  const { addresses } = useLinkedWallets()
  const primary = user?.wallet?.address
  const key = addresses.join(',')
  useEffect(() => {
    if (!ready) return
    if (!authenticated) forgetAccount()
    else if (primary)
      rememberAccount({ primary, addresses: key ? key.split(',') : [primary] })
  }, [ready, authenticated, primary, key])
}
