import { useState } from 'react'
import { usePinThingMutation } from "@0xintuition/graphql"
import { getClients } from '../lib/viemClients'
import { keccak256, stringToBytes } from 'viem'
import { useCreateAtom, type AtomIPFSData } from './useCreateAtom'

const MULTIVAULT_ABI = [
  {
    "type": "function",
    "name": "atomsByHash",
    "inputs": [{"type": "bytes32", "name": "hash"}],
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view"
  }
]

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

      const { publicClient } = await getClients()
      const contractAddress = "0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d"

      // TEMPORARY: Skip existence check and always create
      console.log('⚠️ Temporarily bypassing existence check - always creating new atoms')
      
      const { vaultId, txHash } = await createAtomWithMultivault(atomData)
      
      console.log('✅ New atom created!', { vaultId, txHash })
      
      return {
        exists: false,
        vaultId,
        txHash,
        ipfsUri,
        source: 'created'
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