import { usePinThingMutation } from "@0xintuition/graphql"
import { getClients } from '../lib/clients/viemClients'
import { stringToHex } from 'viem'
import { MultiVaultAbi } from '../ABI/MultiVault'
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
  // State management removed - let components handle loading/error states

  const createAtomDirect = async (atomData: AtomIPFSData): Promise<AtomCreationResult> => {
    try {
      logger.debug('Creating atom V2', { name: atomData.name })
      
      // Pin to IPFS first
      const pinResult = await pinThing({
        name: atomData.name,
        description: atomData.description || "Contenu visité par l'utilisateur.",
        image: atomData.image || "",
        url: atomData.url
      })

      if (!pinResult.pinThing?.uri) {
        throw new Error(ERROR_MESSAGES.ATOM_CREATION_FAILED)
      }

      const ipfsUri = pinResult.pinThing.uri
      logger.debug('IPFS URI obtained', { ipfsUri })
      
      // Log IPFS details for verification
      console.log('📍 ATOM IPFS DATA:', {
        atomName: atomData.name,
        ipfsUri: ipfsUri,
        ipfsUriHex: stringToHex(ipfsUri),
        ipfsUriBytes: [...Buffer.from(ipfsUri, 'utf8')],
        ipfsUriLength: ipfsUri.length,
        rawMetadata: {
          name: atomData.name,
          description: atomData.description || "Contenu visité par l'utilisateur.",
          image: atomData.image || "",
          url: atomData.url,
          type: atomData.type
        }
      })

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
      
      console.log('📦 ENCODED DATA FOR CONTRACT:', {
        atomName: atomData.name,
        originalIpfsUri: ipfsUri,
        encodedData: encodedData,
        encodedDataLength: encodedData.length,
        decodableBack: Buffer.from(encodedData.slice(2), 'hex').toString('utf8'),
        contractAddress: BlockchainService.getContractAddress()
      })
      
      // Calculate expected vaultId locally (same as contract)
      const expectedVaultId = BlockchainService.calculateAtomHash(ipfsUri)

      // Simulate to validate before paying gas fees
      const { publicClient } = await getClients()
      const simulation = await publicClient.simulateContract({
        address: BlockchainService.getContractAddress() as `0x${string}`,
        abi: MultiVaultAbi,
        functionName: 'createAtoms',
        args: [[encodedData], [atomCost]],
        value: atomCost,
        account: walletClient.account
      })

      // Verify simulation result matches our local calculation
      const simulatedVaultIds = simulation.result as `0x${string}`[]
      const simulatedVaultId = simulatedVaultIds[0]
      
      if (simulatedVaultId !== expectedVaultId) {
        throw new Error(`Hash mismatch: expected ${expectedVaultId}, got ${simulatedVaultId}`)
      }

      logger.debug('Sending atom creation transaction', {
        args: [[encodedData], [atomCost]],
        value: atomCost.toString(),
        expectedVaultId: expectedVaultId,
        simulationConfirmed: true
      })

      const txHash = await walletClient.writeContract({
        address: BlockchainService.getContractAddress() as `0x${string}`,
        abi: MultiVaultAbi,
        functionName: 'createAtoms',
        args: [[encodedData], [atomCost]],
        value: atomCost,
        gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
        chain: SELECTED_CHAIN,
        account: address as `0x${string}`
      })

      logger.debug('Transaction sent', { txHash })

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      logger.debug('Transaction confirmed', { status: receipt.status })
      
      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      const result = {
        success: true,
        vaultId: expectedVaultId,
        atomHash: expectedVaultId,
        txHash
      }
      
      console.log('✅ ATOM CREATION COMPLETED:', {
        atomName: atomData.name,
        ipfsUri: ipfsUri,
        encodedData: encodedData,
        vaultId: result.vaultId,
        atomHash: result.atomHash,
        txHash: result.txHash
      })
      
      return result
    } catch (error) {
      logger.error('Atom creation failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      throw new Error(`${ERROR_MESSAGES.ATOM_CREATION_FAILED}: ${errorMessage}`)
    }
  }

  const createAtomsBatch = async (atomsData: AtomIPFSData[]): Promise<{ [key: string]: AtomCreationResult }> => {
    try {
      logger.debug('Creating atoms batch', { count: atomsData.length })
      
      if (atomsData.length === 0) {
        return {}
      }
      
      // Pin all atoms to IPFS in parallel
      const pinPromises = atomsData.map(async (atomData) => {
        const pinResult = await pinThing({
          name: atomData.name,
          description: atomData.description || "Contenu visité par l'utilisateur.",
          image: atomData.image || "",
          url: atomData.url
        })
        
        if (!pinResult.pinThing?.uri) {
          throw new Error(`Failed to pin atom: ${atomData.name}`)
        }
        
        return {
          atomData,
          ipfsUri: pinResult.pinThing.uri
        }
      })
      
      const pinnedAtoms = await Promise.all(pinPromises)
      logger.debug('All atoms pinned to IPFS', { count: pinnedAtoms.length })
      
      // Check which atoms already exist
      const atomChecks = await Promise.all(
        pinnedAtoms.map(async ({ atomData, ipfsUri }) => {
          const atomCheck = await BlockchainService.checkAtomExists(ipfsUri)
          return {
            atomData,
            ipfsUri,
            exists: atomCheck.exists,
            atomHash: atomCheck.atomHash
          }
        })
      )
      
      // Separate existing and new atoms
      const existingAtoms = atomChecks.filter(check => check.exists)
      const newAtoms = atomChecks.filter(check => !check.exists)
      
      const results: { [key: string]: AtomCreationResult } = {}
      
      // Add existing atoms to results
      for (const existingAtom of existingAtoms) {
        results[existingAtom.atomData.name] = {
          success: true,
          vaultId: existingAtom.atomHash!,
          atomHash: existingAtom.atomHash!,
          txHash: 'existing'
        }
      }
      
      // Create new atoms in batch if any
      if (newAtoms.length > 0) {
        const { walletClient, publicClient } = await getClients()
        const atomCost = await BlockchainService.getAtomCost()
        
        // Prepare batch data
        const encodedDataArray = newAtoms.map(({ ipfsUri }) => stringToHex(ipfsUri))
        const costsArray = newAtoms.map(() => atomCost)
        const totalValue = atomCost * BigInt(newAtoms.length)
        
        logger.debug('Creating atoms batch transaction', {
          count: newAtoms.length,
          totalValue: totalValue.toString()
        })
        
        // Simulate first
        const simulation = await publicClient.simulateContract({
          address: BlockchainService.getContractAddress() as `0x${string}`,
          abi: MultiVaultAbi,
          functionName: 'createAtoms',
          args: [encodedDataArray, costsArray],
          value: totalValue,
          account: walletClient.account
        })
        
        // Execute batch transaction
        const txHash = await walletClient.writeContract({
          address: BlockchainService.getContractAddress() as `0x${string}`,
          abi: MultiVaultAbi,
          functionName: 'createAtoms',
          args: [encodedDataArray, costsArray],
          value: totalValue,
          gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
          chain: SELECTED_CHAIN,
          account: address as `0x${string}`
        })
        
        logger.debug('Batch transaction sent', { txHash })
        
        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
        
        if (receipt.status !== 'success') {
          throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
        }
        
        // Get vault IDs from simulation result
        const vaultIds = simulation.result as `0x${string}`[]
        
        // Add new atoms to results
        for (let i = 0; i < newAtoms.length; i++) {
          const newAtom = newAtoms[i]
          results[newAtom.atomData.name] = {
            success: true,
            vaultId: vaultIds[i],
            atomHash: vaultIds[i],
            txHash
          }
        }
        
        logger.debug('Batch atom creation completed', { 
          newCount: newAtoms.length,
          existingCount: existingAtoms.length,
          totalCount: Object.keys(results).length
        })
      }
      
      return results
      
    } catch (error) {
      logger.error('Batch atom creation failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      throw new Error(`${ERROR_MESSAGES.ATOM_CREATION_FAILED}: ${errorMessage}`)
    }
  }

  return { 
    createAtomWithMultivault: createAtomDirect,
    createAtomsBatch
  }
}