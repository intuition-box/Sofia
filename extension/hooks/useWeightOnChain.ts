import { getClients } from '../lib/clients/viemClients'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { useStorage } from "@plasmohq/storage/hook"
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
  const [address] = useStorage<string>("metamask-account")

  const addWeight = async (
    tripleVaultId: string,
    additionalWeight: bigint
  ): Promise<WeightResult> => {
    try {
      if (!address) {
        throw new Error('No wallet connected')
      }

      logger.debug('Adding weight to triple', { tripleVaultId, additionalWeight: additionalWeight.toString() })

      const { walletClient, publicClient } = await getClients()
      const contractAddress = BlockchainService.getContractAddress()

      // Use curve ID 1 as default for triples
      const curveId = 1

      const txParams = {
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: 'deposit',
        args: [
          address as Address, // receiver
          tripleVaultId as `0x${string}`, // termId (triple vault ID) - bytes32
          curveId, // curveId
          0n // minShares (0 for no slippage protection)
        ],
        value: additionalWeight,
        chain: SELECTED_CHAIN,
        gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
        account: address as Address
      }

      logger.debug('Executing deposit transaction', txParams)

      const hash = await walletClient.writeContract(txParams)

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

  /**
   * Add shares to a triple vault on Curve 2 (Deposit/Share curve)
   * Used for investing in triple shares, separate from upvotes
   */
  const addShares = async (
    tripleVaultId: string,
    amount: bigint
  ): Promise<WeightResult> => {
    try {
      if (!address) {
        throw new Error('No wallet connected')
      }

      logger.debug('Adding shares to triple (Curve 2)', { tripleVaultId, amount: amount.toString() })

      const { walletClient, publicClient } = await getClients()
      const contractAddress = BlockchainService.getContractAddress()

      // Use curve ID 2 for Deposit/Share curve
      const curveId = 2

      const txParams = {
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: 'deposit',
        args: [
          address as Address, // receiver
          tripleVaultId as `0x${string}`, // termId (triple vault ID) - bytes32
          curveId, // curveId = 2 for shares
          0n // minShares (0 for no slippage protection)
        ],
        value: amount,
        chain: SELECTED_CHAIN,
        gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
        account: address as Address
      }

      logger.debug('Executing deposit transaction (Curve 2)', txParams)

      const hash = await walletClient.writeContract(txParams)

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
      const contractAddress = BlockchainService.getContractAddress()

      // Use curve ID 1 as default for triples
      const curveId = 1

      // Convert weight (ETH value) to shares that need to be redeemed
      // This requires getting current user shares and calculating proportion
      const userShares = await publicClient.readContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: 'getShares',
        args: [address as Address, tripleVaultId as `0x${string}`, curveId]
      }) as bigint

      // Preview how much assets we get for all shares
      const previewResult = await publicClient.readContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: 'previewRedeem',
        args: [tripleVaultId as `0x${string}`, curveId, userShares]
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

  return {
    addWeight,
    addShares,
    removeWeight
  }
}