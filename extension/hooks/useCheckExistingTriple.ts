import { useState } from 'react'
import { getClients } from '../lib/viemClients'
import { MULTIVAULT_V2_ABI } from '../contracts/ABIs'

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
      
      const { publicClient } = await getClients()
      const contractAddress = "0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d"

      try {
        // First calculate the triple ID 
        const tripleId = await publicClient.readContract({
          address: contractAddress,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'calculateTripleId',
          args: [
            subjectVaultId as `0x${string}`,
            predicateVaultId as `0x${string}`,
            objectVaultId as `0x${string}`
          ]
        }) as `0x${string}`
        
        console.log('🔍 Triple ID calculated:', tripleId)

        // Then check if this triple exists using getTriple
        try {
          const [subject, predicate, object] = await publicClient.readContract({
            address: contractAddress,
            abi: MULTIVAULT_V2_ABI,
            functionName: 'getTriple',
            args: [tripleId]
          }) as [string, string, string]
          
          console.log('🔍 Triple found with components:', { subject, predicate, object })
          
          // If getTriple doesn't revert, the triple exists
          return {
            exists: true,
            tripleVaultId: tripleId,
            tripleHash: tripleId
          }
        } catch (getTripleError) {
          // getTriple reverts with TripleDoesNotExist if triple doesn't exist
          console.log('🔍 Triple does not exist (getTriple reverted)')
          
          return {
            exists: false,
            tripleHash: tripleId
          }
        }
      } catch (contractError) {
        console.warn('⚠️ Contract existence check failed, falling back to creation attempt:', contractError)
        // Return false if we can't check - let the contract handle duplicates
        return {
          exists: false,
          tripleHash: '' // No ID available if calculation failed
        }
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



  return { 
    checkTripleExists,
    isChecking, 
    error 
  }
}