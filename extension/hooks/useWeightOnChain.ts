import { getClients, getPublicClient } from '../lib/clients/viemClients'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { SofiaFeeProxyAbi } from '../ABI/SofiaFeeProxy'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { useWalletFromStorage } from './useWalletFromStorage'
import { BlockchainService, globalStakeService } from '../lib/services'
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

      // Redeem must go directly to MultiVault (proxy doesn't support redeem for security)
      const contractAddress = BlockchainService.getMultiVaultAddress()
      const curveId = 1

      // 1. Read shares using public client (no wallet interaction needed)
      const publicClient = getPublicClient()

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
        sharesToRedeem = userShares
      } else {
        sharesToRedeem = (userShares * weightToRemove) / totalAssets
      }

      const txArgs = [
        address as Address,
        tripleVaultId as `0x${string}`,
        curveId,
        sharesToRedeem,
        0n
      ] as const

      // 2. Get wallet client right before write (minimize timeout window)
      const { walletClient, publicClient: txPublicClient } = await getClients()

      // 3. Simulate first for better error messages
      await txPublicClient.simulateContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: 'redeem',
        args: txArgs,
        account: address as Address
      })

      logger.debug('Executing redeem transaction', { sharesToRedeem: sharesToRedeem.toString() })

      // 4. Send transaction (gas estimated automatically)
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: MultiVaultAbi,
        functionName: 'redeem',
        args: txArgs,
        chain: SELECTED_CHAIN,
        account: address as Address
      })

      const receipt = await txPublicClient.waitForTransactionReceipt({ hash })

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
   * Deposit with automatic Global Stake pool split.
   * If GS is enabled and split is valid, uses depositBatch (1 TX for signal + pool).
   * Otherwise falls back to a single deposit.
   */
  const depositWithPool = async (
    tripleVaultId: string,
    depositAmount: bigint,
    curveId: bigint = 1n
  ): Promise<WeightResult> => {
    try {
      if (!address) {
        throw new Error('No wallet connected')
      }

      const split = globalStakeService.isEnabled()
        ? globalStakeService.calculateSplit(depositAmount)
        : null

      const { walletClient, publicClient } = await getClients()
      const contractAddress = BlockchainService.getContractAddress()

      if (split) {
        // depositBatch: signal vault + GS pool vault = 1 MetaMask popup
        const config = globalStakeService.getConfig()
        const termIds = [tripleVaultId as Address, config.termId as Address]
        const curveIds = [curveId, config.curveId]
        const assets = [split.mainAmount, split.globalAmount]
        const minShares = [0n, 0n]
        const totalDeposit = split.mainAmount + split.globalAmount
        const fee = await BlockchainService.calculateDepositFee(2, totalDeposit)
        const totalValue = totalDeposit + fee

        logger.debug('depositWithPool batch', {
          signalAmount: split.mainAmount.toString(),
          globalAmount: split.globalAmount.toString(),
          fee: fee.toString(),
          totalValue: totalValue.toString()
        })

        // Simulate first
        await publicClient.simulateContract({
          address: contractAddress,
          abi: SofiaFeeProxyAbi,
          functionName: 'depositBatch',
          args: [address as Address, termIds, curveIds, assets, minShares],
          value: totalValue,
          account: address as Address
        })

        // Execute
        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: SofiaFeeProxyAbi,
          functionName: 'depositBatch',
          args: [address as Address, termIds, curveIds, assets, minShares],
          value: totalValue,
          chain: SELECTED_CHAIN,
          account: address as Address
        })

        logger.debug('depositBatch transaction sent', { hash })

        const receipt = await publicClient.waitForTransactionReceipt({ hash })

        if (receipt.status !== 'success') {
          throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
        }

        logger.debug('depositWithPool successful', { hash })
        return { success: true, txHash: hash }
      } else {
        // Single deposit (GS disabled or amount too small)
        const totalCost = await BlockchainService.getTotalDepositCost(depositAmount)

        logger.debug('depositWithPool single', {
          depositAmount: depositAmount.toString(),
          totalCost: totalCost.toString(),
          curveId: curveId.toString()
        })

        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: SofiaFeeProxyAbi,
          functionName: 'deposit' as const,
          args: [
            address as Address,
            tripleVaultId as `0x${string}`,
            curveId,
            0n
          ],
          value: totalCost,
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

        logger.debug('depositWithPool single successful', { hash })
        return { success: true, txHash: hash }
      }
    } catch (error) {
      logger.error('depositWithPool failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      return {
        success: false,
        error: `Deposit failed: ${errorMessage}`
      }
    }
  }

  return {
    addWeight,
    addShares,
    removeWeight,
    depositWithPool
  }
}