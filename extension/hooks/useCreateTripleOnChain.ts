import { useState } from 'react'
import { getClients } from '../lib/viemClients'

const MULTIVAULT_V2_ABI = [
  {
    "type": "function",
    "name": "getTripleCost",
    "inputs": [],
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createTriples",
    "inputs": [
      {"type": "bytes32[]", "name": "subjectIds"},
      {"type": "bytes32[]", "name": "predicateIds"},
      {"type": "bytes32[]", "name": "objectIds"},
      {"type": "uint256[]", "name": "assets"}
    ],
    "outputs": [{"type": "bytes32[]", "name": ""}],
    "stateMutability": "payable"
  }
]
import { useGetExistingAtoms } from './useGetExistingAtoms'
import { useCheckExistingAtom } from './useCheckExistingAtom'
import { useCheckExistingTriple } from './useCheckExistingTriple'
import { useStorage } from "@plasmohq/storage/hook"
import { USER_ATOM_IPFS_URI, getPredicateIpfsUri, PREDICATES_MAPPING } from '../const/atomsMapping'

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

export const useCreateTripleOnChain = () => {
  const { getUserAtom, getPredicateAtom } = useGetExistingAtoms()
  const { checkAndCreateAtom } = useCheckExistingAtom()
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
      
      // 1. Create User atom specific to connected wallet
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
      
      // 2. Create/retrieve Predicate atom
      setCurrentStep('Retrieving Predicate atom...')
      const predicateIpfsUri = getPredicateIpfsUri(predicateName)
      let predicateAtom
      
      if (!predicateIpfsUri) {
        console.log(`⚠️ Predicate "${predicateName}" not in mapping, creating it automatically...`)
        setCurrentStep('Creating Predicate atom...')
        
        const predicateAtomResult = await checkAndCreateAtom({
          name: predicateName,
          description: `Predicate representing the relation "${predicateName}"`,
          url: ''
        })
        
        predicateAtom = {
          vaultId: predicateAtomResult.vaultId,
          ipfsUri: predicateAtomResult.ipfsUri,
          name: predicateName
        }
        console.log('🔗 Predicate atom created, VaultID:', predicateAtom.vaultId)
      } else {
        try {
          predicateAtom = await getPredicateAtom(predicateIpfsUri, predicateName)
          console.log('🔗 Predicate atom found, VaultID:', predicateAtom.vaultId)
        } catch (error) {
          console.log(`⚠️ Predicate "${predicateName}" not found with URI, creating it automatically...`)
          setCurrentStep('Creating Predicate atom...')
          
          const predicateAtomResult = await checkAndCreateAtom({
            name: predicateName,
            description: `Predicate representing the relation "${predicateName}"`,
            url: ''
          })
          
          predicateAtom = {
            vaultId: predicateAtomResult.vaultId,
            ipfsUri: predicateAtomResult.ipfsUri,
            name: predicateName
          }
          console.log('🔗 Predicate atom created, VaultID:', predicateAtom.vaultId)
        }
      }
      
      // 3. Create/retrieve Object atom
      setCurrentStep('Creating/retrieving Object atom...')
      const objectAtom = await checkAndCreateAtom(objectData)
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

        console.log('✅ Simulation successful, creating triple with V2...')

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
        
        // Generate a placeholder triple ID since we can't get the real one
        const placeholderTripleId = `existing_${Date.now()}`
        
        return {
          success: true,
          tripleVaultId: placeholderTripleId,
          subjectVaultId: userAtom.vaultId,
          predicateVaultId: predicateAtom.vaultId,
          objectVaultId: objectAtom.vaultId,
          source: 'existing' as const,
          tripleHash: tripleCheck.tripleHash
        }
      }
      
      setError(new Error(`Triple creation failed: ${errorMessage}`))
      throw new Error(`Triple creation failed: ${errorMessage}`)
    } finally {
      setIsCreating(false)
      setCurrentStep('')
    }
  }

  return { 
    createTripleOnChain, 
    isCreating, 
    error,
    currentStep
  }
}