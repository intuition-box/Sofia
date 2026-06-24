/**
 * useAuth — thin wrapper over Privy. Exposes just what the app needs: ready
 * flag, authenticated flag, the lowercased wallet, every linked wallet address
 * (external first, for ENS resolution), login/logout, and a token getter.
 */
import { useCallback, useMemo } from 'react'
import { usePrivy } from '@privy-io/react-auth'

export function useAuth() {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy()

  const wallet = user?.wallet?.address?.toLowerCase() ?? null

  // All wallet addresses, external (non-embedded) first — the ENS lives on the
  // user's real wallet, not the Privy embedded one.
  const addresses = useMemo<string[]>(() => {
    if (!user) return []
    const wallets = ((user.linkedAccounts ?? []) as any[]).filter(
      (a) => a?.type === 'wallet' && typeof a.address === 'string',
    )
    const external = wallets.filter((a) => a.walletClientType !== 'privy')
    const embedded = wallets.filter((a) => a.walletClientType === 'privy')
    const ordered = [...external, ...embedded].map((a) => a.address.toLowerCase())
    if (wallet && !ordered.includes(wallet)) ordered.push(wallet)
    return Array.from(new Set(ordered))
  }, [user, wallet])

  // Stable token getter for service calls (throws if somehow unauthenticated).
  const token = useCallback(async () => {
    const t = await getAccessToken()
    if (!t) throw new Error('Not authenticated')
    return t
  }, [getAccessToken])

  return { ready, authenticated, wallet, addresses, login, logout, token }
}
