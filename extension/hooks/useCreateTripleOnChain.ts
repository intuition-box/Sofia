import { getClients } from '../lib/clients/viemClients'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { SofiaFeeProxyAbi } from '../ABI/SofiaFeeProxy'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { useCreateAtom } from './useCreateAtom'
import { usePrivy } from '@privy-io/react-auth'
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES, PREDICATE_IDS, SUBJECT_IDS } from '../lib/config/constants'
import type { TripleOnChainResult, BatchTripleInput, BatchTripleResult } from '../types/blockchain'
import type { Address, Hash, ContractWriteParams } from '../types/viem'

const logger = createHookLogger('useCreateTripleOnChain')

// Minimum deposit for triple creation (0.01 TRUST in wei)
const MIN_TRIPLE_DEPOSIT = 10000000000000000n // 10^16 wei = 0.01 ether

// Curve ID for creation deposits (1 = linear/upvote, 2 = progressive/shares)
const CREATION_CURVE_ID = 1n


export const useCreateTripleOnChain = () => {
  const {
    pinAtomToIPFS,
    createAtomsFromPinned,
    ensureProxyApproval
  } = useCreateAtom()
  const { user } = usePrivy()
  const address = user?.wallet?.address

  // Utility function to get the universal "I" subject atom (shared between simple and batch)
  const getUserAtom = async () => {
    if (!address) {
      throw new Error('No wallet connected')
    }

    // Return the pre-existing "I" subject atom instead of creating one for each wallet
    return {
      vaultId: SUBJECT_IDS.I,
      success: true,
      ipfsUri: '',
      name: 'I'
    }
  }

  // Check if predicate has a pre-defined ID (no creation needed)
  const getPredicateIdIfExists = (predicateName: string): string | null => {
    if (predicateName === 'follow') {
      return PREDICATE_IDS.FOLLOW
    }
    if (predicateName === 'trusts') {
      return PREDICATE_IDS.TRUSTS
    }
    return null
  }

  // Helper function to execute transaction with wallet
  const executeTransaction = async (txParams: ContractWriteParams): Promise<Hash> => {
    // Ensure proper Address typing for viem
    const viemParams = {
      ...txParams,
      address: txParams.address as Address,
      account: txParams.account as Address
    }

    const { walletClient } = await getClients()
    return await walletClient.writeContract(viemParams)
  }

  const createTripleOnChain = async (
    predicateName: string, // ex: "has visited", "loves"
    objectData: { name: string; description?: string; url: string; image?: string },
    customWeight?: bigint // Optional custom weight/value for the triple
  ): Promise<TripleOnChainResult> => {

    try {
      if (!address) {
        throw new Error('No wallet connected')
      }

      // Ensure proxy is approved before any creation (one-time approval)
      await ensureProxyApproval()

      const userAtomResult = await getUserAtom()
      const userAtom = {
        vaultId: userAtomResult.vaultId,
        ipfsUri: '',
        name: 'I'
      }

      // Check if predicate already has a pre-defined ID
      const existingPredicateId = getPredicateIdIfExists(predicateName)

      // OPTIMIZATION: Pin all atoms to IPFS in parallel, then create in single tx
      const atomsToPinAndCreate: { name: string; description?: string; url: string; image?: string; type: 'predicate' | 'object' }[] = []

      // Add predicate to pin list if not pre-defined
      if (!existingPredicateId) {
        atomsToPinAndCreate.push({
          name: predicateName,
          description: `Predicate representing the relation "${predicateName}"`,
          url: '',
          type: 'predicate'
        })
      }

      // Always add object to pin list
      atomsToPinAndCreate.push({
        name: objectData.name,
        description: objectData.description,
        url: objectData.url,
        image: objectData.image,
        type: 'object'
      })

      // Pin all atoms to IPFS in parallel (no blockchain tx yet)
      logger.debug('Pinning atoms to IPFS', { count: atomsToPinAndCreate.length })
      const pinnedAtoms = await Promise.all(
        atomsToPinAndCreate.map(atomData => pinAtomToIPFS(atomData))
      )

      // Create all new atoms in a SINGLE transaction
      logger.debug('Creating atoms in single transaction', { count: pinnedAtoms.length })
      const createdAtoms = await createAtomsFromPinned(pinnedAtoms)

      // Get the vault IDs
      let predicateVaultId: string
      let objectVaultId: string

      if (existingPredicateId) {
        predicateVaultId = existingPredicateId
        objectVaultId = createdAtoms[objectData.name].vaultId
      } else {
        predicateVaultId = createdAtoms[predicateName].vaultId
        objectVaultId = createdAtoms[objectData.name].vaultId
      }

      const predicateAtom = { vaultId: predicateVaultId, name: predicateName }
      const objectAtom = { vaultId: objectVaultId }

      const tripleCheck = await BlockchainService.checkTripleExists(
        userAtom.vaultId,
        predicateAtom.vaultId,
        objectAtom.vaultId
      )
      
      if (tripleCheck.exists) {
        // Triple exists - deposit on it instead of just returning existing
        const { walletClient, publicClient } = await getClients()
        const contractAddress = BlockchainService.getContractAddress()

        // For deposit, use customWeight directly (no feeCost needed)
        const feeCost = await BlockchainService.getTripleCost()
        const depositAmount = customWeight !== undefined ? customWeight : feeCost
        const curveId = 2n // Curve ID for triple deposits

        logger.debug('Triple exists, performing deposit instead', {
          tripleVaultId: tripleCheck.tripleVaultId,
          depositAmount: depositAmount.toString()
        })

        // Calculate total cost including Sofia fees
        const totalDepositCost = await BlockchainService.getTotalDepositCost(depositAmount)

        // Simulate deposit first via Proxy
        await publicClient.simulateContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'deposit',
          args: [
            address as Address,                    // receiver
            tripleCheck.tripleVaultId as Address,  // termId
            curveId,                               // curveId
            0n                                     // minShares
          ],
          value: totalDepositCost,
          account: walletClient.account
        })

        // Execute deposit via Proxy
        const hash = await walletClient.writeContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'deposit',
          args: [
            address as Address,
            tripleCheck.tripleVaultId as Address,
            curveId,
            0n
          ],
          value: totalDepositCost,
          chain: SELECTED_CHAIN,
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: address as Address
        })

        const receipt = await publicClient.waitForTransactionReceipt({ hash })

        if (receipt.status !== 'success') {
          throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
        }

        return {
          success: true,
          tripleVaultId: tripleCheck.tripleVaultId!,
          txHash: hash,
          subjectVaultId: userAtom.vaultId,
          predicateVaultId: predicateAtom.vaultId,
          objectVaultId: objectAtom.vaultId,
          source: 'deposit',
          tripleHash: tripleCheck.tripleHash
        }
      } else {
        const { walletClient, publicClient } = await getClients()
        const contractAddress = BlockchainService.getContractAddress()

        const tripleCost = await BlockchainService.getTripleCost()

        // Create triple with deposit amount
        const depositAmount = customWeight !== undefined ? customWeight : MIN_TRIPLE_DEPOSIT
        const multiVaultCost = tripleCost + depositAmount
        // Total cost including Sofia fees (depositCount=1, totalDeposit=depositAmount)
        const totalCost = await BlockchainService.getTotalCreationCost(1, depositAmount, multiVaultCost)

        const subjectId = userAtom.vaultId as Address
        const predicateId = predicateAtom.vaultId as Address
        const objectId = objectAtom.vaultId as Address

        // Debug: Log all IDs before creating triple
        console.log('🔍 [createTripleOnChain] Creating triple with:', {
          subjectId,
          predicateId,
          objectId,
          depositAmount: depositAmount.toString(),
          totalCost: totalCost.toString(),
          receiver: address
        })

        // Simulate first to catch errors with detailed message
        try {
          await publicClient.simulateContract({
            address: contractAddress as Address,
            abi: SofiaFeeProxyAbi,
            functionName: 'createTriples',
            args: [address as Address, [subjectId], [predicateId], [objectId], [depositAmount], CREATION_CURVE_ID],
            value: totalCost,
            account: walletClient.account
          })
          console.log('✅ [createTripleOnChain] Simulation passed')
        } catch (simError) {
          console.error('❌ [createTripleOnChain] Simulation failed:', simError)
          throw simError
        }

        const txParams = {
          address: contractAddress,
          abi: SofiaFeeProxyAbi as unknown as any[],
          functionName: 'createTriples',
          args: [
            address,        // receiver - user gets the shares
            [subjectId],
            [predicateId],
            [objectId],
            [depositAmount], // deposit amount (without creation cost)
            CREATION_CURVE_ID  // curveId
          ],
          value: totalCost,  // Total including Sofia fees
          chain: SELECTED_CHAIN,
          // Remove hardcoded gas - let Viem estimate automatically
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: address
        }

        const hash = await executeTransaction(txParams)

        const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as Address })

        if (receipt.status !== 'success') {
          throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
        }

        // Simulate to get the result after successful transaction
        const simulation = await publicClient.simulateContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'createTriples',
          args: [address as Address, [subjectId], [predicateId], [objectId], [depositAmount], CREATION_CURVE_ID],
          value: totalCost,
          account: walletClient.account
        })

        const tripleIds = simulation.result as Address[]
        const tripleVaultId = tripleIds[0]

        return {
          success: true,
          tripleVaultId: tripleVaultId,
          txHash: hash,
          subjectVaultId: userAtom.vaultId,
          predicateVaultId: predicateAtom.vaultId,
          objectVaultId: objectAtom.vaultId,
          source: 'created',
          tripleHash: tripleCheck.tripleHash
        }
      }
    } catch (error) {
      logger.error('Triple creation failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      throw new Error(`${ERROR_MESSAGES.TRIPLE_CREATION_FAILED}: ${errorMessage}`)
    }
  }


  const createTriplesBatch = async (inputs: BatchTripleInput[]): Promise<BatchTripleResult> => {
    try {
      if (!address) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      }

      // Ensure proxy is approved before any creation (one-time approval)
      await ensureProxyApproval()

      logger.debug('Starting batch triple creation', { count: inputs.length })

      // User atom (always needed) - will use the universal "I" subject
      const userAtomKey = `user:I`

      // Collect unique predicates and objects
      const uniquePredicates = new Set<string>()
      const uniqueObjects = new Map<string, { name: string; description?: string; url: string; image?: string }>()

      for (const input of inputs) {
        uniquePredicates.add(input.predicateName)
        uniqueObjects.set(input.objectData.name, {
          name: input.objectData.name,
          description: input.objectData.description,
          url: input.objectData.url,
          image: input.objectData.image
        })
      }

      const atomResults = new Map<string, string>() // key -> vaultId

      // Create user atom first using utility function
      const userAtomResult = await getUserAtom()
      atomResults.set(userAtomKey, userAtomResult.vaultId)

      // OPTIMIZATION: Collect ALL atoms to create (predicates + objects) and create in SINGLE tx
      const atomsToPinAndCreate: { name: string; description?: string; url: string; image?: string; key: string }[] = []

      // Add predicates that need creation (not pre-defined)
      for (const predicateName of uniquePredicates) {
        const existingId = getPredicateIdIfExists(predicateName)
        if (existingId) {
          // Pre-defined predicate, add directly to results
          atomResults.set(`predicate:${predicateName}`, existingId)
        } else {
          // Need to create this predicate
          atomsToPinAndCreate.push({
            name: predicateName,
            description: `Predicate representing the relation "${predicateName}"`,
            url: '',
            key: `predicate:${predicateName}`
          })
        }
      }

      // Add all objects to create
      for (const [objectName, objData] of uniqueObjects.entries()) {
        atomsToPinAndCreate.push({
          name: objData.name,
          description: objData.description || "Contenu visité par l'utilisateur.",
          url: objData.url,
          image: objData.image,
          key: `object:${objectName}`
        })
      }

      // Pin all atoms to IPFS in parallel
      if (atomsToPinAndCreate.length > 0) {
        logger.debug('Pinning all atoms to IPFS in parallel', { count: atomsToPinAndCreate.length })

        const pinnedAtoms = await Promise.all(
          atomsToPinAndCreate.map(atomData => pinAtomToIPFS(atomData))
        )

        // Create ALL atoms in a SINGLE transaction
        logger.debug('Creating all atoms in single transaction', { count: pinnedAtoms.length })
        const createdAtoms = await createAtomsFromPinned(pinnedAtoms)

        // Map results back to atomResults using the original keys
        for (let i = 0; i < atomsToPinAndCreate.length; i++) {
          const key = atomsToPinAndCreate[i].key
          const name = atomsToPinAndCreate[i].name
          atomResults.set(key, createdAtoms[name].vaultId)
        }

        logger.debug('All atoms created in single tx', {
          predicatesCreated: atomsToPinAndCreate.filter(a => a.key.startsWith('predicate:')).length,
          objectsCreated: atomsToPinAndCreate.filter(a => a.key.startsWith('object:')).length
        })
      }

      // All atoms are now created/retrieved

      const results: TripleOnChainResult[] = []
      const triplesToCreate: {
        subjectId: string
        predicateId: string
        objectId: string
        originalInput: BatchTripleInput
        index: number
        customWeight?: bigint
      }[] = []
      const triplesToDeposit: {
        tripleVaultId: string
        subjectId: string
        predicateId: string
        objectId: string
        customWeight?: bigint
        tripleHash: string
      }[] = []

      // Use Set for O(1) deduplication instead of O(n) some() calls
      const tripleKeysSet = new Set<string>()

      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i]

        const userVaultId = atomResults.get(`user:I`)!
        const predicateVaultId = atomResults.get(`predicate:${input.predicateName}`)!
        const objectVaultId = atomResults.get(`object:${input.objectData.name}`)!

        // Check if triple already exists
        const tripleCheck = await BlockchainService.checkTripleExists(userVaultId, predicateVaultId, objectVaultId)

        if (tripleCheck.exists) {
          // Triple exists - add to deposit list instead of just returning existing
          const tripleKey = `${userVaultId}-${predicateVaultId}-${objectVaultId}`

          if (!tripleKeysSet.has(tripleKey)) {
            tripleKeysSet.add(tripleKey)
            triplesToDeposit.push({
              tripleVaultId: tripleCheck.tripleVaultId!,
              subjectId: userVaultId,
              predicateId: predicateVaultId,
              objectId: objectVaultId,
              customWeight: input.customWeight,
              tripleHash: tripleCheck.tripleHash
            })
          }
        } else {
          // Create unique key for deduplication (O(1) instead of O(n))
          const tripleKey = `${userVaultId}-${predicateVaultId}-${objectVaultId}`

          if (!tripleKeysSet.has(tripleKey)) {
            tripleKeysSet.add(tripleKey)
            triplesToCreate.push({
              subjectId: userVaultId,
              predicateId: predicateVaultId,
              objectId: objectVaultId,
              originalInput: input,
              index: i,
              customWeight: input.customWeight
            })
          }
        }
      }

      if (triplesToCreate.length > 0) {

        const { walletClient, publicClient } = await getClients()
        const contractAddress: Address = BlockchainService.getContractAddress() as Address

        // Get triple cost from MultiVault
        const tripleCost = await BlockchainService.getTripleCost()

        const subjectIds = triplesToCreate.map(t => t.subjectId as Address)
        const predicateIds = triplesToCreate.map(t => t.predicateId as Address)
        const objectIds = triplesToCreate.map(t => t.objectId as Address)

        // Deposit amounts for each triple
        const depositAmounts = triplesToCreate.map(t => {
          return t.customWeight !== undefined ? t.customWeight : MIN_TRIPLE_DEPOSIT
        })

        // Count non-zero deposits
        const depositCount = depositAmounts.filter(a => a > 0n).length
        // Sum of all deposits
        const totalDeposit = depositAmounts.reduce((sum, a) => sum + a, 0n)
        // MultiVault cost = (tripleCost * count) + totalDeposit
        const multiVaultCost = (tripleCost * BigInt(triplesToCreate.length)) + totalDeposit
        // Total value including Sofia fees
        const totalValue = await BlockchainService.getTotalCreationCost(depositCount, totalDeposit, multiVaultCost)

        try {
          // Simulate first to validate and get gas estimation
          const simulation = await publicClient.simulateContract({
            address: contractAddress,
            abi: SofiaFeeProxyAbi,
            functionName: 'createTriples',
            args: [address as Address, subjectIds, predicateIds, objectIds, depositAmounts, CREATION_CURVE_ID],
            value: totalValue,
            account: walletClient.account
          })

          // Execute batch transaction with automatic gas estimation
          const batchTxParams = {
            address: contractAddress,
            abi: SofiaFeeProxyAbi as unknown as any[],
            functionName: 'createTriples',
            args: [address, subjectIds, predicateIds, objectIds, depositAmounts, CREATION_CURVE_ID],
            value: totalValue,
            chain: SELECTED_CHAIN,
            // Remove hardcoded gas - let Viem estimate automatically
            maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
            maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
            account: address
          }

          const hash = await executeTransaction(batchTxParams)

          // Wait for confirmation
          const receipt = await publicClient.waitForTransactionReceipt({ hash })

          if (receipt.status !== 'success') {
            throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
          }

          // Add successful results
          const tripleIds = simulation.result as Address[]
          for (let i = 0; i < triplesToCreate.length; i++) {
            const triple = triplesToCreate[i]
            results.push({
              success: true,
              tripleVaultId: tripleIds[i],
              txHash: hash,
              subjectVaultId: triple.subjectId,
              predicateVaultId: triple.predicateId,
              objectVaultId: triple.objectId,
              source: 'created',
              tripleHash: tripleIds[i]
            })
          }

        } catch (createError) {
          // Check if error is TripleExists
          // Note: 0x4762af7d is NOT TripleExists - it's AtomDoesNotExist
          const errorMessage = createError instanceof Error ? createError.message : ''
          const isTripleExistsError =
            errorMessage.includes('MultiVault_TripleExists') ||
            errorMessage.includes('TripleExists')

          if (isTripleExistsError) {
            logger.debug('createTriples simulation failed - triples may exist, falling back to deposits', {
              error: errorMessage,
              triplesToCreate: triplesToCreate.length
            })

            // Move all triples to deposit list since we can't determine which ones exist
            const curveId = 2n
            for (const triple of triplesToCreate) {
              // Calculate tripleId for deposit
              const tripleId = await publicClient.readContract({
                address: contractAddress,
                abi: MultiVaultAbi,
                functionName: 'calculateTripleId',
                args: [
                  triple.subjectId as Address,
                  triple.predicateId as Address,
                  triple.objectId as Address
                ]
              }) as Address

              // For deposit, use customWeight or MIN_TRIPLE_DEPOSIT as fallback
              const depositAmount = triple.customWeight !== undefined
                ? triple.customWeight
                : MIN_TRIPLE_DEPOSIT

              // Calculate total cost including Sofia fees
              const totalDepositCost = await BlockchainService.getTotalDepositCost(depositAmount)

              // Simulate deposit via Proxy
              await publicClient.simulateContract({
                address: contractAddress,
                abi: SofiaFeeProxyAbi,
                functionName: 'deposit',
                args: [
                  address as Address,
                  tripleId,
                  curveId,
                  0n
                ],
                value: totalDepositCost,
                account: walletClient.account
              })

              // Execute deposit via Proxy
              const depositHash = await walletClient.writeContract({
                address: contractAddress,
                abi: SofiaFeeProxyAbi,
                functionName: 'deposit',
                args: [
                  address as Address,
                  tripleId,
                  curveId,
                  0n
                ],
                value: totalDepositCost,
                chain: SELECTED_CHAIN,
                maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
                maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
                account: address as Address
              })

              const depositReceipt = await publicClient.waitForTransactionReceipt({ hash: depositHash })

              if (depositReceipt.status !== 'success') {
                throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${depositReceipt.status}`)
              }

              results.push({
                success: true,
                tripleVaultId: tripleId,
                txHash: depositHash,
                subjectVaultId: triple.subjectId,
                predicateVaultId: triple.predicateId,
                objectVaultId: triple.objectId,
                source: 'deposit',
                tripleHash: tripleId
              })
            }
          } else {
            // Re-throw other errors
            throw createError
          }
        }

      }

      // Process deposits on existing triples
      if (triplesToDeposit.length > 0) {
        const { walletClient, publicClient } = await getClients()
        const contractAddress: Address = BlockchainService.getContractAddress() as Address
        const curveId = 2n // Curve ID for triple deposits

        logger.debug('Processing deposits on existing triples', { count: triplesToDeposit.length })

        // Process deposits one by one (deposit doesn't have a batch function)
        for (const tripleToDeposit of triplesToDeposit) {
          // For deposit, use customWeight or MIN_TRIPLE_DEPOSIT as fallback
          const depositAmount = tripleToDeposit.customWeight !== undefined
            ? tripleToDeposit.customWeight
            : MIN_TRIPLE_DEPOSIT

          // Calculate total cost including Sofia fees
          const totalDepositCost = await BlockchainService.getTotalDepositCost(depositAmount)

          // Simulate deposit via Proxy
          await publicClient.simulateContract({
            address: contractAddress,
            abi: SofiaFeeProxyAbi,
            functionName: 'deposit',
            args: [
              address as Address,                          // receiver
              tripleToDeposit.tripleVaultId as Address,    // termId
              curveId,                                     // curveId
              0n                                           // minShares
            ],
            value: totalDepositCost,
            account: walletClient.account
          })

          // Execute deposit via Proxy
          const depositHash = await walletClient.writeContract({
            address: contractAddress,
            abi: SofiaFeeProxyAbi,
            functionName: 'deposit',
            args: [
              address as Address,
              tripleToDeposit.tripleVaultId as Address,
              curveId,
              0n
            ],
            value: totalDepositCost,
            chain: SELECTED_CHAIN,
            maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
            maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
            account: address as Address
          })

          const depositReceipt = await publicClient.waitForTransactionReceipt({ hash: depositHash })

          if (depositReceipt.status !== 'success') {
            throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${depositReceipt.status}`)
          }

          results.push({
            success: true,
            tripleVaultId: tripleToDeposit.tripleVaultId,
            txHash: depositHash,
            subjectVaultId: tripleToDeposit.subjectId,
            predicateVaultId: tripleToDeposit.predicateId,
            objectVaultId: tripleToDeposit.objectId,
            source: 'deposit',
            tripleHash: tripleToDeposit.tripleHash
          })
        }

        logger.debug('Deposits on existing triples completed', { count: triplesToDeposit.length })
      }

      // Count created vs deposited
      const createdCount = results.filter(r => r.source === 'created').length
      const depositCount = results.filter(r => r.source === 'deposit').length

      return {
        success: true,
        results,
        txHash: results.find(r => r.txHash)?.txHash,
        failedTriples: [],
        createdCount,
        depositCount
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Batch creation failed: ${errorMessage}`)
    }
  }

  return { 
    createTripleOnChain,
    createTriplesBatch
  }
}