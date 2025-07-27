import { useState } from 'react'
import { usePinThingMutation } from "@0xintuition/graphql"
import { Multivault } from "@0xintuition/protocol"
import { getClients } from '../lib/viemClients'

export interface AtomIPFSData {
  name: string
  description?: string
  url: string
  image?: any
}

export const useCreateAtom = () => {
  const { mutateAsync: pinThing } = usePinThingMutation()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createAtomWithMultivault = async (atomData: AtomIPFSData): Promise<{ vaultId: string; txHash: string }> => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('📌 Creating atom with Multivault SDK...', atomData)
      
      const { walletClient, publicClient } = await getClients()
      //@ts-ignore
      const multivault = new Multivault({ walletClient, publicClient })

      // Pin to IPFS first
      const result = await pinThing({
        name: atomData.name,
        description: atomData.description || "Contenu visité par l'utilisateur.",
        image: atomData.image || "",
        url: atomData.url
      })

      if (!result.pinThing?.uri) {
        throw new Error("Failed to pin atom metadata.")
      }

      console.log('✅ IPFS URI obtained:', result.pinThing.uri)
      const ipfsUri = result.pinThing.uri

      // Get atom cost and create atom
      const deposit = await multivault.getAtomCost()
      
      const { vaultId, hash } = await multivault.createAtom({
        uri: ipfsUri,
        initialDeposit: deposit,
        wait: true
      })

      console.log('✅ Atom created successfully!', { vaultId, hash })
      
      return {
        vaultId: vaultId.toString(),
        txHash: hash
      }
    } catch (error) {
      console.error('❌ Atom creation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(new Error(`Atom creation failed: ${errorMessage}`))
      throw new Error(`Atom creation failed: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return { 
    createAtomWithMultivault, 
    isLoading, 
    error 
  }
}