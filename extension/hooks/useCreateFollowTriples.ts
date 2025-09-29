import { useCreateAtom } from './useCreateAtom'
import { useStorage } from "@plasmohq/storage/hook"
import { getClients } from '../lib/clients/viemClients'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { sessionWallet } from '../lib/services/sessionWallet'
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES } from '../lib/config/constants'
import type { TripleOnChainResult } from '../types/blockchain'
import type { Address, Hash } from 'viem'
import type { AccountAtom } from './useGetAtomAccount'

const logger = createHookLogger('useCreateFollowTriples')

export const useCreateFollowTriples = () => {
  const { createAtomWithMultivault } = useCreateAtom()
  const [address] = useStorage<string>("metamask-account")
  const [useSessionWallet] = useStorage<boolean>("sofia-use-session-wallet", false)

  // Utility function to create/get user atom (same pattern as useCreateTripleOnChain)
  const getUserAtom = async () => {
    if (!address) {
      throw new Error('No wallet connected')
    }
    
    return await createAtomWithMultivault({
      name: address,
      description: `User atom for wallet ${address}`,
      url: `https://etherscan.io/address/${address}`,
      type: 'account'
    })
  }

  // Use the official follow atom ID directly
  const getFollowPredicateId = (): string => {
    return '0x8f9b5dc2e7b8bd12f6762c839830672f1d13c08e72b5f09f194cafc153f2df8a'
  }

  // Helper function to determine which wallet to use
  const shouldUseSessionWallet = (transactionValue: bigint): boolean => {
    if (!useSessionWallet) return false

    const sessionStatus = sessionWallet.getStatus()
    if (!sessionStatus.isReady) return false

    return sessionWallet.canExecute(transactionValue)
  }

  // Helper function to execute transaction with appropriate wallet
  const executeTransaction = async (txParams: any): Promise<Hash> => {
    const canUseSession = shouldUseSessionWallet(txParams.value || 0n)

    const viemParams = {
      ...txParams,
      address: txParams.address as Address,
      account: txParams.account as Address
    }

    if (canUseSession) {
      return await sessionWallet.executeTransaction(viemParams) as Hash
    } else {
      const { walletClient } = await getClients()
      return await walletClient.writeContract(viemParams)
    }
  }

  const createFollowTriple = async (
    targetUser: AccountAtom,
    customWeight: bigint
  ): Promise<TripleOnChainResult> => {
    try {
      if (!address) {
        throw new Error('No wallet connected')
      }

      console.log('🔗 createFollowTriple - Creating User follow User triple (HYBRID OPTIMIZED)', {
        currentUser: address,
        targetUser: targetUser.label,
        targetTermId: targetUser.termId,
        customWeight: customWeight.toString()
      })

      // OPTIMIZED: Get user atom + use official follow atom ID directly + use indexer termId for target
      console.log('🚀 createFollowTriple - Getting user atom and using official follow atom ID')
      
    
      const userTermId = "0x8d61ecf6e15472e15b1a0f63cd77f62aa57e6edcd3871d7a841f1056fb42b216"
      const predicateTermId = getFollowPredicateId()
      const targetTermId = targetUser.termId

      console.log('🔗 createFollowTriple - All termIds obtained (optimized approach)', {
        userTermId,
        predicateTermId,
        targetTermId,
        userLabel: address,
        predicateLabel: 'follow (official)',
        targetLabel: targetUser.label,
        predicateSource: 'official_atom'
      })

      // Check if follow relationship already exists using termIds
      const tripleCheck = await BlockchainService.checkTripleExists(
        userTermId,
        predicateTermId,
        targetTermId
      )

      console.log('🔍 createFollowTriple - Triple existence check', {
        userTermId,
        predicateTermId,
        targetTermId,
        tripleExists: tripleCheck.exists,
        tripleVaultId: tripleCheck.tripleVaultId
      })

      if (tripleCheck.exists) {
        console.log('✅ createFollowTriple - Follow relationship already exists, returning existing triple')
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

      // Create the follow triple using termIds directly
      const { publicClient } = await getClients()
      const defaultCost = await BlockchainService.getTripleCost()
      const tripleCost = customWeight !== undefined ? customWeight : defaultCost

      console.log('💰 createFollowTriple - Final amount calculation', {
        customWeight: customWeight?.toString(),
        defaultCost: defaultCost.toString(),
        isUsingDefault: customWeight === undefined,
        finalTripleCost: tripleCost.toString()
      })

      // Simulate first to validate and get the result
      const simulation = await publicClient.simulateContract({
        address: BlockchainService.getContractAddress() as Address,
        abi: MultiVaultAbi,
        functionName: 'createTriples',
        args: [[userTermId as Address], [predicateTermId as Address], [targetTermId as Address], [tripleCost]],
        value: tripleCost,
        account: address as Address
      })

      const txParams = {
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
        // Remove hardcoded gas - let Viem estimate automatically
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
        account: address
      }

      const hash = await executeTransaction(txParams)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      // Use the simulation result (done before transaction)
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