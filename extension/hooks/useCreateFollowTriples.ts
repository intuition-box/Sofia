import { useStorage } from "@plasmohq/storage/hook"
import { getClients } from '../lib/clients/viemClients'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES, PREDICATE_IDS, SUBJECT_IDS } from '../lib/config/constants'
import type { TripleOnChainResult } from '../types/blockchain'
import type { Address } from 'viem'
import type { AccountAtom } from './useGetAtomAccount'

const logger = createHookLogger('useCreateFollowTriples')

export const useCreateFollowTriples = () => {
  const [address] = useStorage<string>("metamask-account")


  const createFollowTriple = async (
    targetUser: AccountAtom,
    customWeight: bigint,
    userTermId: string = SUBJECT_IDS.I,
    predicateTermId: string = PREDICATE_IDS.FOLLOW
  ): Promise<TripleOnChainResult> => {
    try {
      if (!address) {
        throw new Error('No wallet connected')
      }

      const targetTermId = targetUser.termId

      const { publicClient, walletClient } = await getClients()
      const contractAddress = BlockchainService.getContractAddress()
      const defaultCost = await BlockchainService.getTripleCost()

      // Determine the amount to use
      const depositAmount = customWeight !== undefined && customWeight > 0n ? customWeight : defaultCost

      console.log('[Follow] Starting follow process:', {
        defaultCost: defaultCost.toString(),
        defaultCostInTRUST: Number(defaultCost) / 1e18,
        customWeight: customWeight?.toString(),
        depositAmount: depositAmount.toString(),
        depositAmountInTRUST: Number(depositAmount) / 1e18
      })

      // Check if the triple already exists
      const tripleCheck = await BlockchainService.checkTripleExists(
        userTermId,
        predicateTermId,
        targetTermId
      )

      console.log('[Follow] Triple existence check:', {
        exists: tripleCheck.exists,
        tripleVaultId: tripleCheck.tripleVaultId
      })

      let hash: Address
      let tripleVaultId: Address

      if (tripleCheck.exists && tripleCheck.tripleVaultId) {
        // Triple exists - use deposit() which allows any amount >= 0.01
        console.log('[Follow] Triple exists, using deposit() with amount:', depositAmount.toString())

        const curveId = 1 // Default curve ID for triples

        hash = await walletClient.writeContract({
          address: contractAddress as Address,
          abi: MultiVaultAbi,
          functionName: 'deposit',
          args: [
            address as Address, // receiver
            tripleCheck.tripleVaultId as Address, // termId (triple vault ID)
            curveId, // curveId
            0n // minShares (0 for no slippage protection)
          ],
          value: depositAmount, // Amount sent in value, not args!
          chain: SELECTED_CHAIN,
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: address as Address
        })

        tripleVaultId = tripleCheck.tripleVaultId as Address
      } else {
        // Triple doesn't exist - use createTriples() with minimum amount
        console.log('[Follow] Triple does not exist, using createTriples()')

        // For createTriples, we must use at least defaultCost
        const createAmount = depositAmount > defaultCost ? depositAmount : defaultCost

        console.log('[Follow] Using createTriples with amount:', {
          createAmount: createAmount.toString(),
          createAmountInTRUST: Number(createAmount) / 1e18
        })

        // Simulate first
        const simulation = await publicClient.simulateContract({
          address: contractAddress as Address,
          abi: MultiVaultAbi,
          functionName: 'createTriples',
          args: [[userTermId as Address], [predicateTermId as Address], [targetTermId as Address], [createAmount]],
          value: createAmount,
          account: address as Address
        })

        hash = await walletClient.writeContract({
          address: contractAddress as Address,
          abi: MultiVaultAbi,
          functionName: 'createTriples',
          args: [
            [userTermId as Address],
            [predicateTermId as Address],
            [targetTermId as Address],
            [createAmount]
          ],
          value: createAmount,
          chain: SELECTED_CHAIN,
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: address as Address
        })

        const tripleIds = simulation.result as Address[]
        tripleVaultId = tripleIds[0]
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      console.log('[Follow] Transaction successful:', {
        hash,
        tripleVaultId,
        method: tripleCheck.exists ? 'deposit' : 'createTriples'
      })

      return {
        success: true,
        tripleVaultId: tripleVaultId,
        txHash: hash,
        subjectVaultId: userTermId,
        predicateVaultId: predicateTermId,
        objectVaultId: targetTermId,
        source: tripleCheck.exists ? 'existing' : 'created',
        tripleHash: tripleVaultId
      }

    } catch (error) {
      logger.error('Follow triple creation failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      throw new Error(`Follow triple creation failed: ${errorMessage}`)
    }
  }

  return {
    createFollowTriple
  }
}