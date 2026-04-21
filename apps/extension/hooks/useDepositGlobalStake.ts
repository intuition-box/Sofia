/**
 * useDepositGlobalStake Hook
 * Deposits directly into the Global Stake (Beta Season Pool) vault.
 * Calls MultiVault.deposit() directly (payable, amount = msg.value).
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

const logger = createHookLogger("useDepositGlobalStake")

export interface DepositGSResult {
  success: boolean
  txHash?: Hash
  error?: string
}

export const useDepositGlobalStake = () => {
  const { walletAddress: address } = useWalletFromStorage()
  const { gsConfig } = useGlobalStake()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Preview how many shares the user would receive for a deposit.
   */
  const previewDeposit = useCallback(async (
    amount: bigint
  ): Promise<bigint> => {
    if (!gsConfig.termId || amount === 0n) return 0n

    const publicClient = getPublicClient()
    const contractAddress = BlockchainService.getMultiVaultAddress()

    // previewDeposit(termId, curveId, assets) → (shares, assetsAfterFees)
    const result = await publicClient.readContract({
      address: contractAddress,
      abi: MultiVaultAbi,
      functionName: "previewDeposit",
      args: [
        gsConfig.termId as `0x${string}`,
        gsConfig.curveId,
        amount
      ],
      authorizationList: undefined
    }) as [bigint, bigint]

    return result[0] // shares
  }, [gsConfig.termId, gsConfig.curveId])

  /**
   * Deposit into the global stake vault.
   * @param amount Amount in wei to deposit
   */
  const deposit = useCallback(async (
    amount: bigint
  ): Promise<DepositGSResult> => {
    try {
      if (!address) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      }
      if (!gsConfig.termId) {
        throw new Error("Global stake not configured")
      }
      if (amount === 0n) {
        throw new Error("Deposit amount must be greater than 0")
      }

      setLoading(true)
      setError(null)

      const contractAddress = BlockchainService.getMultiVaultAddress()

      logger.debug("Depositing to global stake", {
        amount: amount.toString(),
        termId: gsConfig.termId
      })

      const { walletClient, publicClient } = await getClients()

      const txArgs = [
        address as Address,
        gsConfig.termId as `0x${string}`,
        gsConfig.curveId,
        0n // minShares (no slippage protection)
      ] as const

      // Simulate first
      await publicClient.simulateContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: "deposit",
        args: txArgs,
        value: amount,
        account: address as Address
      })

      // Execute
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: "deposit",
        args: txArgs,
        value: amount,
        chain: SELECTED_CHAIN,
        account: address as Address
      })

      logger.debug("Deposit TX sent", { hash })

      const receipt = await publicClient.waitForTransactionReceipt({
        hash
      })

      if (receipt.status !== "success") {
        throw new Error(
          `${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`
        )
      }

      logger.info("Global stake deposit successful", { hash })
      txEventBus.emit("deposit_gs", hash)

      return { success: true, txHash: hash }
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : ERROR_MESSAGES.UNKNOWN_ERROR
      logger.error("Global stake deposit failed", err)
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [address, gsConfig.termId, gsConfig.curveId])

  return {
    deposit,
    previewDeposit,
    loading,
    error
  }
}
