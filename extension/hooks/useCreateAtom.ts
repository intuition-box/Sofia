import { useState } from 'react'
import { usePinThingMutation } from "@0xintuition/graphql"
import { getClients } from '../lib/viemClients'
import { stringToHex } from 'viem'
import { MULTIVAULT_V2_ABI } from '../contracts/abis'

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
      
      // Convert IPFS URI to bytes for the contract
      const encodedData = stringToHex(ipfsUri)
      console.log('🔧 Encoded data:', encodedData)

      // Check if atom already exists using contract method
      const calculatedAtomId = await publicClient.readContract({
        address: contractAddress,
        abi: MULTIVAULT_V2_ABI,
        functionName: 'calculateAtomId',
        args: [encodedData]
      }) as `0x${string}`
      
      console.log('🔍 Calculated atomId:', calculatedAtomId)

      const atomExists = await publicClient.readContract({
        address: contractAddress,
        abi: MULTIVAULT_V2_ABI,
        functionName: 'isTermCreated',
        args: [calculatedAtomId]
      }) as boolean
      
      console.log('📊 Atom exists:', atomExists)

      if (atomExists) {
        console.log('✅ Atom already exists, returning existing atomId')
        return {
          vaultId: calculatedAtomId,
          txHash: '' // No transaction for existing atom
        }
      }

      console.log('🆕 Creating new atom with calculated ID:', calculatedAtomId)
      
      // Create atom with V2
      console.log('🚀 Sending transaction with args:', [[encodedData], [atomCost]], 'value:', atomCost.toString())
      
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: MULTIVAULT_V2_ABI,
        functionName: 'createAtoms',
        args: [[encodedData], [atomCost]],
        value: atomCost,
        gas: 500000n,
        account: walletClient.account!,
        chain: undefined
      })

      console.log('🔗 Transaction:', txHash)

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      console.log('✅ Confirmed:', receipt.status === 'success')
      
      if (receipt.status !== 'success') {
        throw new Error(`Transaction failed with status: ${receipt.status}`)
      }

      // For successful transaction, use the calculated atomId  
      // (the contract ensures atomId calculation is deterministic)
      console.log('✅ Atom created successfully')
      
      return {
        vaultId: calculatedAtomId,
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