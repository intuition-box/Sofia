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
      
      // 1. Récupérer/créer l'atom User
      setCurrentStep('Récupération de l\'atom User...')
      let userAtom
      try {
        userAtom = await getUserAtom(USER_ATOM_IPFS_URI)
        console.log('👤 User atom found, VaultID:', userAtom.vaultId)
      } catch (error) {
        console.log('⚠️ User atom not found, creating it automatically...')
        setCurrentStep('Création de l\'atom User...')
        
        // Créer l'atom User automatiquement avec les mêmes métadonnées
        const userAtomResult = await checkAndCreateAtom({
          name: 'User',
          description: 'Atom représentant l\'utilisateur dans le système',
          url: '' // URL vide pour l'atom User
        })
        
        userAtom = {
          vaultId: userAtomResult.vaultId,
          ipfsUri: userAtomResult.ipfsUri,
          name: 'User'
        }
        console.log('👤 User atom created, VaultID:', userAtom.vaultId)
      }
      
      // 2. Récupérer/créer l'atom Predicate
      setCurrentStep('Récupération de l\'atom Predicate...')
      const predicateIpfsUri = getPredicateIpfsUri(predicateName)
      let predicateAtom
      
      if (!predicateIpfsUri) {
        // Si le predicate n'est pas dans le mapping, le créer automatiquement
        console.log(`⚠️ Predicate "${predicateName}" not in mapping, creating it automatically...`)
        setCurrentStep('Création de l\'atom Predicate...')
        
        const predicateAtomResult = await checkAndCreateAtom({
          name: predicateName,
          description: `Predicate représentant la relation "${predicateName}"`,
          url: '' // URL vide pour les predicates
        })
        
        predicateAtom = {
          vaultId: predicateAtomResult.vaultId,
          ipfsUri: predicateAtomResult.ipfsUri,
          name: predicateName
        }
        console.log('🔗 Predicate atom created, VaultID:', predicateAtom.vaultId)
      } else {
        // Essayer de récupérer le predicate existant
        try {
          predicateAtom = await getPredicateAtom(predicateIpfsUri, predicateName)
          console.log('🔗 Predicate atom found, VaultID:', predicateAtom.vaultId)
        } catch (error) {
          console.log(`⚠️ Predicate "${predicateName}" not found with URI, creating it automatically...`)
          setCurrentStep('Création de l\'atom Predicate...')
          
          const predicateAtomResult = await checkAndCreateAtom({
            name: predicateName,
            description: `Predicate représentant la relation "${predicateName}"`,
            url: '' // URL vide pour les predicates
          })
          
          predicateAtom = {
            vaultId: predicateAtomResult.vaultId,
            ipfsUri: predicateAtomResult.ipfsUri,
            name: predicateName
          }
          console.log('🔗 Predicate atom created, VaultID:', predicateAtom.vaultId)
        }
      }
      
      // 3. Créer/récupérer l'atom Object
      setCurrentStep('Création/récupération de l\'atom Object...')
      const objectAtom = await checkAndCreateAtom(objectData)
      console.log('📄 Object atom VaultID:', objectAtom.vaultId)
      
      // 4. Vérifier si le triplet existe déjà
      setCurrentStep('Vérification de l\'existence du triplet...')
      const tripleCheck = await checkTripleExists(
        userAtom.vaultId,
        predicateAtom.vaultId,
        objectAtom.vaultId
      )
      
      if (tripleCheck.exists) {
        // Triplet existe déjà
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
        // Créer le triplet
        setCurrentStep('Création du triplet on-chain...')
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
        // Convert vaultIds to bytes32 format if needed
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

        // V2 returns bytes32[] instead of uint256
        const tripleIds = simulation.result as `0x${string}`[]
        const tripleVaultId = tripleIds[0] // First triple ID

        console.log('✅ Triple created successfully!', { tripleVaultId, hash })
        
        return {
          success: true,
          tripleVaultId: tripleVaultId, // V2 uses bytes32 as string
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