import { useStorage } from "@plasmohq/storage/hook"
import { getClients } from '../lib/clients/viemClients'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES, PREDICATE_IDS } from '../lib/config/constants'
import type { TripleOnChainResult } from '../types/blockchain'
import type { Address } from 'viem'
import type { AccountAtom } from './useGetAtomAccount'

const logger = createHookLogger('useCreateFollowTriples')

export const useCreateFollowTriples = () => {
  const [address] = useStorage<string>("metamask-account")


  const createFollowTriple = async (
    targetUser: AccountAtom,
    customWeight: bigint,
    userTermId: string = PREDICATE_IDS.USER_ID,
    predicateTermId: string = PREDICATE_IDS.FOLLOW
  ): Promise<TripleOnChainResult> => {
    try {
      if (!address) {
        throw new Error('No wallet connected')
      }

      const targetTermId = targetUser.termId
      const tripleCheck = await BlockchainService.checkTripleExists(
        userTermId,
        predicateTermId,
        targetTermId
      )

      if (tripleCheck.exists) {
        return {
          success: true,
          tripleVaultId: tripleCheck.tripleVaultId!,
          subjectVaultId: userTermId,
          predicateVaultId: predicateTermId,
          objectVaultId: targetTermId,
          source: 'existing',
          tripleHash: tripleCheck.tripleHash
        }
      }

      const { publicClient } = await getClients()
      const defaultCost = await BlockchainService.getTripleCost()
      const tripleCost = customWeight !== undefined ? customWeight : defaultCost

      const simulation = await publicClient.simulateContract({
        address: BlockchainService.getContractAddress() as Address,
        abi: MultiVaultAbi,
        functionName: 'createTriples',
        args: [[userTermId as Address], [predicateTermId as Address], [targetTermId as Address], [tripleCost]],
        value: tripleCost,
        account: address as Address
      })

      const { walletClient } = await getClients()
      const hash = await walletClient.writeContract({
        address: BlockchainService.getContractAddress() as Address,
        abi: MultiVaultAbi,
        functionName: 'createTriples',
        args: [
          [userTermId as Address],
          [predicateTermId as Address],
          [targetTermId as Address],
          [tripleCost]
        ],
        value: tripleCost,
        chain: SELECTED_CHAIN,
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
        account: address as Address
      })
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      const tripleIds = simulation.result as Address[]
      const tripleVaultId = tripleIds[0]

      return {
        success: true,
        tripleVaultId: tripleVaultId,
        txHash: hash,
        subjectVaultId: userTermId,
        predicateVaultId: predicateTermId,
        objectVaultId: targetTermId,
        source: 'created',
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