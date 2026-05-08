/**
 * useUserAccountAtom — resolves the on-chain Account atom term_id for
 * a wallet address. Sofia auto-creates an Account atom when a wallet
 * first interacts with Intuition (any cert/deposit), so the atom is
 * usually present for any returning user.
 *
 * Used by Join-group and other flows that need the user's identity
 * atom as a triple subject.
 */

import { useMemo } from 'react'
import { useGetAccountAtomByWalletQuery } from '@0xsofia/graphql'
import { getAddress } from 'viem'

interface Result {
  /** Term_id of the user's Account atom on Intuition. */
  termId: string | null
  /** False when the indexer has no Account atom for this wallet yet —
   *  caller should surface a CTA explaining the user must do at least
   *  one cert/deposit before this action becomes available. */
  exists: boolean
  isLoading: boolean
  error: string | null
}

export function useUserAccountAtom(
  address: string | undefined,
): Result {
  const checksum = useMemo(() => {
    if (!address) return null
    try {
      return getAddress(address)
    } catch {
      return null
    }
  }, [address])

  const { data, isLoading, error } = useGetAccountAtomByWalletQuery(
    { addresses: checksum ? [checksum, checksum.toLowerCase()] : [] },
    { enabled: Boolean(checksum) },
  )

  const atom = data?.atoms?.[0]
  return {
    termId: atom?.term_id ?? null,
    exists: Boolean(atom?.term_id),
    isLoading: Boolean(checksum) && isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
  }
}
