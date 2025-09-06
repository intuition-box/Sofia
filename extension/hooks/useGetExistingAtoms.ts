import { useState } from 'react'
import { getClients } from '../lib/viemClients'
import { keccak256, stringToHex } from 'viem'
import { MULTIVAULT_V2_ABI, MULTIVAULT_ABI } from '../contracts/abis'

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
      
      const { publicClient } = await getClients()
      const contractAddress = "0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d"

      // Hash the IPFS URI to check in contract (same as other hooks)
      const atomHash = keccak256(stringToHex(ipfsUri))
      console.log(`🔑 Generated atom hash for "${atomName}":`, atomHash)
      
      // Use direct ABI call to check if atom exists
      console.log(`🔍 Checking contract ${contractAddress} for atom existence...`)
      const atomExists = await publicClient.readContract({
        address: contractAddress,
        abi: MULTIVAULT_V2_ABI,
        functionName: 'isTermCreated',
        args: [atomHash]
      }) as boolean
      
      console.log(`📊 Contract response for "${atomName}": ${atomExists}`)

      if (atomExists) {
        const result = {
          vaultId: atomHash,
          ipfsUri,
          name: atomName
        }
        console.log(`✅ Found existing atom "${atomName}":`, result)
        return result
      } else {
        console.log(`❌ Atom "${atomName}" not found on-chain (hash: ${atomHash})`)
        return null
      }
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