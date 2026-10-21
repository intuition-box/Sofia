/**
 * useRedeemTriple — exits positions on claims (and their counter vaults).
 * Thin facade over RedeemService, which covers both bonding curves in one
 * transaction from the user's own wallet.
 *
 * Usage:
 *   const { redeemPosition, redeemAllPositions, loading } = useRedeemTriple()
 *   await redeemPosition(tripleVaultId)           // every share, all curves
 *   await redeemAllPositions([id1, id2, id3])     // one batch transaction
 */

import { useCallback, useState } from "react"

import { useWalletFromStorage } from "~/hooks"
import { redeemService, type RedeemResult } from "~/lib/services"
import { ERROR_MESSAGES } from "~/lib/config/constants"

export type { RedeemResult }

export const useRedeemTriple = () => {
  const { walletAddress: address } = useWalletFromStorage()
  const [loading, setLoading] = useState(false)

  /** The wallet's shares on a vault, summed over both curves */
  const getUserShares = useCallback(
    async (termId: string): Promise<bigint> => {
      if (!address) return 0n
      const legs = await redeemService.findLegs(address, [termId])
      return legs.reduce((sum, leg) => sum + leg.shares, 0n)
    },
    [address]
  )

  const run = useCallback(
    async (termIds: string[], fraction = 1): Promise<RedeemResult> => {
      if (!address) {
        return { success: false, error: ERROR_MESSAGES.WALLET_NOT_CONNECTED }
      }
      setLoading(true)
      try {
        return await redeemService.redeem(address, termIds, fraction)
      } finally {
        setLoading(false)
      }
    },
    [address]
  )

  /** Exit one position — all of it, or `sharesToRedeem` of it */
  const redeemPosition = useCallback(
    async (termId: string, sharesToRedeem?: bigint): Promise<RedeemResult> => {
      if (!sharesToRedeem) return run([termId])
      const total = await getUserShares(termId)
      if (total === 0n) return { success: true }
      const fraction = Number((sharesToRedeem * 10_000n) / total) / 10_000
      return run([termId], Math.min(1, fraction))
    },
    [run, getUserShares]
  )

  /** Exit every position on these vaults in one transaction */
  const redeemAllPositions = useCallback(
    (termIds: string[]) => run(termIds),
    [run]
  )

  return {
    redeemPosition,
    redeemAllPositions,
    getUserShares,
    loading
  }
}

export default useRedeemTriple
