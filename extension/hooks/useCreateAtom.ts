import { useState } from 'react'
import { usePinThingMutation } from "@0xintuition/graphql"
import { getClients } from '../lib/viemClients'
import { stringToHex, keccak256 } from 'viem'
import { MULTIVAULT_V2_ABI } from '../contracts/ABIs'
import { SELECTED_CHAIN } from '~lib/config'
import { useStorage } from "@plasmohq/storage/hook"

export interface AtomIPFSData {
  name: string
  description?: string
  url: string
  image?: any
}

export const useCreateAtom = () => {
  const { mutateAsync: pinThing } = usePinThingMutation()
  const [address] = useStorage<string>("metamask-account")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createAtomDirect = async (atomData: AtomIPFSData): Promise<{ vaultId: string; txHash: string }> => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('📌 Creating atom V2:', atomData.name)
      
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

      const ipfsUri = result.pinThing.uri
      console.log('📌 IPFS URI:', ipfsUri)

      const { walletClient, publicClient } = await getClients()
      const contractAddress = "0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d"

      // Get atom cost
      const atomCost = await publicClient.readContract({
        address: contractAddress,
        abi: MULTIVAULT_V2_ABI,
        functionName: 'getAtomCost'
      }) as bigint

      console.log('💰 Atom cost:', atomCost.toString())
      
      // Check if atom already exists
      const atomHash = keccak256(stringToHex(ipfsUri))
      const atomExists = await publicClient.readContract({
        address: contractAddress,
        abi: MULTIVAULT_V2_ABI,
        functionName: 'isTermCreated',
        args: [atomHash]
      }) as boolean
      
      if (atomExists) {
        console.log('✅ Atom already exists:', atomHash)
        return {
          vaultId: atomHash,
          txHash: 'existing'
        }
      }
      
      console.log('🆕 Creating new atom with hash:', atomHash)

      // Convert IPFS URI to bytes for V2
      const encodedData = stringToHex(ipfsUri)
      console.log('🔧 Encoded data:', encodedData)
      
      // Create atom with V2
      console.log('🚀 Sending transaction with args:', [[encodedData], [atomCost]], 'value:', atomCost.toString())



      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: MULTIVAULT_V2_ABI,
        functionName: 'createAtoms',
        args: [[encodedData], [atomCost]],
        value: atomCost,
        gas: 2000000n,
        chain: SELECTED_CHAIN,
        account: address as `0x${string}`
      })

      console.log('🔗 Transaction:', txHash)

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      console.log('✅ Confirmed:', receipt.status === 'success')
      
      if (receipt.status !== 'success') {
        throw new Error(`Transaction failed with status: ${receipt.status}`)
      }

      // Extract the real atom ID from the transaction logs
      // V2 MultiVault should emit an event with the atom ID
      console.log('📜 Transaction logs:', receipt.logs)
      
      // For V2, we need to calculate the atom ID from the data
      // Based on MultiVault code: atomId = keccak256(data)
      const realAtomId = keccak256(encodedData)
      console.log('🔑 Calculated atom ID:', realAtomId)

      return {
        vaultId: realAtomId, // Real bytes32 atom ID
        txHash
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
    createAtomWithMultivault: createAtomDirect,
    isLoading, 
    error 
  }
}