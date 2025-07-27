import { useState } from 'react'
import { Multivault } from "@0xintuition/protocol"
import { getClients } from '../lib/viemClients'

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
      //@ts-ignore
      const multivault = new Multivault({ walletClient: null, publicClient })

      // 1. Calculer le hash du triplet avec les VaultIDs
      const tripleHash = await publicClient.readContract({
        address: multivault.contract.address,
        abi: multivault.contract.abi,
        functionName: 'tripleHashFromAtoms',
        args: [
          BigInt(subjectVaultId),
          BigInt(predicateVaultId), 
          BigInt(objectVaultId)
        ]
      })

      console.log('🔍 Calculated triple hash:', tripleHash)

      // 2. Vérifier si ce hash existe dans triplesByHash
      const existingTripleId = await publicClient.readContract({
        address: multivault.contract.address,
        abi: multivault.contract.abi,
        functionName: 'triplesByHash',
        args: [tripleHash]
      })

      console.log('📋 Existing triple ID:', existingTripleId)

      if (existingTripleId && existingTripleId > 0n) {
        // Triple existe déjà
        console.log('✅ Triple already exists! TripleVaultId:', existingTripleId.toString())
        return {
          exists: true,
          tripleVaultId: existingTripleId.toString(),
          tripleHash: tripleHash.toString()
        }
      } else {
        // Triple n'existe pas
        console.log('🆕 Triple doesn\'t exist yet')
        return {
          exists: false,
          tripleHash: tripleHash.toString()
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

  // Fonction helper pour calculer seulement le hash sans vérifier l'existence
  const calculateTripleHash = async (
    subjectVaultId: string,
    predicateVaultId: string,
    objectVaultId: string
  ): Promise<string> => {
    try {
      const { publicClient } = await getClients()
      //@ts-ignore
      const multivault = new Multivault({ walletClient: null, publicClient })

      const tripleHash = await publicClient.readContract({
        address: multivault.contract.address,
        abi: multivault.contract.abi,
        functionName: 'tripleHashFromAtoms',
        args: [
          BigInt(subjectVaultId),
          BigInt(predicateVaultId), 
          BigInt(objectVaultId)
        ]
      })

      return tripleHash.toString()
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