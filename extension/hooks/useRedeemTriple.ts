/**
 * useRedeemTriple Hook
 * Reusable hook for redeeming positions from triples.
 * Calls MultiVault directly (not via proxy) and sends funds to user wallet.
 *
 * Usage:
 *   const { redeemPosition, redeemAllPositions, loading } = useRedeemTriple()
 *   await redeemPosition(tripleVaultId)           // redeem all shares from one triple
 *   await redeemAllPositions([id1, id2, id3])     // batch redeem from multiple triples
 */

import { useState } from 'react'
import { getClients, getPublicClient } from '../lib/clients/viemClients'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { useWalletFromStorage } from './useWalletFromStorage'
import { BlockchainService } from '../lib/services'
import { createHookLogger } from '../lib/utils/logger'
import { ERROR_MESSAGES } from '../lib/config/constants'
import type { Address, Hash } from '../types/viem'

const logger = createHookLogger('useRedeemTriple')

const TRIPLE_CURVE_ID = 1 // triples use curveId 1

export interface RedeemResult {
  success: boolean
  txHash?: Hash
  error?: string
}

export const useRedeemTriple = () => {
  const { walletAddress: address } = useWalletFromStorage()
  const [loading, setLoading] = useState(false)

  /**
   * Read user shares for a triple using public client (no wallet interaction needed).
   */
  const getUserShares = async (
    tripleVaultId: string
  ): Promise<bigint> => {
    if (!address) return 0n

    const publicClient = getPublicClient()
    const contractAddress = BlockchainService.getMultiVaultAddress()

    return await publicClient.readContract({
      address: contractAddress,
      abi: MultiVaultAbi,
      functionName: 'getShares',
      args: [address as Address, tripleVaultId as `0x${string}`, TRIPLE_CURVE_ID],
      authorizationList: undefined
    }) as bigint
  }

  /**
   * Redeem a single triple position (all user shares).
   * Optionally pass sharesToRedeem to redeem a partial amount.
   */
  const redeemPosition = async (
    tripleVaultId: string,
    sharesToRedeem?: bigint
  ): Promise<RedeemResult> => {
    try {
      if (!address) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      }

      setLoading(true)
      const contractAddress = BlockchainService.getMultiVaultAddress()

      // 1. Read shares using public client (fast, no wallet popup)
      const userShares = await getUserShares(tripleVaultId)

      if (userShares === 0n) {
        logger.debug('No shares to redeem', { tripleVaultId })
        return { success: true }
      }

      const shares = sharesToRedeem && sharesToRedeem < userShares
        ? sharesToRedeem
        : userShares

      logger.debug('Redeeming position', {
        tripleVaultId,
        shares: shares.toString(),
        userShares: userShares.toString()
      })

      // 2. Get wallet client right before write (minimize timeout window)
      const { walletClient, publicClient } = await getClients()

      const txArgs = [
        address as Address,
        tripleVaultId as `0x${string}`,
        TRIPLE_CURVE_ID,
        shares,
        0n // minAssets
      ] as const

      // 3. Simulate first for better error messages
      await publicClient.simulateContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: 'redeem',
        args: txArgs,
        account: address as Address
      })

      // 4. Send transaction (gas estimated automatically by wallet)
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: 'redeem',
        args: txArgs,
        chain: SELECTED_CHAIN,
        account: address as Address
      })

      logger.debug('Redeem transaction sent', { hash })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      logger.info('Redeem successful', { hash, tripleVaultId })

      return { success: true, txHash: hash }
    } catch (error) {
      logger.error('Redeem failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Redeem ALL positions from multiple triples in one batch transaction.
   * Falls back to single redeem if only one triple has shares.
   */
  const redeemAllPositions = async (
    tripleVaultIds: string[]
  ): Promise<RedeemResult> => {
    try {
      if (!address) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      }

      if (tripleVaultIds.length === 0) {
        return { success: true }
      }

      setLoading(true)

      const contractAddress = BlockchainService.getMultiVaultAddress()

      // 1. Read all shares using public client (no wallet interaction)
      const sharesPerTriple: bigint[] = []
      const validTermIds: string[] = []

      for (const termId of tripleVaultIds) {
        const userShares = await getUserShares(termId)
        if (userShares > 0n) {
          validTermIds.push(termId)
          sharesPerTriple.push(userShares)
        }
      }

      if (validTermIds.length === 0) {
        logger.debug('No shares to redeem in any triple')
        return { success: true }
      }

      logger.debug('Redeeming positions', {
        count: validTermIds.length,
        shares: sharesPerTriple.map(s => s.toString())
      })

      // 2. Single triple → delegate to redeemPosition
      if (validTermIds.length === 1) {
        return await redeemPosition(validTermIds[0], sharesPerTriple[0])
      }

      // 3. Multiple triples → batch redeem
      // Get wallet client right before write (minimize timeout window)
      const { walletClient, publicClient } = await getClients()

      const batchArgs = [
        address as Address,
        validTermIds.map(id => id as `0x${string}`),
        validTermIds.map(() => BigInt(TRIPLE_CURVE_ID)),
        sharesPerTriple,
        validTermIds.map(() => 0n)
      ] as const

      // Simulate first
      await publicClient.simulateContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: 'redeemBatch',
        args: batchArgs,
        account: address as Address
      })

      // Send batch transaction (gas estimated automatically)
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: 'redeemBatch',
        args: batchArgs,
        chain: SELECTED_CHAIN,
        account: address as Address
      })

      logger.debug('Batch redeem transaction sent', { hash })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      logger.info('Batch redeem successful', { hash, count: validTermIds.length })

      return { success: true, txHash: hash }
    } catch (error) {
      logger.error('Batch redeem failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    redeemPosition,
    redeemAllPositions,
    getUserShares,
    loading
  }
}

export default useRedeemTriple
