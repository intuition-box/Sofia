import { getClients } from '../lib/clients/viemClients'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { useCreateAtom } from './useCreateAtom'
import { useStorage } from "@plasmohq/storage/hook"
import { sessionWallet } from '../lib/services/sessionWallet'
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES, PREDICATE_IDS, SUBJECT_IDS } from '../lib/config/constants'
import type { TripleOnChainResult, BatchTripleInput, BatchTripleResult } from '../types/blockchain'
import type { Address, Hash, ContractWriteParams } from '../types/viem'

const logger = createHookLogger('useCreateTripleOnChain')

// Minimum deposit for triple creation (0.01 TRUST in wei)
const MIN_TRIPLE_DEPOSIT = 10000000000000000n // 10^16 wei = 0.01 ether


export const useCreateTripleOnChain = () => {
  const { createAtomWithMultivault, createAtomsBatch } = useCreateAtom()
  const [address] = useStorage<string>("metamask-account")
  const [useSessionWallet] = useStorage<boolean>("sofia-use-session-wallet", false)
  
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

  // Utility function to get predicate atom (shared between simple and batch)
  const getPredicateAtom = async (predicateName: string) => {
    if (predicateName === 'follow') {
      return {
        vaultId: PREDICATE_IDS.FOLLOW,
        ipfsUri: '',
        name: predicateName
      }
    } else {
      const predicateAtomResult = await createAtomWithMultivault({
        name: predicateName,
        description: `Predicate representing the relation "${predicateName}"`,
        url: ''
      })
      
      return {
        vaultId: predicateAtomResult.vaultId,
        ipfsUri: '',
        name: predicateName
      }
    }
  }

  // Helper function to determine which wallet to use
  const shouldUseSessionWallet = (transactionValue: bigint): boolean => {
    if (!useSessionWallet) return false
    
    const sessionStatus = sessionWallet.getStatus()
    if (!sessionStatus.isReady) return false
    
    // Check if session wallet has enough balance
    return sessionWallet.canExecute(transactionValue)
  }

  // Helper function to execute transaction with appropriate wallet
  const executeTransaction = async (txParams: ContractWriteParams): Promise<Hash> => {
    const canUseSession = shouldUseSessionWallet(txParams.value || 0n)
    
    // Ensure proper Address typing for viem
    const viemParams = {
      ...txParams,
      address: txParams.address as Address,
      account: txParams.account as Address
    }
    
    if (canUseSession) {
      return await sessionWallet.executeTransaction(viemParams) as Hash
    } else {
      const { walletClient } = await getClients()
      return await walletClient.writeContract(viemParams)
    }
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
      
      const userAtomResult = await getUserAtom()
      
      const userAtom = {
        vaultId: userAtomResult.vaultId,
        ipfsUri: '',
        name: 'I'  // Always "I" instead of wallet address
      }
      const predicateAtom = await getPredicateAtom(predicateName)
      const objectAtom = await createAtomWithMultivault(objectData)
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

        // Simulate deposit first
        await publicClient.simulateContract({
          address: contractAddress as Address,
          abi: MultiVaultAbi,
          functionName: 'deposit',
          args: [
            address as Address,                    // receiver
            tripleCheck.tripleVaultId as Address,  // termId
            curveId,                               // curveId
            0n                                     // minShares
          ],
          value: depositAmount,
          account: walletClient.account
        })

        // Execute deposit
        const hash = await walletClient.writeContract({
          address: contractAddress as Address,
          abi: MultiVaultAbi,
          functionName: 'deposit',
          args: [
            address as Address,
            tripleCheck.tripleVaultId as Address,
            curveId,
            0n
          ],
          value: depositAmount,
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

        const feeCost = await BlockchainService.getTripleCost()

        // Step 1: Create triple with minimum deposit + fee
        const creationCost = MIN_TRIPLE_DEPOSIT + feeCost

        const subjectId = userAtom.vaultId as Address
        const predicateId = predicateAtom.vaultId as Address
        const objectId = objectAtom.vaultId as Address

        const txParams = {
          address: contractAddress,
          abi: MultiVaultAbi,
          functionName: 'createTriples',
          args: [
            [subjectId],
            [predicateId],
            [objectId],
            [creationCost]
          ],
          value: creationCost,
          chain: SELECTED_CHAIN,
          gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
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
          abi: MultiVaultAbi,
          functionName: 'createTriples',
          args: [[subjectId], [predicateId], [objectId], [creationCost]],
          value: creationCost,
          account: walletClient.account
        })

        const tripleIds = simulation.result as Address[]
        const tripleVaultId = tripleIds[0]

        // Step 2: If customWeight > minDeposit, deposit the rest on Curve 2
        if (customWeight !== undefined && customWeight > MIN_TRIPLE_DEPOSIT) {
          const additionalDeposit = customWeight - MIN_TRIPLE_DEPOSIT
          const curveId = 2n

          logger.debug('Depositing additional amount on Curve 2', {
            tripleVaultId,
            additionalDeposit: additionalDeposit.toString()
          })

          const depositHash = await walletClient.writeContract({
            address: contractAddress as Address,
            abi: MultiVaultAbi,
            functionName: 'deposit',
            args: [
              address as Address,           // receiver
              tripleVaultId as Address,     // termId
              curveId,                      // curveId = 2 (Deposit/Share curve)
              0n                            // minShares
            ],
            value: additionalDeposit,
            chain: SELECTED_CHAIN,
            maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
            maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
            account: address as Address
          })

          const depositReceipt = await publicClient.waitForTransactionReceipt({ hash: depositHash })

          if (depositReceipt.status !== 'success') {
            throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: Deposit failed - ${depositReceipt.status}`)
          }

          logger.debug('Additional deposit successful', { depositHash })
        }

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
      
      logger.debug('Starting batch triple creation', { count: inputs.length })
      
      // User atom (always needed) - will use the universal "I" subject
      const userAtomKey = `user:I`

      // Collect unique predicates and objects
      const uniquePredicates = new Set<string>()
      const uniqueObjects = new Map<string, { name: string; description?: string; url: string; image?: string }>()
      
      for (const input of inputs) {
        // Collect unique predicates
        uniquePredicates.add(input.predicateName)
        
        // Object atoms
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
      
      // Create/get all unique predicates using the SAME unified logic as simple function
      for (const predicateName of uniquePredicates) {
        const predicateAtom = await getPredicateAtom(predicateName)
        atomResults.set(`predicate:${predicateName}`, predicateAtom.vaultId)
      }
      
      // Create all object atoms in a single batch transaction
      if (uniqueObjects.size > 0) {
        logger.debug('Creating object atoms in batch', { count: uniqueObjects.size })
        
        const atomsDataArray = Array.from(uniqueObjects.values()).map(objData => ({
          name: objData.name,
          description: objData.description || "Contenu visité par l'utilisateur.",
          url: objData.url,
          image: objData.image
        }))
        
        const batchResults = await createAtomsBatch(atomsDataArray)
        
        // Map batch results to atomResults
        for (const [objectName, atomResult] of Object.entries(batchResults)) {
          atomResults.set(`object:${objectName}`, atomResult.vaultId)
        }
        
        logger.debug('Object atoms batch creation completed', { count: Object.keys(batchResults).length })
      }

      // All atoms are now created/retrieved in batches above

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

        // Get fee cost from contract
        const feeCost = await BlockchainService.getTripleCost()

        // Step 1: Create all triples with minimum deposit + fee
        const subjectIds = triplesToCreate.map(t => t.subjectId as Address)
        const predicateIds = triplesToCreate.map(t => t.predicateId as Address)
        const objectIds = triplesToCreate.map(t => t.objectId as Address)
        // Each triple is created with MIN_TRIPLE_DEPOSIT + feeCost
        const creationCost = MIN_TRIPLE_DEPOSIT + feeCost
        const tripleCosts = triplesToCreate.map(() => creationCost)

        const totalValue = tripleCosts.reduce((sum, cost) => sum + cost, 0n)

        try {
          // Simulate first to validate and get gas estimation
          const simulation = await publicClient.simulateContract({
            address: contractAddress,
            abi: MultiVaultAbi,
            functionName: 'createTriples',
            args: [subjectIds, predicateIds, objectIds, tripleCosts],
            value: totalValue,
            account: walletClient.account
          })

          // Execute batch transaction with automatic gas estimation
          const batchTxParams = {
            address: contractAddress,
            abi: MultiVaultAbi,
            functionName: 'createTriples',
            args: [subjectIds, predicateIds, objectIds, tripleCosts],
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

          // Step 2: For triples with customWeight > minDeposit, deposit the rest on Curve 2
          const triplesNeedingDeposit = triplesToCreate.filter(t =>
            t.customWeight !== undefined && t.customWeight > MIN_TRIPLE_DEPOSIT
          )

          if (triplesNeedingDeposit.length > 0) {
            const curveId = 2n

            logger.debug('Processing additional deposits on Curve 2', {
              count: triplesNeedingDeposit.length
            })

            for (const triple of triplesNeedingDeposit) {
              const tripleIndex = triplesToCreate.indexOf(triple)
              const tripleVaultId = tripleIds[tripleIndex]
              const additionalAmount = triple.customWeight! - MIN_TRIPLE_DEPOSIT

              const depositHash = await walletClient.writeContract({
                address: contractAddress,
                abi: MultiVaultAbi,
                functionName: 'deposit',
                args: [address as Address, tripleVaultId, curveId, 0n],
                value: additionalAmount,
                chain: SELECTED_CHAIN,
                maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
                maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
                account: address as Address
              })

              const depositReceipt = await publicClient.waitForTransactionReceipt({ hash: depositHash })

              if (depositReceipt.status !== 'success') {
                throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: Additional deposit failed - ${depositReceipt.status}`)
              }

              logger.debug('Additional deposit successful', {
                tripleVaultId,
                additionalAmount: additionalAmount.toString(),
                depositHash
              })
            }
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

              // For deposit, use customWeight directly (no feeCost needed)
              const depositAmount = triple.customWeight !== undefined
                ? triple.customWeight
                : feeCost

              // Simulate deposit
              await publicClient.simulateContract({
                address: contractAddress,
                abi: MultiVaultAbi,
                functionName: 'deposit',
                args: [
                  address as Address,
                  tripleId,
                  curveId,
                  0n
                ],
                value: depositAmount,
                account: walletClient.account
              })

              // Execute deposit
              const depositHash = await walletClient.writeContract({
                address: contractAddress,
                abi: MultiVaultAbi,
                functionName: 'deposit',
                args: [
                  address as Address,
                  tripleId,
                  curveId,
                  0n
                ],
                value: depositAmount,
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
        const feeCost = await BlockchainService.getTripleCost()
        const curveId = 2n // Curve ID for triple deposits

        logger.debug('Processing deposits on existing triples', { count: triplesToDeposit.length })

        // Process deposits one by one (deposit doesn't have a batch function)
        for (const tripleToDeposit of triplesToDeposit) {
          // For deposit, use customWeight directly (no feeCost needed)
          const depositAmount = tripleToDeposit.customWeight !== undefined
            ? tripleToDeposit.customWeight
            : feeCost

          // Simulate deposit first
          await publicClient.simulateContract({
            address: contractAddress,
            abi: MultiVaultAbi,
            functionName: 'deposit',
            args: [
              address as Address,                          // receiver
              tripleToDeposit.tripleVaultId as Address,    // termId
              curveId,                                     // curveId
              0n                                           // minShares
            ],
            value: depositAmount,
            account: walletClient.account
          })

          // Execute deposit
          const depositHash = await walletClient.writeContract({
            address: contractAddress,
            abi: MultiVaultAbi,
            functionName: 'deposit',
            args: [
              address as Address,
              tripleToDeposit.tripleVaultId as Address,
              curveId,
              0n
            ],
            value: depositAmount,
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