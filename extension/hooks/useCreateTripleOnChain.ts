import { getClients } from '../lib/clients/viemClients'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { useCreateAtom } from './useCreateAtom'
import { useStorage } from "@plasmohq/storage/hook"
import { sessionWallet } from '../lib/services/sessionWallet'
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES, PREDICATE_IDS, SUBJECT_IDS } from '../lib/config/constants'
import type { TripleOnChainResult, BatchTripleInput, BatchTripleResult } from '../types/blockchain'
import type { Address, Hash, ContractWriteParams } from '../types/viem'

const logger = createHookLogger('useCreateTripleOnChain')


export const useCreateTripleOnChain = () => {
  const { createAtomWithMultivault } = useCreateAtom()
  const [address] = useStorage<string>("metamask-account")
  const [useSessionWallet] = useStorage<boolean>("sofia-use-session-wallet", false)
  
  // Utility function to get the universal "I" subject atom (shared between simple and batch)
  const getUserAtom = async () => {
    if (!address) {
      throw new Error('No wallet connected')
    }
    
    // Return the pre-existing "I" subject atom instead of creating one for each wallet
    return {
      vaultId: SUBJECT_IDS.I,
      success: true,
      ipfsUri: '',
      name: 'I'
    }
  }

  // Utility function to get predicate atom (shared between simple and batch)
  const getPredicateAtom = async (predicateName: string) => {
    if (predicateName === 'follow') {
      return {
        vaultId: PREDICATE_IDS.FOLLOW,
        ipfsUri: '',
        name: predicateName
      }
    } else {
      const predicateAtomResult = await createAtomWithMultivault({
        name: predicateName,
        description: `Predicate representing the relation "${predicateName}"`,
        url: ''
      })
      
      return {
        vaultId: predicateAtomResult.vaultId,
        ipfsUri: '',
        name: predicateName
      }
    }
  }

  // Helper function to determine which wallet to use
  const shouldUseSessionWallet = (transactionValue: bigint): boolean => {
    if (!useSessionWallet) return false
    
    const sessionStatus = sessionWallet.getStatus()
    if (!sessionStatus.isReady) return false
    
    // Check if session wallet has enough balance
    return sessionWallet.canExecute(transactionValue)
  }

  // Helper function to execute transaction with appropriate wallet
  const executeTransaction = async (txParams: ContractWriteParams): Promise<Hash> => {
    const canUseSession = shouldUseSessionWallet(txParams.value || 0n)
    
    // Ensure proper Address typing for viem
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

  const createTripleOnChain = async (
    predicateName: string, // ex: "has visited", "loves"
    objectData: { name: string; description?: string; url: string },
    customWeight?: bigint // Optional custom weight/value for the triple
  ): Promise<TripleOnChainResult> => {
    
    try {
      if (!address) {
        throw new Error('No wallet connected')
      }
      
      const userAtomResult = await getUserAtom()
      
      const userAtom = {
        vaultId: userAtomResult.vaultId,
        ipfsUri: '',
        name: 'I'  // Always "I" instead of wallet address
      }
      const predicateAtom = await getPredicateAtom(predicateName)
      const objectAtom = await createAtomWithMultivault(objectData)
      const tripleCheck = await BlockchainService.checkTripleExists(
        userAtom.vaultId,
        predicateAtom.vaultId,
        objectAtom.vaultId
      )
      
      if (tripleCheck.exists) {
        return {
          success: true,
          tripleVaultId: tripleCheck.tripleVaultId!,
          subjectVaultId: userAtom.vaultId,
          predicateVaultId: predicateAtom.vaultId,
          objectVaultId: objectAtom.vaultId,
          source: 'existing',
          tripleHash: tripleCheck.tripleHash
        }
      } else {
        const { walletClient, publicClient } = await getClients()
        const contractAddress = BlockchainService.getContractAddress()

        const defaultCost = await BlockchainService.getTripleCost()
        const tripleCost = customWeight !== undefined ? customWeight : defaultCost

        const subjectId = userAtom.vaultId as Address
        const predicateId = predicateAtom.vaultId as Address
        const objectId = objectAtom.vaultId as Address
        
        const txParams = {
          address: contractAddress,
          abi: MultiVaultAbi,
          functionName: 'createTriples',
          args: [
            [subjectId],
            [predicateId],
            [objectId],
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

        const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as Address })
        
        if (receipt.status !== 'success') {
          throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
        }

        // Simulate to get the result after successful transaction
        const simulation = await publicClient.simulateContract({
          address: contractAddress as Address,
          abi: MultiVaultAbi,
          functionName: 'createTriples',
          args: [[subjectId], [predicateId], [objectId], [tripleCost]],
          value: tripleCost,
          account: walletClient.account
        })

        const tripleIds = simulation.result as Address[]
        const tripleVaultId = tripleIds[0]
        
        return {
          success: true,
          tripleVaultId: tripleVaultId,
          txHash: hash,
          subjectVaultId: userAtom.vaultId,
          predicateVaultId: predicateAtom.vaultId,
          objectVaultId: objectAtom.vaultId,
          source: 'created',
          tripleHash: tripleCheck.tripleHash
        }
      }
    } catch (error) {
      logger.error('Triple creation failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      throw new Error(`${ERROR_MESSAGES.TRIPLE_CREATION_FAILED}: ${errorMessage}`)
    }
  }


  const createTriplesBatch = async (inputs: BatchTripleInput[]): Promise<BatchTripleResult> => {
    try {
      if (!address) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      }
      
      logger.debug('Starting batch triple creation', { count: inputs.length })
      const uniqueAtoms = new Map<string, { name: string; description?: string; url: string; type: string }>()
      
      // User atom (always needed) - will use the universal "I" subject
      const userAtomKey = `user:I`

      // Collect unique predicates and objects
      const uniquePredicates = new Set<string>()
      for (const input of inputs) {
        // Collect unique predicates
        uniquePredicates.add(input.predicateName)
        
        // Object atoms  
        uniqueAtoms.set(`object:${input.objectData.name}`, {
          name: input.objectData.name,
          description: input.objectData.description,
          url: input.objectData.url,
          type: 'thing'
        })
      }

      const atomResults = new Map<string, string>() // key -> vaultId

      // Create user atom first using utility function
      const userAtomResult = await getUserAtom()
      atomResults.set(userAtomKey, userAtomResult.vaultId)
      
      // Create/get all unique predicates using the SAME unified logic as simple function
      for (const predicateName of uniquePredicates) {
        const predicateAtom = await getPredicateAtom(predicateName)
        atomResults.set(`predicate:${predicateName}`, predicateAtom.vaultId)
      }
      
      // Create other atoms in parallel for better performance
      const atomPromises = Array.from(uniqueAtoms.entries()).map(async ([key, atomData]) => {
        try {
          logger.debug('Creating/getting atom', { key, name: atomData.name })
          
          const atomResult = await createAtomWithMultivault({
            name: atomData.name,
            description: atomData.description || "Contenu visité par l'utilisateur.",
            image: "",
            url: atomData.url,
            type: atomData.type
          })

          if (!atomResult.success) {
            throw new Error(`Failed to create/get atom for ${atomData.name}`)
          }

          logger.debug('Atom ready', { key, vaultId: atomResult.vaultId })
          return { key, vaultId: atomResult.vaultId }
        } catch (error) {
          logger.error('Failed to prepare atom', { name: atomData.name, error })
          throw new Error(`Failed to prepare required atom: ${atomData.name}`)
        }
      })

      // Wait for all non-user atoms to be created/retrieved in parallel
      const atomResultsArray = await Promise.all(atomPromises)
      
      // Populate the results map
      for (const { key, vaultId } of atomResultsArray) {
        atomResults.set(key, vaultId)
      }

      // All atoms are now created/retrieved individually above

      const results: TripleOnChainResult[] = []
      const triplesToCreate: {
        subjectId: string
        predicateId: string  
        objectId: string
        originalInput: BatchTripleInput
        index: number
        customWeight?: bigint
      }[] = []
      
      // Use Set for O(1) deduplication instead of O(n) some() calls
      const tripleKeysSet = new Set<string>()

      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i]
        
        const userVaultId = atomResults.get(`user:I`)!
        const predicateVaultId = atomResults.get(`predicate:${input.predicateName}`)!
        const objectVaultId = atomResults.get(`object:${input.objectData.name}`)!

        // Check if triple already exists
        const tripleCheck = await BlockchainService.checkTripleExists(userVaultId, predicateVaultId, objectVaultId)
        
        if (tripleCheck.exists) {
          results.push({
            success: true,
            tripleVaultId: tripleCheck.tripleVaultId!,
            subjectVaultId: userVaultId,
            predicateVaultId: predicateVaultId,
            objectVaultId: objectVaultId,
            source: 'existing',
            tripleHash: tripleCheck.tripleHash
          })
        } else {
          // Create unique key for deduplication (O(1) instead of O(n))
          const tripleKey = `${userVaultId}-${predicateVaultId}-${objectVaultId}`
          
          if (!tripleKeysSet.has(tripleKey)) {
            tripleKeysSet.add(tripleKey)
            triplesToCreate.push({
              subjectId: userVaultId,
              predicateId: predicateVaultId,
              objectId: objectVaultId,
              originalInput: input,
              index: i,
              customWeight: input.customWeight
            })
          }
        }
      }

      if (triplesToCreate.length > 0) {

        const { walletClient, publicClient } = await getClients()
        const contractAddress: Address = BlockchainService.getContractAddress() as Address

        // Get default triple cost using service
        const defaultTripleCost = await BlockchainService.getTripleCost()

        // Prepare batch arrays with individual custom weights
        const subjectIds = triplesToCreate.map(t => t.subjectId as Address)
        const predicateIds = triplesToCreate.map(t => t.predicateId as Address)
        const objectIds = triplesToCreate.map(t => t.objectId as Address)
        const tripleCosts = triplesToCreate.map(t => t.customWeight !== undefined ? t.customWeight : defaultTripleCost)

        const totalValue = tripleCosts.reduce((sum, cost) => sum + cost, 0n)

        // Simulate first to validate and get gas estimation
        const simulation = await publicClient.simulateContract({
          address: contractAddress,
          abi: MultiVaultAbi,
          functionName: 'createTriples',
          args: [subjectIds, predicateIds, objectIds, tripleCosts],
          value: totalValue,
          account: walletClient.account
        })

        // Execute batch transaction with automatic gas estimation
        const batchTxParams = {
          address: contractAddress,
          abi: MultiVaultAbi,
          functionName: 'createTriples',
          args: [subjectIds, predicateIds, objectIds, tripleCosts],
          value: totalValue,
          chain: SELECTED_CHAIN,
          // Remove hardcoded gas - let Viem estimate automatically
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: address
        }

        const hash = await executeTransaction(batchTxParams)

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        
        if (receipt.status !== 'success') {
          throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
        }

        // Add successful results
        const tripleIds = simulation.result as Address[]
        for (let i = 0; i < triplesToCreate.length; i++) {
          const triple = triplesToCreate[i]
          results.push({
            success: true,
            tripleVaultId: tripleIds[i],
            txHash: hash,
            subjectVaultId: triple.subjectId,
            predicateVaultId: triple.predicateId,
            objectVaultId: triple.objectId,
            source: 'created',
            tripleHash: tripleIds[i]
          })
        }

      }

      
      return {
        success: true,
        results,
        txHash: triplesToCreate.length > 0 ? results.find(r => r.txHash && r.txHash !== 'existing')?.txHash : undefined,
        failedTriples: []
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Batch creation failed: ${errorMessage}`)
    }
  }

  return { 
    createTripleOnChain,
    createTriplesBatch
  }
}