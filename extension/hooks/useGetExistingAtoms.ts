import { useState } from 'react'
import { getClients } from '../lib/viemClients'
import { keccak256, stringToBytes } from 'viem'

const MULTIVAULT_ABI = [
  {
    "type": "function",
    "name": "atomsByHash",
    "inputs": [{"type": "bytes32", "name": "hash"}],
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view"
  }
]

export interface ExistingAtom {
  vaultId: string
  ipfsUri: string
  name: string
}

export const useGetExistingAtoms = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Fonction simple pour récupérer un atom existant par son URI IPFS 
  // (réutilise la même logique que useCheckExistingAtom ligne 44-61)
  const getAtomByIpfsUri = async (ipfsUri: string, atomName: string): Promise<ExistingAtom | null> => {
    try {
      console.log(`🔍 Searching for existing atom "${atomName}" with URI:`, ipfsUri)
      
      // TEMPORARY: Always return null to force creation of new atoms
      console.log(`⚠️ Temporarily bypassing atom lookup - always returning null to create new atom`)
      return null
    } catch (error) {
      console.error(`❌ Error getting atom "${atomName}":`, error)
      throw error
    }
  }

  // Fonction spécifique pour récupérer l'atom User
  const getUserAtom = async (userIpfsUri: string): Promise<ExistingAtom> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const userAtom = await getAtomByIpfsUri(userIpfsUri, 'User')
      
      if (!userAtom) {
        throw new Error('User atom not found on-chain. Please ensure it exists with the provided IPFS URI.')
      }
      
      return userAtom
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(new Error(`Failed to get User atom: ${errorMessage}`))
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction spécifique pour récupérer un predicate atom
  const getPredicateAtom = async (predicateIpfsUri: string, predicateName: string): Promise<ExistingAtom> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const predicateAtom = await getAtomByIpfsUri(predicateIpfsUri, predicateName)
      
      if (!predicateAtom) {
        throw new Error(`Predicate atom "${predicateName}" not found on-chain. Please ensure it exists with the provided IPFS URI.`)
      }
      
      return predicateAtom
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(new Error(`Failed to get Predicate atom "${predicateName}": ${errorMessage}`))
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return { 
    getUserAtom,
    getPredicateAtom,
    getAtomByIpfsUri,
    isLoading, 
    error 
  }
}