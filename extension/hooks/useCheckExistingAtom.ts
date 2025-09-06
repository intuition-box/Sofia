import { useState } from 'react'
import { usePinThingMutation } from "@0xintuition/graphql"
import { getClients } from '../lib/viemClients'
import { keccak256, stringToHex } from 'viem'
import { useCreateAtom, type AtomIPFSData } from './useCreateAtom'
import { MULTIVAULT_V2_ABI } from '../contracts/abis'

export interface AtomCheckResult {
  exists: boolean
  vaultId: string
  txHash?: string
  ipfsUri: string
  source: 'created' | 'existing'
}

export const useCheckExistingAtom = () => {
  const { mutateAsync: pinThing } = usePinThingMutation()
  const { createAtomWithMultivault } = useCreateAtom()
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const checkAndCreateAtom = async (atomData: AtomIPFSData): Promise<AtomCheckResult> => {
    setIsChecking(true)
    setError(null)
    
    try {
      console.log('🔍 Checking if atom exists...', atomData)
      
      // 1. Pin to IPFS first (comme dans useCreateAtom)
      const result = await pinThing({
        name: atomData.name,
        description: atomData.description || "Contenu visité par l'utilisateur.",
        image: atomData.image || "",
        url: atomData.url
      })

      if (!result.pinThing?.uri) {
        throw new Error("Failed to pin atom metadata.")
      }

      const ipfsUri = result.pinThing.uri
      console.log('📌 IPFS URI obtained:', ipfsUri)

      // 2. Check if atom exists on-chain using direct ABI approach
      const { publicClient } = await getClients()
      const contractAddress = "0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d"

      // Hash the IPFS URI to check in contract (same as useCreateAtom)
      const atomHash = keccak256(stringToHex(ipfsUri))
      console.log('🔍 Checking atom hash:', atomHash)

      // Use direct ABI call to check if atom exists
      const atomExists = await publicClient.readContract({
        address: contractAddress,
        abi: MULTIVAULT_V2_ABI,
        functionName: 'isTermCreated',
        args: [atomHash]
      }) as boolean

      console.log('📋 Atom exists:', atomExists)

      if (atomExists) {
        // Atom exists - return existing vaultId (use the hash as vaultId like in useCreateAtom)
        console.log('✅ Atom already exists! VaultId:', atomHash)
        return {
          exists: true,
          vaultId: atomHash,
          ipfsUri,
          source: 'existing'
        }
      } else {
        // Atom doesn't exist - use existing createAtom logic
        console.log('🆕 Atom doesn\'t exist, creating with existing logic...')
        
        const { vaultId, txHash } = await createAtomWithMultivault(atomData)
        
        console.log('✅ New atom created using existing logic!', { vaultId, txHash })
        
        return {
          exists: false,
          vaultId,
          txHash,
          ipfsUri,
          source: 'created'
        }
      }
    } catch (error) {
      console.error('❌ Atom check/creation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(new Error(`Atom check failed: ${errorMessage}`))
      throw new Error(`Atom check failed: ${errorMessage}`)
    } finally {
      setIsChecking(false)
    }
  }

  return { 
    checkAndCreateAtom, 
    isChecking, 
    error 
  }
}