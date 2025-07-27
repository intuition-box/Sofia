import { useState } from 'react'
import { usePinThingMutation } from "@0xintuition/graphql"
import { Multivault } from "@0xintuition/protocol"
import { getClients } from '../lib/viemClients'
import { keccak256, stringToBytes } from 'viem'
import { useCreateAtom, type AtomIPFSData } from './useCreateAtom'

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

      // 2. Check if atom exists on-chain
      const { walletClient, publicClient } = await getClients()
      //@ts-ignore
      const multivault = new Multivault({ walletClient, publicClient })

      // Hash the IPFS URI to check in contract
      const uriHash = keccak256(stringToBytes(ipfsUri))
      console.log('🔍 Checking atom hash:', uriHash)

      // Use contract to check if atom exists
      const existingAtomId = await publicClient.readContract({
        address: multivault.contract.address,
        abi: multivault.contract.abi,
        functionName: 'atomsByHash',
        args: [uriHash]
      })

      console.log('📋 Existing atom ID:', existingAtomId)

      if (existingAtomId && existingAtomId > 0n) {
        // Atom exists - return existing vaultId
        console.log('✅ Atom already exists! VaultId:', existingAtomId.toString())
        return {
          exists: true,
          vaultId: existingAtomId.toString(),
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