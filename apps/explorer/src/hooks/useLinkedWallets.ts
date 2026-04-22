cd /home/max/Project/sofia-core/core && bun run --filter @0xsofia/graphql codegenimport { useMemo } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { getAddress, type Address } from 'viem'

/**
 * Returns all Privy-linked wallet addresses for the current user, checksummed
 * via EIP-55. Components that aggregate user data across wallets should use
 * `addresses`. Components that sign or act under a single identity should use
 * `primary` (defaults to the first linked wallet).
 *
 * The Intuition indexer stores account IDs in EIP-55 mixed case, so the
 * returned addresses are safe to pass directly to queries that filter with
 * `_in` (exact match).
 */
export function useLinkedWallets() {
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()

  return useMemo(() => {
    if (!authenticated || wallets.length === 0) {
      return { addresses: [] as Address[], primary: undefined as Address | undefined }
    }

    const addresses: Address[] = []
    for (const w of wallets) {
      try {
        addresses.push(getAddress(w.address))
      } catch {
        // invalid address shape — skip silently
      }
    }

    return {
      addresses,
      primary: addresses[0],
    }
  }, [authenticated, wallets])
}
