import { useState } from 'react'
import { getClients } from '../lib/clients/viemClients'
import { MULTIVAULT_V2_ABI } from '../contracts/ABIs'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { useCreateAtom } from './useCreateAtom'
import { useStorage } from "@plasmohq/storage/hook"
import { sessionWallet } from '../lib/services/sessionWallet'
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES } from '../lib/config/constants'
import type { TripleOnChainResult, BatchTripleInput, BatchTripleResult } from '../types/blockchain'
import type { Address, Hash, ContractWriteParams } from '../types/viem'

const logger = createHookLogger('useCreateTripleOnChain')


export const useCreateTripleOnChain = () => {
  const { createAtomWithMultivault } = useCreateAtom()
  const [address] = useStorage<string>("metamask-account")
  const [useSessionWallet] = useStorage<boolean>("sofia-use-session-wallet", false)
  
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

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
    setIsCreating(true)
    setError(null)
    
    try {
      if (!address) {
        throw new Error('No wallet connected')
      }
      
      const userAtomResult = await createAtomWithMultivault({
        name: address,
        description: `User atom for wallet ${address}`,
        url: `https://etherscan.io/address/${address}`,
        type:'account'
      })
      
      const userAtom = {
        vaultId: userAtomResult.vaultId,
        ipfsUri: '',
        name: address
      }
      const predicateAtomResult = await createAtomWithMultivault({
        name: predicateName,
        description: `Predicate representing the relation "${predicateName}"`,
        url: ''
      })
      
      const predicateAtom = {
        vaultId: predicateAtomResult.vaultId,
        ipfsUri: '',
        name: predicateName
      }
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

        const tripleCost = customWeight || await BlockchainService.getTripleCost()

        const subjectId = userAtom.vaultId as Address
        const predicateId = predicateAtom.vaultId as Address
        const objectId = objectAtom.vaultId as Address
        
        const txParams = {
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
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
          abi: MULTIVAULT_V2_ABI,
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
      setError(new Error(`${ERROR_MESSAGES.TRIPLE_CREATION_FAILED}: ${errorMessage}`))
      throw error
    } finally {
      setIsCreating(false)
    }
  }


  const createTriplesBatch = async (inputs: BatchTripleInput[]): Promise<BatchTripleResult> => {
    setIsCreating(true)
    setError(null)
    
    try {
      if (!address) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      }
      
      logger.debug('Starting batch triple creation', { count: inputs.length })
      const uniqueAtoms = new Map<string, { name: string; description?: string; url: string; type: string }>()
      
      // User atom (always needed)
      uniqueAtoms.set(`user:${address}`, {
        name: address,
        description: `User atom for wallet ${address}`,
        url: `https://etherscan.io/address/${address}`,
        type: 'account'
      })

      // Collect unique predicates and objects
      for (const input of inputs) {
        // Predicate atoms
        uniqueAtoms.set(`predicate:${input.predicateName}`, {
          name: input.predicateName,
          description: `Predicate representing the relation "${input.predicateName}"`,
          url: '',
          type: 'predicate'
        })
        
        // Object atoms  
        uniqueAtoms.set(`object:${input.objectData.name}`, {
          name: input.objectData.name,
          description: input.objectData.description,
          url: input.objectData.url,
          type: 'thing'
        })
      }

      const atomResults = new Map<string, string>() // key -> vaultId

      // Create each atom using the centralized service
      for (const [key, atomData] of uniqueAtoms) {
        try {
          logger.debug('Creating atom using centralized service', { key, name: atomData.name })
          
          const atomResult = await createAtomWithMultivault({
            name: atomData.name,
            description: atomData.description || "Contenu visité par l'utilisateur.",
            url: atomData.url,
            type: atomData.type
          })
          
          atomResults.set(key, atomResult.vaultId)
          logger.debug('Atom created successfully', { key, vaultId: atomResult.vaultId })
          
        } catch (error) {
          logger.error('Failed to create atom', { name: atomData.name, error })
          throw new Error(`Failed to create required atom: ${atomData.name}`)
        }
      }

      const results: TripleOnChainResult[] = []
      const triplesToCreate: {
        subjectId: string
        predicateId: string  
        objectId: string
        originalInput: BatchTripleInput
        index: number
        customWeight?: bigint
      }[] = []

      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i]
        
        const userVaultId = atomResults.get(`user:${address}`)!
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
          // Check if we already have this triple in our list to create
          const tripleExists = triplesToCreate.some(t => 
            t.subjectId === userVaultId && 
            t.predicateId === predicateVaultId && 
            t.objectId === objectVaultId
          )
          
          if (!tripleExists) {
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
        const tripleCosts = triplesToCreate.map(t => t.customWeight || defaultTripleCost)

        const totalValue = tripleCosts.reduce((sum, cost) => sum + cost, 0n)


        // Simulate first
        const simulation = await publicClient.simulateContract({
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'createTriples',
          args: [subjectIds, predicateIds, objectIds, tripleCosts],
          value: totalValue,
          account: walletClient.account
        })

        // Execute batch transaction (automatic or MetaMask)
        const batchTxParams = {
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'createTriples',
          args: [subjectIds, predicateIds, objectIds, tripleCosts],
          value: totalValue,
          chain: SELECTED_CHAIN,
          gas: 2000000n,
          maxFeePerGas: 50000000000n,
          maxPriorityFeePerGas: 10000000000n,
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
      setError(new Error(`Batch creation failed: ${errorMessage}`))
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  return { 
    createTripleOnChain,
    createTriplesBatch,
    isCreating, 
    error
  }
}