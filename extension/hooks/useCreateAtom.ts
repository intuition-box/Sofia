import { usePinThingMutation } from "@0xintuition/graphql"
import { getClients } from '../lib/clients/viemClients'
import { stringToHex } from 'viem'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { SofiaFeeProxyAbi } from '../ABI/SofiaFeeProxy'
import { SELECTED_CHAIN } from '~lib/config/chainConfig'
import { usePrivy } from '@privy-io/react-auth'
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES } from '../lib/config/constants'
import type { AtomIPFSData, AtomCreationResult } from '../types/blockchain'
import type { Address } from '../types/viem'

const logger = createHookLogger('useCreateAtom')

// Curve ID for creation deposits (1 = linear/upvote, 2 = progressive/shares)
const CREATION_CURVE_ID = 1n

// Minimum deposit for atom creation (same as atom cost - no extra deposit)
const MIN_ATOM_DEPOSIT = 0n

// Type for pinned atom data (IPFS pinned but not yet on-chain)
export interface PinnedAtomData {
  atomData: AtomIPFSData
  ipfsUri: string
  encodedData: `0x${string}`
}

export const useCreateAtom = () => {
  const { mutateAsync: pinThing } = usePinThingMutation()
  const { user } = usePrivy()
  const address = user?.wallet?.address
  // State management removed - let components handle loading/error states

  // Ensure user has approved the proxy on MultiVault (required for receiver pattern)
  const ensureProxyApproval = async (): Promise<void> => {
    if (!address) {
      throw new Error('No wallet connected')
    }

    const isApproved = await BlockchainService.checkProxyApproval(address)

    if (!isApproved) {
      logger.info('Proxy not approved, requesting approval from user')

      // Request approval transaction
      const txHash = await BlockchainService.requestProxyApproval()
      logger.debug('Approval transaction sent', { txHash })

      // Wait for confirmation
      const success = await BlockchainService.waitForApprovalConfirmation(txHash)

      if (!success) {
        throw new Error('Proxy approval transaction failed')
      }

      logger.info('Proxy approval confirmed')
    }
  }

  /**
   * Pin atom data to IPFS without creating on-chain
   * Use this to batch pin multiple atoms before creating them in a single tx
   */
  const pinAtomToIPFS = async (atomData: AtomIPFSData): Promise<PinnedAtomData> => {
    if (!pinThing) {
      throw new Error('IPFS pinning service not available. Please try again.')
    }

    const pinResult = await pinThing({
      name: atomData.name,
      description: atomData.description || "Contenu visité par l'utilisateur.",
      image: atomData.image || "",
      url: atomData.url
    })

    if (!pinResult.pinThing?.uri) {
      throw new Error(`Failed to pin atom: ${atomData.name}`)
    }

    const ipfsUri = pinResult.pinThing.uri
    const encodedData = stringToHex(ipfsUri)

    logger.debug('Atom pinned to IPFS', { name: atomData.name, ipfsUri })

    return {
      atomData,
      ipfsUri,
      encodedData
    }
  }

  /**
   * Create multiple atoms from already-pinned data in a SINGLE transaction
   * This is the optimized batch creation function
   */
  const createAtomsFromPinned = async (
    pinnedAtoms: PinnedAtomData[]
  ): Promise<{ [key: string]: AtomCreationResult }> => {
    if (pinnedAtoms.length === 0) {
      return {}
    }

    const results: { [key: string]: AtomCreationResult } = {}

    // Check which atoms already exist on-chain
    const atomChecks = await Promise.all(
      pinnedAtoms.map(async (pinned) => {
        const atomCheck = await BlockchainService.checkAtomExists(pinned.ipfsUri)
        return {
          ...pinned,
          exists: atomCheck.exists,
          atomHash: atomCheck.atomHash
        }
      })
    )

    // Separate existing and new atoms
    const existingAtoms = atomChecks.filter(check => check.exists)
    const newAtoms = atomChecks.filter(check => !check.exists)

    // Add existing atoms to results immediately
    for (const existingAtom of existingAtoms) {
      results[existingAtom.atomData.name] = {
        success: true,
        vaultId: existingAtom.atomHash!,
        atomHash: existingAtom.atomHash!,
        txHash: 'existing'
      }
    }

    // Create all new atoms in ONE transaction
    if (newAtoms.length > 0) {
      const { walletClient, publicClient } = await getClients()
      const atomCost = await BlockchainService.getAtomCost()
      const contractAddress = BlockchainService.getContractAddress()

      // Prepare arrays for batch creation
      const encodedDataArray = newAtoms.map(atom => atom.encodedData)
      const depositsArray = newAtoms.map(() => MIN_ATOM_DEPOSIT)

      // Total cost = atomCost * numberOfAtoms (no deposit fees since deposits are 0)
      const multiVaultCost = atomCost * BigInt(newAtoms.length)
      const totalCost = await BlockchainService.getTotalCreationCost(0, 0n, multiVaultCost)

      logger.debug('Creating atoms in single batch transaction', {
        count: newAtoms.length,
        totalCost: totalCost.toString()
      })

      try {
        // Simulate first
        const simulation = await publicClient.simulateContract({
          address: contractAddress,
          abi: SofiaFeeProxyAbi,
          functionName: 'createAtoms',
          args: [address as Address, encodedDataArray, depositsArray, CREATION_CURVE_ID],
          value: totalCost,
          account: walletClient.account
        })

        // Execute single transaction for all atoms
        const txHash = await walletClient.writeContract({
          address: contractAddress,
          abi: SofiaFeeProxyAbi,
          functionName: 'createAtoms',
          args: [address as Address, encodedDataArray, depositsArray, CREATION_CURVE_ID],
          value: totalCost,
          chain: SELECTED_CHAIN,
          account: address as `0x${string}`
        })

        logger.debug('Batch atom creation tx sent', { txHash, count: newAtoms.length })

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

        if (receipt.status !== 'success') {
          throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
        }

        // Get vault IDs from simulation result
        const vaultIds = simulation.result as `0x${string}`[]

        // Map results back to atom names
        for (let i = 0; i < newAtoms.length; i++) {
          results[newAtoms[i].atomData.name] = {
            success: true,
            vaultId: vaultIds[i],
            atomHash: vaultIds[i],
            txHash
          }
        }

        logger.debug('Batch atom creation completed in single tx', {
          newCount: newAtoms.length,
          existingCount: existingAtoms.length
        })

      } catch (error) {
        // If batch fails due to some atoms existing, fall back to individual creation
        const errorMessage = error instanceof Error ? error.message : ''
        if (errorMessage.includes('MultiVault_AtomExists') || errorMessage.includes('AtomExists')) {
          logger.debug('Some atoms already exist, falling back to individual creation')

          // Create atoms one by one as fallback
          for (const newAtom of newAtoms) {
            try {
              const singleSimulation = await publicClient.simulateContract({
                address: contractAddress,
                abi: SofiaFeeProxyAbi,
                functionName: 'createAtoms',
                args: [address as Address, [newAtom.encodedData], [MIN_ATOM_DEPOSIT], CREATION_CURVE_ID],
                value: atomCost,
                account: walletClient.account
              })

              const txHash = await walletClient.writeContract({
                address: contractAddress,
                abi: SofiaFeeProxyAbi,
                functionName: 'createAtoms',
                args: [address as Address, [newAtom.encodedData], [MIN_ATOM_DEPOSIT], CREATION_CURVE_ID],
                value: atomCost,
                chain: SELECTED_CHAIN,
                account: address as `0x${string}`
              })

              const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

              if (receipt.status === 'success') {
                const vaultIds = singleSimulation.result as `0x${string}`[]
                results[newAtom.atomData.name] = {
                  success: true,
                  vaultId: vaultIds[0],
                  atomHash: vaultIds[0],
                  txHash
                }
              }
            } catch (singleError) {
              // Atom exists, get its ID
              const atomId = await BlockchainService.calculateAtomId(newAtom.ipfsUri)
              results[newAtom.atomData.name] = {
                success: true,
                vaultId: atomId,
                atomHash: atomId,
                txHash: 'existing'
              }
            }
          }
        } else {
          throw error
        }
      }
    }

    return results
  }

  const createAtomDirect = async (atomData: AtomIPFSData): Promise<AtomCreationResult> => {
    try {
      logger.debug('Creating atom V2', { name: atomData.name })

      // Ensure proxy is approved before any creation (one-time approval)
      await ensureProxyApproval()

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
      // Calculate total cost including Sofia fees (no deposit, so depositCount=0, totalDeposit=0)
      const totalCost = await BlockchainService.getTotalCreationCost(0, 0n, atomCost)
      logger.debug('Atom cost retrieved', {
        atomCost: atomCost.toString(),
        totalCost: totalCost.toString()
      })

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
          address: BlockchainService.getContractAddress(),
          abi: SofiaFeeProxyAbi,
          functionName: 'createAtoms',
          args: [address as Address, [encodedData], [MIN_ATOM_DEPOSIT], CREATION_CURVE_ID],
          value: totalCost, // Use totalCost which includes Sofia fees
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
          args: [address, [encodedData], [MIN_ATOM_DEPOSIT], CREATION_CURVE_ID],
          value: totalCost.toString(),
          expectedVaultId: expectedVaultId,
          actualVaultId: actualVaultId,
          simulationConfirmed: true
        })

        const txHash = await walletClient.writeContract({
          address: BlockchainService.getContractAddress(),
          abi: SofiaFeeProxyAbi,
          functionName: 'createAtoms',
          args: [address as Address, [encodedData], [MIN_ATOM_DEPOSIT], CREATION_CURVE_ID],
          value: totalCost, // Use totalCost which includes Sofia fees
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

      // Ensure proxy is approved before any creation (one-time approval)
      await ensureProxyApproval()

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
        // Calculate total cost including Sofia fees (no deposit, so depositCount=0, totalDeposit=0)
        const totalCost = await BlockchainService.getTotalCreationCost(0, 0n, atomCost)
        const contractAddress = BlockchainService.getContractAddress()

        // Process atoms one by one to handle MultiVault_AtomExists errors gracefully
        for (const newAtom of newAtoms) {
          const encodedData = stringToHex(newAtom.ipfsUri)

          try {
            // Simulate first
            const simulation = await publicClient.simulateContract({
              address: contractAddress,
              abi: SofiaFeeProxyAbi,
              functionName: 'createAtoms',
              args: [address as Address, [encodedData], [MIN_ATOM_DEPOSIT], CREATION_CURVE_ID],
              value: totalCost, // Use totalCost which includes Sofia fees
              account: walletClient.account
            })

            // Execute transaction
            const txHash = await walletClient.writeContract({
              address: contractAddress,
              abi: SofiaFeeProxyAbi,
              functionName: 'createAtoms',
              args: [address as Address, [encodedData], [MIN_ATOM_DEPOSIT], CREATION_CURVE_ID],
              value: totalCost, // Use totalCost which includes Sofia fees
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
    createAtomsBatch,
    // New optimized functions for batch operations
    pinAtomToIPFS,
    createAtomsFromPinned,
    ensureProxyApproval
  }
}