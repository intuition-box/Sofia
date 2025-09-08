import { useState } from 'react'
import { getClients } from '../lib/viemClients'
import { MULTIVAULT_V2_ABI } from '../contracts/ABIs'
import { SELECTED_CHAIN } from '../lib/config'
import { useCreateAtom } from './useCreateAtom'
import { useCheckExistingTriple } from './useCheckExistingTriple'
import { useStorage } from "@plasmohq/storage/hook"

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
  const [address] = useStorage<string>("metamask-account")
  
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [currentStep, setCurrentStep] = useState('')

  const createTripleOnChain = async (
    predicateName: string, // ex: "has visited", "loves"
    objectData: { name: string; description?: string; url: string }
  ): Promise<TripleOnChainResult> => {
    setIsCreating(true)
    setError(null)
    
    try {
      console.log('🔗 Starting triple creation on-chain...')
      console.log('Predicate:', predicateName, 'Object:', objectData.name)
      console.log('Connected wallet address:', address)
      
      if (!address) {
        throw new Error('No wallet connected')
      }
      
      // 1. Create User atom (always create, let contract handle duplicates)
      setCurrentStep('Creating User atom...')
      
      const userAtomResult = await createAtomWithMultivault({
        name: address,
        description: `User atom for wallet ${address}`,
        url: `https://etherscan.io/address/${address}`
      })
      
      const userAtom = {
        vaultId: userAtomResult.vaultId,
        ipfsUri: '', // Set by createAtomWithMultivault
        name: address
      }
      
      console.log('👤 User atom VaultID:', userAtom.vaultId)
      
      // 2. Create Predicate atom (always create, let contract handle duplicates)
      setCurrentStep('Creating Predicate atom...')
      const predicateAtomResult = await createAtomWithMultivault({
        name: predicateName,
        description: `Predicate representing the relation "${predicateName}"`,
        url: ''
      })
      
      const predicateAtom = {
        vaultId: predicateAtomResult.vaultId,
        ipfsUri: '', // Set by createAtomWithMultivault
        name: predicateName
      }
      console.log('🔗 Predicate atom VaultID:', predicateAtom.vaultId)
      
      // 3. Create Object atom (always create, let contract handle duplicates)
      setCurrentStep('Creating Object atom...')
      const objectAtom = await createAtomWithMultivault(objectData)
      console.log('📄 Object atom VaultID:', objectAtom.vaultId)
      
      // 4. Check if triple already exists
      setCurrentStep('Checking triple existence...')
      const tripleCheck = await checkTripleExists(
        userAtom.vaultId,
        predicateAtom.vaultId,
        objectAtom.vaultId
      )
      
      if (tripleCheck.exists) {
        console.log('✅ Triple already exists! VaultID:', tripleCheck.tripleVaultId)
        
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
        // Create the triple
        setCurrentStep('Creating triple on-chain...')
        console.log('🆕 Creating new triple...')
        
        const { walletClient, publicClient } = await getClients()
        const contractAddress = "0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d"

        // Get triple cost
        const tripleCost = await publicClient.readContract({
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'getTripleCost'
        }) as bigint

        console.log('💰 Triple cost:', tripleCost.toString())

        // V2 uses createTriples (plural) with bytes32[] arrays
        const subjectId = userAtom.vaultId as `0x${string}`
        const predicateId = predicateAtom.vaultId as `0x${string}`
        const objectId = objectAtom.vaultId as `0x${string}`
        
        console.log('🔗 Creating triple with V2:', { subjectId, predicateId, objectId })

        // Simulate first to check for errors
        const simulation = await publicClient.simulateContract({
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
          account: walletClient.account
        })


        // Execute the transaction
        console.log('🚀 Sending triple transaction with value:', tripleCost.toString())
        
        const hash = await walletClient.writeContract({
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
        })

        console.log('🔗 Transaction sent:', hash)

        // Wait for transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: hash
        })

        console.log('✅ Transaction confirmed:', receipt)
        console.log('📋 Receipt status:', receipt.status)
        
        if (receipt.status !== 'success') {
          throw new Error(`Transaction failed with status: ${receipt.status}`)
        }

        // V2 returns bytes32[] instead of uint256
        const tripleIds = simulation.result as `0x${string}`[]
        const tripleVaultId = tripleIds[0] // First triple ID

        console.log('✅ Triple created successfully!', { tripleVaultId, hash })
        
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
      console.error('❌ Triple creation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Check if error is due to triple already existing (signature 0x22319959 = TripleAlreadyExists)
      if (errorMessage.includes('0x22319959') || errorMessage.includes('TripleAlreadyExists')) {
        console.log('✅ Triple already exists on chain, treating as existing')
        
        // Since we can't access userAtom, predicateAtom, objectAtom, or tripleCheck in the catch block,
        // we'll throw an error that the calling code should handle by removing the triple from the list
        throw new Error('TRIPLE_ALREADY_EXISTS')
      }
      
      setError(new Error(`Triple creation failed: ${errorMessage}`))
      throw new Error(`Triple creation failed: ${errorMessage}`)
    } finally {
      setIsCreating(false)
      setCurrentStep('')
    }
  }


  const createTriplesBatch = async (inputs: BatchTripleInput[]): Promise<BatchTripleResult> => {
    setIsCreating(true)
    setError(null)
    
    try {
      console.log(`🔗 Starting batch creation of ${inputs.length} triples`)
      setCurrentStep(`Creating ${inputs.length} triples in batch...`)
      
      const results: TripleOnChainResult[] = []
      const failedTriples: { input: BatchTripleInput; error: string }[] = []
      
      // Process each triple individually
      for (const input of inputs) {
        try {
          const result = await createTripleOnChain(input.predicateName, input.objectData)
          results.push(result)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          failedTriples.push({ input, error: errorMessage })
          console.error(`❌ Failed to create triple for ${input.predicateName}:`, error)
        }
      }
      
      console.log(`✅ Batch completed: ${results.length} successful, ${failedTriples.length} failed`)
      
      return {
        success: failedTriples.length === 0,
        results,
        txHash: results.find(r => r.txHash)?.txHash,
        failedTriples
      }
      
    } catch (error) {
      console.error('❌ Batch creation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(new Error(`Batch creation failed: ${errorMessage}`))
      throw new Error(`Batch creation failed: ${errorMessage}`)
    } finally {
      setIsCreating(false)
      setCurrentStep('')
    }
  }

  return { 
    createTripleOnChain,
    createTriplesBatch,
    isCreating, 
    error,
    currentStep
  }
}