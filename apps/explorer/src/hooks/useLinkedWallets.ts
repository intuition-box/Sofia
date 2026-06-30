import { useMemo } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { getAddress, type Address } from 'viem'

/** One wallet attached to the user's account, for the manage UI. */
export interface LinkedWallet {
  address: Address
  /** True when this wallet is currently connected (it can sign). */
  connected: boolean
  /** True when this is the acting wallet (the connected one that signs). */
  isPrimary: boolean
}

/**
 * Wallets attached to the current user.
 *
 * - `addresses` — the READ union: every wallet the user has proven ownership of
 *   by signing the Privy link flow (`user.linkedAccounts`). Persists even when a
 *   wallet isn't connected, so someone who lost access to an old wallet still
 *   sees its on-chain data. Components that aggregate user data use this.
 * - `primary` — the ACTING identity: the currently connected wallet. Every write
 *   (vote / cert / deposit) is signed by it. Switching the connected wallet
 *   switches the primary; there is no manual selection.
 * - `wallets` — per-wallet status for the manage UI (connected / primary).
 *
 * The Intuition indexer stores account IDs in EIP-55 mixed case, so the returned
 * addresses are safe to pass directly to queries that filter with `_in`.
 */
export function useLinkedWallets() {
  const { authenticated, user } = usePrivy()
  const { wallets } = useWallets()

  return useMemo(() => {
    if (!authenticated) {
      return {
        addresses: [] as Address[],
        primary: undefined as Address | undefined,
        wallets: [] as LinkedWallet[],
      }
    }

    // Linked = proven-by-signature wallets (persist while disconnected).
    const linked: Address[] = []
    for (const acc of user?.linkedAccounts ?? []) {
      if (acc.type === 'wallet' && typeof acc.address === 'string') {
        try {
          linked.push(getAddress(acc.address))
        } catch {
          // invalid address shape — skip silently
        }
      }
    }

    // Connected = currently usable wallets (can sign). First one acts.
    const connected = new Set<string>()
    for (const w of wallets) {
      try {
        connected.add(getAddress(w.address).toLowerCase())
      } catch {
        // skip
      }
    }
    let primary: Address | undefined
    for (const w of wallets) {
      try {
        primary = getAddress(w.address)
        break
      } catch {
        // skip
      }
    }

    // Read union = the linked set, plus the connected primary as a safety net
    // (it is normally already linked), deduped.
    const seen = new Set<string>()
    const addresses: Address[] = []
    for (const a of [...linked, ...(primary ? [primary] : [])]) {
      const key = a.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        addresses.push(a)
      }
    }

    const list: LinkedWallet[] = addresses.map((a) => ({
      address: a,
      connected: connected.has(a.toLowerCase()),
      isPrimary: !!primary && a.toLowerCase() === primary.toLowerCase(),
    }))

    return { addresses, primary, wallets: list }
  }, [authenticated, user, wallets])
}
