import { useState } from 'react'
import { getClients } from '../lib/viemClients'
import { MULTIVAULT_V2_ABI } from '../contracts/abis'
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
  totalCost: string
  failedTriples: Array<{ input: BatchTripleInput; error: string }>
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

  const createTriplesBatch = async (
    triplesToCreate: BatchTripleInput[]
  ): Promise<BatchTripleResult> => {
    setIsCreating(true)
    setError(null)
    
    const results: TripleOnChainResult[] = []
    const failedTriples: Array<{ input: BatchTripleInput; error: string }> = []
    
    try {
      console.log('🔗 Starting batch triple creation on-chain...')
      console.log('Number of triples to create:', triplesToCreate.length)
      console.log('Connected wallet address:', address)
      
      if (!address) {
        throw new Error('No wallet connected')
      }
      
      if (triplesToCreate.length === 0) {
        throw new Error('No triples to create')
      }
      
      // 1. Create User atom specific to connected wallet (shared by all triples)
      setCurrentStep('Creating/retrieving User atom for connected wallet...')
      
      const userAtomResult = await checkAndCreateAtom({
        name: address,
        description: `User atom for wallet ${address}`,
        url: `https://etherscan.io/address/${address}`
      })
      
      const userAtom = {
        vaultId: userAtomResult.vaultId,
        ipfsUri: userAtomResult.ipfsUri,
        name: address
      }
      
      console.log('👤 User atom for wallet', address, 'VaultID:', userAtom.vaultId)
      
      // 2. Prepare all atoms needed for the batch
      setCurrentStep('Preparing all atoms...')
      
      const tripleData: Array<{
        subjectId: string
        predicateId: string
        objectId: string
        input: BatchTripleInput
      }> = []
      
      for (let i = 0; i < triplesToCreate.length; i++) {
        const triple = triplesToCreate[i]
        setCurrentStep(`Preparing atoms for triple ${i + 1}/${triplesToCreate.length}...`)
        
        try {
          // Get/create predicate atom
          const predicateIpfsUri = getPredicateIpfsUri(triple.predicateName)
          let predicateAtom
          
          if (!predicateIpfsUri) {
            console.log(`⚠️ Predicate "${triple.predicateName}" not in mapping, creating it automatically...`)
            
            const predicateAtomResult = await checkAndCreateAtom({
              name: triple.predicateName,
              description: `Predicate representing the relation "${triple.predicateName}"`,
              url: ''
            })
            
            predicateAtom = {
              vaultId: predicateAtomResult.vaultId,
              ipfsUri: predicateAtomResult.ipfsUri,
              name: triple.predicateName
            }
          } else {
            try {
              predicateAtom = await getPredicateAtom(predicateIpfsUri, triple.predicateName)
            } catch (error) {
              console.log(`⚠️ Predicate "${triple.predicateName}" not found with URI, creating it automatically...`)
              
              const predicateAtomResult = await checkAndCreateAtom({
                name: triple.predicateName,
                description: `Predicate representing the relation "${triple.predicateName}"`,
                url: ''
              })
              
              predicateAtom = {
                vaultId: predicateAtomResult.vaultId,
                ipfsUri: predicateAtomResult.ipfsUri,
                name: triple.predicateName
              }
            }
          }
          
          // Get/create object atom
          const objectAtom = await checkAndCreateAtom(triple.objectData)
          
          // Check if triple already exists
          const tripleCheck = await checkTripleExists(
            userAtom.vaultId,
            predicateAtom.vaultId,
            objectAtom.vaultId
          )
          
          if (tripleCheck.exists) {
            console.log(`✅ Triple ${i + 1} already exists! VaultID:`, tripleCheck.tripleVaultId)
            
            results.push({
              success: true,
              tripleVaultId: tripleCheck.tripleVaultId!,
              subjectVaultId: userAtom.vaultId,
              predicateVaultId: predicateAtom.vaultId,
              objectVaultId: objectAtom.vaultId,
              source: 'existing',
              tripleHash: tripleCheck.tripleHash
            })
          } else {
            tripleData.push({
              subjectId: userAtom.vaultId,
              predicateId: predicateAtom.vaultId,
              objectId: objectAtom.vaultId,
              input: triple
            })
          }
        } catch (error) {
          console.error(`❌ Failed to prepare triple ${i + 1}:`, error)
          failedTriples.push({
            input: triple,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      // 3. Create all new triples in a single transaction
      let txHash: string | undefined
      let totalCost = '0'
      
      if (tripleData.length > 0) {
        setCurrentStep(`Creating ${tripleData.length} new triples on-chain...`)
        console.log(`🆕 Creating ${tripleData.length} new triples in batch...`)
        
        const { walletClient, publicClient } = await getClients()
        const contractAddress = "0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d"

        // Get triple cost per triple
        const tripleCost = await publicClient.readContract({
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'getTripleCost'
        }) as bigint

        console.log('💰 Triple cost per triple:', tripleCost.toString())
        
        // Prepare arrays for batch creation
        const subjectIds = tripleData.map(t => t.subjectId as `0x${string}`)
        const predicateIds = tripleData.map(t => t.predicateId as `0x${string}`)
        const objectIds = tripleData.map(t => t.objectId as `0x${string}`)
        const costs = tripleData.map(() => tripleCost)
        
        const batchCost = BigInt(tripleData.length) * tripleCost
        totalCost = batchCost.toString()
        
        console.log('🔗 Creating batch with:', { 
          count: tripleData.length,
          totalCost: totalCost,
          subjectIds: subjectIds.length,
          predicateIds: predicateIds.length,
          objectIds: objectIds.length
        })

        // Simulate first to check for errors
        const simulation = await publicClient.simulateContract({
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'createTriples',
          args: [
            subjectIds,    // bytes32[]
            predicateIds,  // bytes32[]
            objectIds,     // bytes32[]
            costs          // uint256[]
          ],
          value: batchCost,
          account: walletClient.account
        })

        console.log('✅ Batch simulation successful, creating triples...')

        // Execute the batch transaction
        console.log('🚀 Sending batch triple transaction with value:', batchCost.toString())
        
        txHash = await walletClient.writeContract({
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'createTriples',
          args: [
            subjectIds,    // bytes32[]
            predicateIds,  // bytes32[]
            objectIds,     // bytes32[]
            costs          // uint256[]
          ],
          value: batchCost,
          gas: BigInt(2000000 + (tripleData.length * 500000)), // Scale gas with number of triples
          maxFeePerGas: 50000000000n,
          maxPriorityFeePerGas: 10000000000n
        })

        console.log('🔗 Batch transaction sent:', txHash)

        // Wait for transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash
        })

        console.log('✅ Batch transaction confirmed:', receipt)
        console.log('📋 Receipt status:', receipt.status)
        
        if (receipt.status !== 'success') {
          throw new Error(`Batch transaction failed with status: ${receipt.status}`)
        }

        // Get the created triple IDs from simulation result
        const tripleIds = simulation.result as `0x${string}`[]
        
        // Add results for newly created triples
        for (let i = 0; i < tripleData.length; i++) {
          const triple = tripleData[i]
          const tripleVaultId = tripleIds[i]
          
          results.push({
            success: true,
            tripleVaultId: tripleVaultId,
            txHash: txHash,
            subjectVaultId: triple.subjectId,
            predicateVaultId: triple.predicateId,
            objectVaultId: triple.objectId,
            source: 'created',
            tripleHash: '' // We don't have the hash in batch mode
          })
        }

        console.log('✅ Batch triple creation successful!', { 
          created: tripleData.length,
          existing: results.filter(r => r.source === 'existing').length,
          failed: failedTriples.length,
          txHash 
        })
      }
      
      return {
        success: failedTriples.length === 0,
        results,
        txHash,
        totalCost,
        failedTriples
      }
      
    } catch (error) {
      console.error('❌ Batch triple creation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setError(new Error(`Batch triple creation failed: ${errorMessage}`))
      throw new Error(`Batch triple creation failed: ${errorMessage}`)
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