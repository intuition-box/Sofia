import { useState } from 'react'
import { usePinThingMutation } from "@0xintuition/graphql"
import { getClients } from '../lib/clients/viemClients'
import { stringToHex } from 'viem'
import { MULTIVAULT_V2_ABI } from '../contracts/ABIs'
import { SELECTED_CHAIN } from '~lib/config/chainConfig'
import { useStorage } from "@plasmohq/storage/hook"
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES } from '../lib/config/constants'
import type { AtomIPFSData, AtomCreationResult } from '../types/blockchain'

const logger = createHookLogger('useCreateAtom')

export const useCreateAtom = () => {
  const { mutateAsync: pinThing } = usePinThingMutation()
  const [address] = useStorage<string>("metamask-account")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createAtomDirect = async (atomData: AtomIPFSData): Promise<AtomCreationResult> => {
    setIsLoading(true)
    setError(null)
    
    try {
      logger.debug('Creating atom V2', { name: atomData.name })
      
      // Pin to IPFS first
      const result = await pinThing({
        name: atomData.name,
        description: atomData.description || "Contenu visité par l'utilisateur.",
        image: atomData.image || "",
        url: atomData.url
      })

      if (!result.pinThing?.uri) {
        throw new Error(ERROR_MESSAGES.ATOM_CREATION_FAILED)
      }

      const ipfsUri = result.pinThing.uri
      logger.debug('IPFS URI obtained', { ipfsUri })

      const { walletClient } = await getClients()
      
      // Get atom cost using service
      const atomCost = await BlockchainService.getAtomCost()
      logger.debug('Atom cost retrieved', { cost: atomCost.toString() })
      
      // Check if atom already exists using service
      const atomCheck = await BlockchainService.checkAtomExists(ipfsUri)
      
      if (atomCheck.exists) {
        logger.debug('Atom already exists', { atomHash: atomCheck.atomHash })
        return {
          success: true,
          vaultId: atomCheck.atomHash,
          atomHash: atomCheck.atomHash,
          txHash: 'existing'
        }
      }
      
      // Convert IPFS URI to bytes for V2
      const encodedData = stringToHex(ipfsUri)
      
      logger.debug('Sending atom creation transaction', {
        args: [[encodedData], [atomCost]],
        value: atomCost.toString()
      })

      const txHash = await walletClient.writeContract({
        address: BlockchainService.getContractAddress() as `0x${string}`,
        abi: MULTIVAULT_V2_ABI,
        functionName: 'createAtoms',
        args: [[encodedData], [atomCost]],
        value: atomCost,
        gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
        chain: SELECTED_CHAIN,
        account: address as `0x${string}`
      })

      logger.debug('Transaction sent', { txHash })

      // Wait for confirmation
      const { publicClient } = await getClients()
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      logger.debug('Transaction confirmed', { status: receipt.status })
      
      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      return {
        success: true,
        vaultId: atomCheck.atomHash,
        atomHash: atomCheck.atomHash,
        txHash
      }
    } catch (error) {
      logger.error('Atom creation failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      setError(new Error(`${ERROR_MESSAGES.ATOM_CREATION_FAILED}: ${errorMessage}`))
      throw new Error(`${ERROR_MESSAGES.ATOM_CREATION_FAILED}: ${errorMessage}`)
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