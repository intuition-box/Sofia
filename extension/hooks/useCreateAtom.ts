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

      // Check if pinThing is available
      if (!pinThing) {
        throw new Error('IPFS pinning service not available. Please try again.')
      }

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
      
      // Calculate expected vaultId using the contract's calculateAtomId function
      const expectedVaultId = await BlockchainService.calculateAtomId(ipfsUri)

      // Simulate to validate before paying gas fees
      const { publicClient } = await getClients()

      try {
        const simulation = await publicClient.simulateContract({
          address: BlockchainService.getContractAddress() as `0x${string}`,
          abi: MultiVaultAbi,
          functionName: 'createAtoms',
          args: [[encodedData], [atomCost]],
          value: atomCost,
          account: walletClient.account
        })

        // Get the actual vault ID from simulation
        // If atom already exists, contract returns existing ID (which may differ from our calculation)
        const simulatedVaultIds = simulation.result as `0x${string}`[]
        const actualVaultId = simulatedVaultIds[0]

        if (actualVaultId !== expectedVaultId) {
          logger.info('Hash mismatch - atom may already exist with different data', {
            expectedVaultId,
            actualVaultId,
            atomName: atomData.name
          })
        }

        logger.debug('Sending atom creation transaction', {
          args: [[encodedData], [atomCost]],
          value: atomCost.toString(),
          expectedVaultId: expectedVaultId,
          actualVaultId: actualVaultId,
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
          vaultId: actualVaultId,
          atomHash: actualVaultId,
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

      } catch (simulationError) {
        // Check if atom already exists (MultiVault_AtomExists error)
        const errorMessage = simulationError instanceof Error ? simulationError.message : ''
        if (errorMessage.includes('MultiVault_AtomExists') || errorMessage.includes('AtomExists')) {
          // Use the contract's calculateAtomId to get the correct atom ID
          const atomId = await BlockchainService.calculateAtomId(ipfsUri)
          logger.debug('Atom already exists (caught during simulation), returning existing', {
            atomName: atomData.name,
            atomId
          })

          return {
            success: true,
            vaultId: atomId,
            atomHash: atomId,
            txHash: 'existing'
          }
        }
        // Re-throw other errors
        throw simulationError
      }

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
        const contractAddress = BlockchainService.getContractAddress() as `0x${string}`

        // Process atoms one by one to handle MultiVault_AtomExists errors gracefully
        for (const newAtom of newAtoms) {
          const encodedData = stringToHex(newAtom.ipfsUri)

          try {
            // Simulate first
            const simulation = await publicClient.simulateContract({
              address: contractAddress,
              abi: MultiVaultAbi,
              functionName: 'createAtoms',
              args: [[encodedData], [atomCost]],
              value: atomCost,
              account: walletClient.account
            })

            // Execute transaction
            const txHash = await walletClient.writeContract({
              address: contractAddress,
              abi: MultiVaultAbi,
              functionName: 'createAtoms',
              args: [[encodedData], [atomCost]],
              value: atomCost,
              gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
              chain: SELECTED_CHAIN,
              account: address as `0x${string}`
            })

            // Wait for confirmation
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

            if (receipt.status !== 'success') {
              throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
            }

            // Get vault ID from simulation result
            const vaultIds = simulation.result as `0x${string}`[]

            results[newAtom.atomData.name] = {
              success: true,
              vaultId: vaultIds[0],
              atomHash: vaultIds[0],
              txHash
            }

          } catch (error) {
            // Check if atom already exists (MultiVault_AtomExists error)
            const errorMessage = error instanceof Error ? error.message : ''
            if (errorMessage.includes('MultiVault_AtomExists') || errorMessage.includes('AtomExists')) {
              logger.debug('Atom already exists, getting existing vaultId', { name: newAtom.atomData.name })

              // Use the contract's calculateAtomId to get the correct atom ID
              const atomId = await BlockchainService.calculateAtomId(newAtom.ipfsUri)

              results[newAtom.atomData.name] = {
                success: true,
                vaultId: atomId,
                atomHash: atomId,
                txHash: 'existing'
              }
            } else {
              // Re-throw other errors
              throw error
            }
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