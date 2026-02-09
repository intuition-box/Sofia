import { getClients } from '../lib/clients/viemClients'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { SofiaFeeProxyAbi } from '../ABI/SofiaFeeProxy'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { useWalletFromStorage } from './useWalletFromStorage'
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES } from '../lib/config/constants'
import type { Address, Hash } from '../types/viem'

const logger = createHookLogger('useWeightOnChain')

interface WeightResult {
  success: boolean
  txHash?: Hash
  error?: string
}

export const useWeightOnChain = () => {
  const { walletAddress: address } = useWalletFromStorage()

  const addWeight = async (
    tripleVaultId: string,
    additionalWeight: bigint,
    curveId: bigint = 1n
  ): Promise<WeightResult> => {
    try {
      if (!address) {
        throw new Error('No wallet connected')
      }

      logger.debug('Adding weight to triple', { tripleVaultId, additionalWeight: additionalWeight.toString() })

      const { walletClient, publicClient } = await getClients()
      const contractAddress = BlockchainService.getContractAddress()

      // Calculate total cost including Sofia fees
      const totalCost = await BlockchainService.getTotalDepositCost(additionalWeight)
      logger.debug('Deposit cost calculated', {
        depositAmount: additionalWeight.toString(),
        totalCost: totalCost.toString(),
        curveId: curveId.toString()
      })

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: SofiaFeeProxyAbi,
        functionName: 'deposit' as const,
        args: [
          address as Address, // receiver
          tripleVaultId as `0x${string}`, // termId (triple vault ID) - bytes32
          curveId, // curveId
          0n // minShares (0 for no slippage protection)
        ],
        value: totalCost, // Use totalCost which includes Sofia fees
        chain: SELECTED_CHAIN,
        gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
        account: address as Address
      })

      logger.debug('Deposit transaction sent', { hash })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      logger.debug('Weight addition successful', { hash, receipt })

      return {
        success: true,
        txHash: hash
      }
    } catch (error) {
      logger.error('Weight addition failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      return {
        success: false,
        error: `Weight addition failed: ${errorMessage}`
      }
    }
  }

  const removeWeight = async (
    tripleVaultId: string,
    weightToRemove: bigint
  ): Promise<WeightResult> => {
    try {
      if (!address) {
        throw new Error('No wallet connected')
      }

      logger.debug('Removing weight from triple', { tripleVaultId, weightToRemove: weightToRemove.toString() })

      const { walletClient, publicClient } = await getClients()
      // Redeem must go directly to MultiVault (proxy doesn't support redeem for security)
      const contractAddress = BlockchainService.getMultiVaultAddress()

      // Use curve ID 1 as default for triples
      const curveId = 1

      // Convert weight (ETH value) to shares that need to be redeemed
      // This requires getting current user shares and calculating proportion
      const userShares = await publicClient.readContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: 'getShares',
        args: [address as Address, tripleVaultId as `0x${string}`, curveId],
        authorizationList: undefined
      }) as bigint

      // Preview how much assets we get for all shares
      const previewResult = await publicClient.readContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: 'previewRedeem',
        args: [tripleVaultId as `0x${string}`, curveId, userShares],
        authorizationList: undefined
      }) as [bigint, bigint] // [assetsAfterFees, sharesUsed]

      const totalAssets = previewResult[0]
      
      // Calculate what proportion of shares to redeem
      let sharesToRedeem: bigint
      if (weightToRemove >= totalAssets) {
        // Remove all shares if trying to remove more than total
        sharesToRedeem = userShares
      } else {
        // Calculate proportional shares to redeem
        sharesToRedeem = (userShares * weightToRemove) / totalAssets
      }

      const txParams = {
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: 'redeem',
        args: [
          address as Address, // receiver
          tripleVaultId as `0x${string}`, // termId (triple vault ID) - bytes32
          curveId, // curveId
          sharesToRedeem, // shares to redeem
          0n // minAssets (0 for no slippage protection)
        ],
        chain: SELECTED_CHAIN,
        gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
        account: address as Address
      }

      logger.debug('Executing redeem transaction', { ...txParams, sharesToRedeem: sharesToRedeem.toString() })

      const hash = await walletClient.writeContract(txParams)

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      logger.debug('Weight removal successful', { hash, receipt })

      return {
        success: true,
        txHash: hash
      }
    } catch (error) {
      logger.error('Weight removal failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      return {
        success: false,
        error: `Weight removal failed: ${errorMessage}`
      }
    }
  }

  const addShares = async (
    tripleVaultId: string,
    amount: bigint
  ): Promise<WeightResult> => {
    try {
      if (!address) {
        throw new Error('No wallet connected')
      }

      logger.debug('Adding shares to triple', { tripleVaultId, amount: amount.toString() })

      const { walletClient, publicClient } = await getClients()
      const contractAddress = BlockchainService.getContractAddress()

      // Calculate total cost including Sofia fees
      const totalCost = await BlockchainService.getTotalDepositCost(amount)
      logger.debug('Deposit cost calculated', {
        depositAmount: amount.toString(),
        totalCost: totalCost.toString()
      })

      // Use curve ID 2 (Offset Progressive - Shares/Deposit)
      const curveId = 2n

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: SofiaFeeProxyAbi,
        functionName: 'deposit' as const,
        args: [
          address as Address, // receiver
          tripleVaultId as `0x${string}`, // termId (triple vault ID) - bytes32
          curveId, // curveId
          0n // minShares (0 for no slippage protection)
        ],
        value: totalCost,
        chain: SELECTED_CHAIN,
        gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
        account: address as Address
      })

      logger.debug('Shares deposit transaction sent', { hash })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      logger.debug('Shares addition successful', { hash, receipt })

      return {
        success: true,
        txHash: hash
      }
    } catch (error) {
      logger.error('Shares addition failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      return {
        success: false,
        error: `Shares addition failed: ${errorMessage}`
      }
    }
  }

  /**
   * Redeem ALL user positions from the given triples.
   * Calls MultiVault directly (not via proxy) and sends funds to user wallet.
   */
  const redeemAllPositions = async (
    tripleVaultIds: string[]
  ): Promise<WeightResult> => {
    try {
      if (!address) {
        throw new Error('No wallet connected')
      }

      if (tripleVaultIds.length === 0) {
        return { success: true }
      }

      logger.debug('Redeeming all positions', { tripleVaultIds })

      const { walletClient, publicClient } = await getClients()
      const contractAddress = BlockchainService.getMultiVaultAddress()
      const curveId = 1 // triples use curveId 1

      // Get all user shares for each triple
      const sharesPerTriple: bigint[] = []
      const validTermIds: string[] = []

      for (const termId of tripleVaultIds) {
        const userShares = await publicClient.readContract({
          address: contractAddress,
          abi: MultiVaultAbi,
          functionName: 'getShares',
          args: [address as Address, termId as `0x${string}`, curveId],
          authorizationList: undefined
        }) as bigint

        if (userShares > 0n) {
          validTermIds.push(termId)
          sharesPerTriple.push(userShares)
        }
      }

      if (validTermIds.length === 0) {
        logger.debug('No shares to redeem')
        return { success: true }
      }

      let hash: Hash

      if (validTermIds.length === 1) {
        // Single redeem
        hash = await walletClient.writeContract({
          address: contractAddress,
          abi: MultiVaultAbi,
          functionName: 'redeem',
          args: [
            address as Address,
            validTermIds[0] as `0x${string}`,
            curveId,
            sharesPerTriple[0],
            0n
          ],
          chain: SELECTED_CHAIN,
          gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: address as Address
        })
      } else {
        // Batch redeem
        hash = await walletClient.writeContract({
          address: contractAddress,
          abi: MultiVaultAbi,
          functionName: 'redeemBatch',
          args: [
            address as Address,
            validTermIds.map(id => id as `0x${string}`),
            validTermIds.map(() => BigInt(curveId)),
            sharesPerTriple,
            validTermIds.map(() => 0n)
          ],
          chain: SELECTED_CHAIN,
          gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS * BigInt(validTermIds.length),
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: address as Address
        })
      }

      logger.debug('Redeem transaction sent', { hash })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      logger.debug('Redeem all positions successful', { hash, count: validTermIds.length })

      return {
        success: true,
        txHash: hash
      }
    } catch (error) {
      logger.error('Redeem all positions failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      return {
        success: false,
        error: `Redeem failed: ${errorMessage}`
      }
    }
  }

  return {
    addWeight,
    addShares,
    removeWeight,
    redeemAllPositions
  }
}