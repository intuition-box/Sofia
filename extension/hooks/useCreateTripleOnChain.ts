import { useState } from 'react'
import { getClients } from '../lib/clients/viemClients'
import { MULTIVAULT_V2_ABI } from '../contracts/ABIs'
import { SELECTED_CHAIN } from '../lib/config/config'
import { useCreateAtom, type AtomIPFSData } from './useCreateAtom'
import { useCheckExistingTriple } from './useCheckExistingTriple'
import { useStorage } from "@plasmohq/storage/hook"
import { usePinThingMutation } from "@0xintuition/graphql"
import { stringToHex, keccak256 } from 'viem'
import { sessionWallet } from '../lib/services/sessionWallet'

export interface TripleOnChainResult {
  success: boolean
  tripleVaultId: string
  txHash?: string
  subjectVaultId: string
  predicateVaultId: string
  objectVaultId: string
  source: 'created' | 'existing'
  tripleHash: string
}

export interface BatchTripleInput {
  predicateName: string
  objectData: { name: string; description?: string; url: string }
  customWeight?: bigint
}

export interface BatchTripleResult {
  success: boolean
  results: TripleOnChainResult[]
  txHash?: string
  failedTriples: { input: BatchTripleInput; error: string }[]
}


export const useCreateTripleOnChain = () => {
  const { createAtomWithMultivault } = useCreateAtom()
  const { checkTripleExists } = useCheckExistingTriple()
  const { mutateAsync: pinThing } = usePinThingMutation()
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
  const executeTransaction = async (txParams: any): Promise<string> => {
    const canUseSession = shouldUseSessionWallet(txParams.value || 0n)
    
    if (canUseSession) {
      return await sessionWallet.executeTransaction(txParams)
    } else {
      const { walletClient } = await getClients()
      return await walletClient.writeContract(txParams)
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
        url: `https://etherscan.io/address/${address}`
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
      const tripleCheck = await checkTripleExists(
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
        const contractAddress = "0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d"

        const tripleCost = customWeight || await publicClient.readContract({
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'getTripleCost'
        }) as bigint

        const subjectId = userAtom.vaultId as `0x${string}`
        const predicateId = predicateAtom.vaultId as `0x${string}`
        const objectId = objectAtom.vaultId as `0x${string}`
        
        const txParams = {
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'createTriples',
          args: [
            [subjectId],    // bytes32[]
            [predicateId],  // bytes32[]
            [objectId],     // bytes32[]
            [tripleCost]    // uint256[]
          ],
          value: tripleCost,
          chain: SELECTED_CHAIN,
          gas: 2000000n,
          maxFeePerGas: 50000000000n,
          maxPriorityFeePerGas: 10000000000n
        }

        const hash = await executeTransaction(txParams)

        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        
        if (receipt.status !== 'success') {
          throw new Error(`Transaction failed with status: ${receipt.status}`)
        }

        // Simulate to get the result after successful transaction
        const simulation = await publicClient.simulateContract({
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'createTriples',
          args: [[subjectId], [predicateId], [objectId], [tripleCost]],
          value: tripleCost,
          account: walletClient.account
        })

        const tripleIds = simulation.result as `0x${string}`[]
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(new Error(`Triple creation failed: ${errorMessage}`))
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
        throw new Error('No wallet connected')
      }
      const uniqueAtoms = new Map<string, { name: string; description?: string; url: string; type: string }>()
      
      // User atom (always needed)
      uniqueAtoms.set(`user:${address}`, {
        name: address,
        description: `User atom for wallet ${address}`,
        url: `https://etherscan.io/address/${address}`,
        type: 'user'
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
          type: 'object'
        })
      }

      const atomResults = new Map<string, string>() // key -> vaultId
      const atomsToCreate: { key: string; atomData: AtomIPFSData; ipfsUri: string; atomHash: string }[] = []

      // Check each atom and prepare those that need creation
      for (const [key, atomData] of uniqueAtoms) {
        try {
          // Pin to IPFS first
          const result = await pinThing({
            name: atomData.name,
            description: atomData.description || "Contenu visité par l'utilisateur.",
            image: "",
            url: atomData.url
          })

          if (!result.pinThing?.uri) {
            throw new Error(`Failed to pin atom metadata for ${atomData.name}`)
          }

          const ipfsUri = result.pinThing.uri
          const atomHash = keccak256(stringToHex(ipfsUri))

          // Check if atom already exists
          const { publicClient } = await getClients()
          const contractAddress = "0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d"
          
          const atomExists = await publicClient.readContract({
            address: contractAddress,
            abi: MULTIVAULT_V2_ABI,
            functionName: 'isTermCreated',
            args: [atomHash]
          }) as boolean
          
          if (atomExists) {
            atomResults.set(key, atomHash)
          } else {
            atomsToCreate.push({ key, atomData, ipfsUri, atomHash })
          }
        } catch (error) {
          throw new Error(`Failed to prepare required atom: ${atomData.name}`)
        }
      }

      if (atomsToCreate.length > 0) {

        const { walletClient, publicClient } = await getClients()
        const contractAddress = "0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d"

        // Get atom cost
        const atomCost = await publicClient.readContract({
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'getAtomCost'
        }) as bigint

        // Prepare batch arrays
        const encodedDataArray = atomsToCreate.map(atom => stringToHex(atom.ipfsUri))
        const atomCostsArray = atomsToCreate.map(() => atomCost)
        const totalValue = atomCost * BigInt(atomsToCreate.length)


        // Create all atoms in one transaction (automatic or MetaMask)
        const atomsTxParams = {
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'createAtoms',
          args: [encodedDataArray, atomCostsArray],
          value: totalValue,
          gas: 2000000n * BigInt(atomsToCreate.length), // Scale gas with number of atoms
          chain: SELECTED_CHAIN,
          maxFeePerGas: 50000000000n,
          maxPriorityFeePerGas: 10000000000n,
          account: address as `0x${string}`
        }

        const hash = await executeTransaction(atomsTxParams)

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        
        if (receipt.status !== 'success') {
          throw new Error(`Batch atom transaction failed with status: ${receipt.status}`)
        }

        // Store the atom results using calculated hashes
        for (const atom of atomsToCreate) {
          atomResults.set(atom.key, atom.atomHash)
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
        const tripleCheck = await checkTripleExists(userVaultId, predicateVaultId, objectVaultId)
        
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
        const contractAddress = "0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d"

        // Get default triple cost
        const defaultTripleCost = await publicClient.readContract({
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'getTripleCost'
        }) as bigint

        // Prepare batch arrays with individual custom weights
        const subjectIds = triplesToCreate.map(t => t.subjectId as `0x${string}`)
        const predicateIds = triplesToCreate.map(t => t.predicateId as `0x${string}`)
        const objectIds = triplesToCreate.map(t => t.objectId as `0x${string}`)
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
          account: address as `0x${string}`
        }

        const hash = await executeTransaction(batchTxParams)

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        
        if (receipt.status !== 'success') {
          throw new Error(`Batch transaction failed with status: ${receipt.status}`)
        }

        // Add successful results
        const tripleIds = simulation.result as `0x${string}`[]
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