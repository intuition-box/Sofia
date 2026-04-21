/**
 * useRedeemGlobalStake Hook
 * Redeems user's position from the Global Stake (Beta Season Pool).
 * Calls MultiVault.redeem() directly (not proxy) with the GS termId/curveId.
 */

import { useState, useCallback } from "react"
import { getClients, getPublicClient } from "../lib/clients/viemClients"
import { MultiVaultAbi } from "../ABI/MultiVault"
import { SELECTED_CHAIN } from "../lib/config/chainConfig"
import { useWalletFromStorage, useGlobalStake } from "~/hooks"
import { BlockchainService, txEventBus } from "~/lib/services"
import { createHookLogger } from "~/lib/utils"
import { ERROR_MESSAGES } from "~/lib/config/constants"
import type { Address, Hash } from "../types/viem"

const logger = createHookLogger("useRedeemGlobalStake")

export interface RedeemGSResult {
  success: boolean
  txHash?: Hash
  assetsReceived?: bigint
  error?: string
}

export const useRedeemGlobalStake = () => {
  const { walletAddress: address } = useWalletFromStorage()
  const { gsConfig, position } = useGlobalStake()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Read user's shares in the global stake vault.
   */
  const getUserShares = useCallback(async (): Promise<bigint> => {
    if (!address || !gsConfig.termId) return 0n

    const publicClient = getPublicClient()
    const contractAddress = BlockchainService.getMultiVaultAddress()

    return await publicClient.readContract({
      address: contractAddress,
      abi: MultiVaultAbi,
      functionName: "getShares",
      args: [
        address as Address,
        gsConfig.termId as `0x${string}`,
        gsConfig.curveId
      ],
      authorizationList: undefined
    }) as bigint
  }, [address, gsConfig.termId, gsConfig.curveId])

  /**
   * Preview how many assets the user would receive for given shares.
   */
  const previewRedeem = useCallback(async (
    shares: bigint
  ): Promise<bigint> => {
    if (!gsConfig.termId || shares === 0n) return 0n

    const publicClient = getPublicClient()
    const contractAddress = BlockchainService.getMultiVaultAddress()

    // previewRedeem(termId, curveId, shares) → (assetsAfterFees, sharesUsed)
    const result = await publicClient.readContract({
      address: contractAddress,
      abi: MultiVaultAbi,
      functionName: "previewRedeem",
      args: [gsConfig.termId as `0x${string}`, gsConfig.curveId, shares],
      authorizationList: undefined
    }) as [bigint, bigint]

    return result[0] // assetsAfterFees
  }, [gsConfig.termId, gsConfig.curveId])

  /**
   * Redeem all (or partial) shares from the global stake vault.
   */
  const redeem = useCallback(async (
    sharesToRedeem?: bigint
  ): Promise<RedeemGSResult> => {
    try {
      if (!address) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      }
      if (!gsConfig.termId) {
        throw new Error("Global stake not configured")
      }

      setLoading(true)
      setError(null)

      const contractAddress = BlockchainService.getMultiVaultAddress()

      // 1. Read current shares
      const userShares = await getUserShares()
      if (userShares === 0n) {
        logger.debug("No shares to redeem")
        return { success: true, assetsReceived: 0n }
      }

      const shares = sharesToRedeem && sharesToRedeem < userShares
        ? sharesToRedeem
        : userShares

      logger.debug("Redeeming global stake", {
        shares: shares.toString(),
        userShares: userShares.toString(),
        termId: gsConfig.termId
      })

      // 2. Get wallet client
      const { walletClient, publicClient } = await getClients()

      const txArgs = [
        address as Address,
        gsConfig.termId as `0x${string}`,
        gsConfig.curveId,
        shares,
        0n // minAssets (no slippage protection)
      ] as const

      // 3. Simulate first
      await publicClient.simulateContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: "redeem",
        args: txArgs,
        account: address as Address
      })

      // 4. Execute
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: "redeem",
        args: txArgs,
        chain: SELECTED_CHAIN,
        account: address as Address
      })

      logger.debug("Redeem TX sent", { hash })

      const receipt = await publicClient.waitForTransactionReceipt({
        hash
      })

      if (receipt.status !== "success") {
        throw new Error(
          `${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`
        )
      }

      logger.info("Global stake redeem successful", { hash })
      txEventBus.emit("redeem_gs", hash)

      return { success: true, txHash: hash }
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : ERROR_MESSAGES.UNKNOWN_ERROR
      logger.error("Global stake redeem failed", err)
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [address, gsConfig.termId, gsConfig.curveId, getUserShares])

  return {
    redeem,
    getUserShares,
    previewRedeem,
    loading,
    error,
    hasPosition: !!position && position.shares > 0n
  }
}
