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

      if (!targetUser.ipfsUri) {
        throw new Error('Target user IPFS URI is missing')
      }

      console.log('🔗 createFollowTriple - Creating User follow User triple', {
        currentUser: address,
        targetUser: targetUser.label,
        targetIpfsUri: targetUser.ipfsUri,
        customWeight: customWeight.toString()
      })

      // Create/get current user atom
      const userAtomResult = await createAtomWithMultivault({
        name: address,
        description: `User atom for wallet ${address}`,
        url: `https://etherscan.io/address/${address}`,
        type: 'account'
      })

      // Create/get follow predicate atom
      const predicateAtomResult = await createAtomWithMultivault({
        name: 'follow',
        description: 'Predicate representing the relation "follow"',
        url: ''
      })

      // Use the termId directly as it's the atom identifier in Intuition
      const targetVaultId = targetUser.termId as Address

      console.log('🔗 createFollowTriple - Using termId directly as vaultId', {
        targetTermId: targetUser.termId,
        targetLabel: targetUser.label
      })

      console.log('🔗 createFollowTriple - Atom details', {
        userVaultId: userAtomResult.vaultId,
        predicateVaultId: predicateAtomResult.vaultId,
        targetVaultId: targetVaultId,
        targetTermId: targetUser.termId
      })

      // Check if follow relationship already exists
      const tripleCheck = await BlockchainService.checkTripleExists(
        userAtomResult.vaultId,
        predicateAtomResult.vaultId,
        targetVaultId
      )

      console.log('🔍 createFollowTriple - Triple existence check', {
        userVaultId: userAtomResult.vaultId,
        predicateVaultId: predicateAtomResult.vaultId,
        targetVaultId: targetVaultId,
        tripleExists: tripleCheck.exists,
        tripleVaultId: tripleCheck.tripleVaultId
      })

      if (tripleCheck.exists) {
        console.log('✅ createFollowTriple - Follow relationship already exists, returning existing triple')
        return {
          success: true,
          tripleVaultId: tripleCheck.tripleVaultId!,
          subjectVaultId: userAtomResult.vaultId,
          predicateVaultId: predicateAtomResult.vaultId,
          objectVaultId: targetVaultId,
          source: 'existing',
          tripleHash: tripleCheck.tripleHash
        }
      }

      // Get publicClient for transaction execution
      const { publicClient } = await getClients()

      // Verify that target atom exists on chain
      const targetExists = await publicClient.readContract({
        address: BlockchainService.getContractAddress() as Address,
        abi: MultiVaultAbi,
        functionName: 'isTermCreated',
        args: [targetVaultId]
      }) as boolean

      console.log('🔍 createFollowTriple - Target atom verification', {
        targetTermId: targetVaultId,
        targetExists,
        targetLabel: targetUser.label
      })

      if (!targetExists) {
        throw new Error(`Target user atom does not exist on MultiVault contract: ${targetUser.label} (${targetVaultId})`)
      }

      // Create the follow triple
      const tripleCost = customWeight === 0n
        ? await BlockchainService.getTripleCost()
        : customWeight

      console.log('💰 createFollowTriple - Final amount calculation', {
        customWeight: customWeight.toString(),
        isUsingDefault: customWeight === 0n,
        finalTripleCost: tripleCost.toString()
      })

      const txParams = {
        address: BlockchainService.getContractAddress() as Address,
        abi: MultiVaultAbi,
        functionName: 'createTriples',
        args: [
          [userAtomResult.vaultId as Address],
          [predicateAtomResult.vaultId as Address],
          [targetVaultId],
          [tripleCost]
        ],
        value: tripleCost,
        chain: SELECTED_CHAIN,
        gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
        account: address
      }

      const hash = await executeTransaction(txParams)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      // Simulate to get the result
      const simulation = await publicClient.simulateContract({
        address: BlockchainService.getContractAddress() as Address,
        abi: MultiVaultAbi,
        functionName: 'createTriples',
        args: [[userAtomResult.vaultId as Address], [predicateAtomResult.vaultId as Address], [targetVaultId], [tripleCost]],
        value: tripleCost,
        account: address as Address
      })

      const tripleIds = simulation.result as Address[]
      const tripleVaultId = tripleIds[0]

      console.log('✅ createFollowTriple - Follow triple created successfully', {
        txHash: hash,
        tripleVaultId: tripleVaultId
      })

      return {
        success: true,
        tripleVaultId: tripleVaultId,
        txHash: hash,
        subjectVaultId: userAtomResult.vaultId,
        predicateVaultId: predicateAtomResult.vaultId,
        objectVaultId: targetVaultId,
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