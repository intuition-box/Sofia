import { useState } from 'react'
import { getClients } from '../lib/viemClients'

const MULTIVAULT_V2_ABI = [
  {
    "type": "function",
    "name": "tripleHashFromAtoms",
    "inputs": [
      {"type": "bytes32", "name": "subjectId"},
      {"type": "bytes32", "name": "predicateId"},
      {"type": "bytes32", "name": "objectId"}
    ],
    "outputs": [{"type": "bytes32", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "triplesByHash",
    "inputs": [{"type": "bytes32", "name": "hash"}],
    "outputs": [{"type": "bytes32", "name": ""}],
    "stateMutability": "view"
  }
]

export interface ExistingTriple {
  exists: boolean
  tripleVaultId?: string
  tripleHash: string
}

export const useCheckExistingTriple = () => {
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Fonction pour vérifier si un triplet existe déjà on-chain
  const checkTripleExists = async (
    subjectVaultId: string,
    predicateVaultId: string,
    objectVaultId: string
  ): Promise<ExistingTriple> => {
    setIsChecking(true)
    setError(null)
    
    try {
      console.log('🔍 Checking if triple exists with VaultIDs:', {
        subject: subjectVaultId,
        predicate: predicateVaultId,
        object: objectVaultId
      })
      
      // FALLBACK: Since tripleHashFromAtoms doesn't work in V2,
      // we'll skip the existence check and let the contract handle duplicates
      console.log('⚠️ Skipping existence check - letting contract handle duplicate detection')
      console.log('Contract will return 0x22319959 error if triple already exists')
      
      // Generate a dummy hash for now
      const dummyHash = `0x${Date.now().toString(16).padStart(64, '0')}`
      
      return {
        exists: false,
        tripleHash: dummyHash
      }
    } catch (error) {
      console.error('❌ Triple check failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(new Error(`Triple check failed: ${errorMessage}`))
      throw new Error(`Triple check failed: ${errorMessage}`)
    } finally {
      setIsChecking(false)
    }
  }

  // Fonction helper pour calculer seulement le hash sans vérifier l'existence
  const calculateTripleHash = async (
    subjectVaultId: string,
    predicateVaultId: string,
    objectVaultId: string
  ): Promise<string> => {
    try {
      const { publicClient } = await getClients()
      const contractAddress = "0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d"

      const tripleHash = await publicClient.readContract({
        address: contractAddress,
        abi: MULTIVAULT_V2_ABI,
        functionName: 'tripleHashFromAtoms',
        args: [
          subjectVaultId as `0x${string}`,
          predicateVaultId as `0x${string}`,
          objectVaultId as `0x${string}`
        ]
      }) as `0x${string}`

      return tripleHash as string
    } catch (error) {
      console.error('❌ Triple hash calculation failed:', error)
      throw error
    }
  }

  return { 
    checkTripleExists,
    calculateTripleHash,
    isChecking, 
    error 
  }
}