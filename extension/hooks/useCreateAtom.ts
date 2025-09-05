import { useState } from 'react'
import { usePinThingMutation } from "@0xintuition/graphql"
import { getClients } from '../lib/viemClients'
import { stringToHex, keccak256 } from 'viem'

export interface AtomIPFSData {
  name: string
  description?: string
  url: string
  image?: any
}

const MULTIVAULT_V2_ABI = [
  {
    "type": "function",
    "name": "getAtomCost",
    "inputs": [],
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createAtoms",
    "inputs": [
      {"type": "bytes[]", "name": "atomDatas"},
      {"type": "uint256[]", "name": "assets"}
    ],
    "outputs": [{"type": "bytes32[]", "name": ""}],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "isTermCreated",
    "inputs": [{"type": "bytes32", "name": "id"}],
    "outputs": [{"type": "bool", "name": ""}],
    "stateMutability": "view"
  }
]

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

      // Convert IPFS URI to bytes for V2
      const encodedData = stringToHex(ipfsUri)
      console.log('🔧 Encoded data:', encodedData)
      
      // Create atom with V2
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: MULTIVAULT_V2_ABI,
        functionName: 'createAtoms',
        args: [[encodedData], [atomCost]],
        value: atomCost,
        gas: 2000000n
      })

      console.log('🔗 Transaction:', txHash)

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      console.log('✅ Confirmed:', receipt.status === 'success')

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