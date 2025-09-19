import { useState } from 'react'
import { getClients } from '../lib/clients/viemClients'
import { MULTIVAULT_V2_ABI } from '../contracts/ABIs'
import { SELECTED_CHAIN } from '../lib/config/config'
import { useCreateAtom, type AtomIPFSData } from './useCreateAtom'
import { useCheckExistingTriple } from './useCheckExistingTriple'
import { useStorage } from "@plasmohq/storage/hook"
import { usePinThingMutation } from "@0xintuition/graphql"
import { stringToHex, keccak256 } from 'viem'

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
  const { mutateAsync: pinThing } = usePinThingMutation()
  const [address] = useStorage<string>("metamask-account")
  
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [currentStep, setCurrentStep] = useState('')
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, phase: '' })

  const createTripleOnChain = async (
    predicateName: string, // ex: "has visited", "loves"
    objectData: { name: string; description?: string; url: string },
    customWeight?: bigint // Optional custom weight/value for the triple
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
      // NOTE: Atoms ALWAYS use default cost, customWeight is ONLY for the final triplet
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
      // NOTE: Atoms ALWAYS use default cost, customWeight is ONLY for the final triplet
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
      // NOTE: Atoms ALWAYS use default cost, customWeight is ONLY for the final triplet
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

        // Get triple cost (default or custom) - ONLY for the final triplet creation
        let tripleCost: bigint
        if (customWeight) {
          tripleCost = customWeight
          console.log('💰 Using custom triple weight (FINAL TRIPLET ONLY):', tripleCost.toString())
        } else {
          tripleCost = await publicClient.readContract({
            address: contractAddress,
            abi: MULTIVAULT_V2_ABI,
            functionName: 'getTripleCost'
          }) as bigint
          console.log('💰 Using default triple cost (FINAL TRIPLET ONLY):', tripleCost.toString())
        }

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
    setBatchProgress({ current: 0, total: 100, phase: 'starting' })
    
    try {
      console.log(`🔗 Starting optimized batch creation of ${inputs.length} triples`)
      
      if (!address) {
        throw new Error('No wallet connected')
      }

      // Phase 1: Collect all unique atoms needed (0-10%)
      setCurrentStep('Analyzing required atoms...')
      setBatchProgress({ current: 5, total: 100, phase: 'analyzing' })
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

      console.log(`📋 Need ${uniqueAtoms.size} unique atoms`)

      // Phase 2: Check existing atoms and prepare batch creation (10-30%)
      setCurrentStep(`Checking ${uniqueAtoms.size} existing atoms...`)
      setBatchProgress({ current: 15, total: 100, phase: 'checking_atoms' })
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
            console.log(`✅ Atom exists: ${atomData.name}`)
            atomResults.set(key, atomHash)
          } else {
            console.log(`🆕 Will create atom: ${atomData.name}`)
            atomsToCreate.push({ key, atomData, ipfsUri, atomHash })
          }
        } catch (error) {
          console.error(`❌ Failed to prepare atom ${atomData.name}:`, error)
          throw new Error(`Failed to prepare required atom: ${atomData.name}`)
        }
      }

      // Phase 2b: Create all missing atoms in ONE batch transaction (30-60%)
      if (atomsToCreate.length > 0) {
        setCurrentStep(`Creating ${atomsToCreate.length} atoms on-chain...`)
        setBatchProgress({ current: 35, total: 100, phase: 'creating_atoms' })
        console.log(`🆕 Creating ${atomsToCreate.length} atoms in one transaction`)

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

        console.log(`🚀 Sending batch atom transaction, value: ${totalValue.toString()}`)

        setBatchProgress({ current: 45, total: 100, phase: 'sending_atoms' })
        setCurrentStep('Sending atoms transaction...')

        // Create all atoms in one transaction
        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'createAtoms',
          args: [encodedDataArray, atomCostsArray],
          value: totalValue,
          gas: 2000000n * BigInt(atomsToCreate.length), // Scale gas with number of atoms
          chain: SELECTED_CHAIN,
          account: address as `0x${string}`
        })

        console.log(`🔗 Batch atom transaction sent: ${hash}`)

        setBatchProgress({ current: 55, total: 100, phase: 'confirming_atoms' })
        setCurrentStep('Confirming atoms transaction...')

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        
        if (receipt.status !== 'success') {
          throw new Error(`Batch atom transaction failed with status: ${receipt.status}`)
        }

        // Store the atom results using calculated hashes
        for (const atom of atomsToCreate) {
          atomResults.set(atom.key, atom.atomHash)
        }

        setBatchProgress({ current: 60, total: 100, phase: 'atoms_confirmed' })
        console.log(`✅ Batch atom transaction confirmed: ${atomsToCreate.length} atoms created`)
      }

      // Phase 3: Check existing triples and group new ones for batch creation (60-75%)
      setCurrentStep('Verifying existing triples...')
      setBatchProgress({ current: 65, total: 100, phase: 'checking_triples' })
      const results: TripleOnChainResult[] = []
      const triplesToCreate: {
        subjectId: string
        predicateId: string  
        objectId: string
        originalInput: BatchTripleInput
        index: number
      }[] = []

      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i]
        
        const userVaultId = atomResults.get(`user:${address}`)!
        const predicateVaultId = atomResults.get(`predicate:${input.predicateName}`)!
        const objectVaultId = atomResults.get(`object:${input.objectData.name}`)!

        // Check if triple already exists
        const tripleCheck = await checkTripleExists(userVaultId, predicateVaultId, objectVaultId)
        
        if (tripleCheck.exists) {
          console.log(`✅ Triple already exists: ${input.predicateName}`)
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
              index: i
            })
          } else {
            console.log(`🔄 Skipping duplicate triple: ${input.predicateName} - ${input.objectData.name}`)
          }
        }
      }

      // Phase 4: Create new triples in batch (if any) (75-100%)
      if (triplesToCreate.length > 0) {
        setCurrentStep(`Creating ${triplesToCreate.length} triples on-chain...`)
        setBatchProgress({ current: 75, total: 100, phase: 'creating_triples' })
        console.log(`🔗 Creating ${triplesToCreate.length} new triples in batch`)

        const { walletClient, publicClient } = await getClients()
        const contractAddress = "0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d"

        // Get triple cost
        const tripleCost = await publicClient.readContract({
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'getTripleCost'
        }) as bigint

        // Prepare batch arrays
        const subjectIds = triplesToCreate.map(t => t.subjectId as `0x${string}`)
        const predicateIds = triplesToCreate.map(t => t.predicateId as `0x${string}`)
        const objectIds = triplesToCreate.map(t => t.objectId as `0x${string}`)
        const tripleCosts = triplesToCreate.map(() => tripleCost)

        const totalValue = tripleCost * BigInt(triplesToCreate.length)

        console.log(`🚀 Sending batch triple transaction, value: ${totalValue.toString()}`)

        setBatchProgress({ current: 85, total: 100, phase: 'sending_triples' })
        setCurrentStep('Sending triples transaction...')

        // Simulate first
        const simulation = await publicClient.simulateContract({
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'createTriples',
          args: [subjectIds, predicateIds, objectIds, tripleCosts],
          value: totalValue,
          account: walletClient.account
        })

        // Execute batch transaction
        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'createTriples',
          args: [subjectIds, predicateIds, objectIds, tripleCosts],
          value: totalValue,
          chain: SELECTED_CHAIN,
          account: address as `0x${string}`
        })

        console.log(`🔗 Batch transaction sent: ${hash}`)

        setBatchProgress({ current: 95, total: 100, phase: 'confirming_triples' })
        setCurrentStep('Confirming triples transaction...')

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

        setBatchProgress({ current: 100, total: 100, phase: 'completed' })
        console.log(`✅ Batch transaction confirmed: ${triplesToCreate.length} triples created`)
      }

      setBatchProgress({ current: 100, total: 100, phase: 'finalizing' })
      setCurrentStep('Batch completed successfully!')

      const summary = {
        total: inputs.length,
        existing: results.filter(r => r.source === 'existing').length,
        created: results.filter(r => r.source === 'created').length,
        uniqueAtoms: uniqueAtoms.size,
        batchTransactions: triplesToCreate.length > 0 ? 1 : 0
      }

      console.log(`✅ Optimized batch completed:`, summary)
      
      return {
        success: true,
        results,
        txHash: triplesToCreate.length > 0 ? results.find(r => r.txHash && r.txHash !== 'existing')?.txHash : undefined,
        failedTriples: []
      }
      
    } catch (error) {
      console.error('❌ Optimized batch creation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setBatchProgress({ current: 0, total: 100, phase: 'error' })
      setCurrentStep(`Batch failed: ${errorMessage}`)
      setError(new Error(`Batch creation failed: ${errorMessage}`))
      throw new Error(`Batch creation failed: ${errorMessage}`)
    } finally {
      setIsCreating(false)
      setTimeout(() => {
        setCurrentStep('')
        setBatchProgress({ current: 0, total: 0, phase: '' })
      }, 3000) // Clear after 3 seconds
    }
  }

  return { 
    createTripleOnChain,
    createTriplesBatch,
    isCreating, 
    error,
    currentStep,
    batchProgress
  }
}