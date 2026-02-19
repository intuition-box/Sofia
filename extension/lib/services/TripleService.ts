/**
 * TripleService
 *
 * Handles triple creation and deposits on the Intuition blockchain.
 * Extracted from useCreateTripleOnChain hook to separate blockchain logic from React.
 *
 * Related files:
 * - hooks/useCreateTripleOnChain.ts: React hook wrapper (atom resolution)
 * - hooks/useVoteOnTriple.ts: Vote hook (uses createTripleOnChain)
 * - AtomService.ts: atom creation
 * - blockchainService.ts: low-level blockchain operations
 */

import { getClients } from '../clients/viemClients'
import { MultiVaultAbi } from '../../ABI/MultiVault'
import { SofiaFeeProxyAbi } from '../../ABI/SofiaFeeProxy'
import { SELECTED_CHAIN } from '../config/chainConfig'
import { BlockchainService } from './blockchainService'
import { createServiceLogger } from '../utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES, PREDICATE_IDS, SUBJECT_IDS } from '../config/constants'
import type { TripleOnChainResult, BatchTripleResult } from '../../types/blockchain'
import type { Address, Hash, ContractWriteParams } from '../../types/viem'

const logger = createServiceLogger('TripleService')

// Minimum deposit for triple creation (0.01 TRUST in wei)
const MIN_TRIPLE_DEPOSIT = 10000000000000000n // 10^16 wei = 0.01 ether

// Curve ID for creation deposits (1 = linear/upvote)
const CREATION_CURVE_ID = 1n

/** Triple with already-resolved vault IDs */
export interface ResolvedTriple {
  subjectId: string
  predicateId: string
  objectId: string
  customWeight?: bigint
}

class TripleServiceClass {
  /** Get the universal "I" subject atom. Validates wallet address. */
  getUserAtom(address: string) {
    if (!address) {
      throw new Error('No wallet connected')
    }

    return {
      vaultId: SUBJECT_IDS.I,
      success: true,
      ipfsUri: '',
      name: 'I'
    }
  }

  /** Check if predicate has a pre-defined ID (no creation needed). */
  getPredicateIdIfExists(predicateName: string): string | null {
    if (predicateName === 'follow') {
      return PREDICATE_IDS.FOLLOW
    }
    if (predicateName === 'trusts') {
      return PREDICATE_IDS.TRUSTS
    }
    if (predicateName === 'distrust') {
      return PREDICATE_IDS.DISTRUST || null
    }
    if (predicateName === 'visits for work') {
      return PREDICATE_IDS.VISITS_FOR_WORK || null
    }
    if (predicateName === 'visits for learning') {
      return PREDICATE_IDS.VISITS_FOR_LEARNING || null
    }
    if (predicateName === 'visits for fun') {
      return PREDICATE_IDS.VISITS_FOR_FUN || null
    }
    if (predicateName === 'visits for inspiration') {
      return PREDICATE_IDS.VISITS_FOR_INSPIRATION || null
    }
    if (predicateName === 'visits for buying') {
      return PREDICATE_IDS.VISITS_FOR_BUYING || null
    }
    if (predicateName === 'visits for music') {
      return PREDICATE_IDS.VISITS_FOR_MUSIC || null
    }
    if (predicateName === 'like') {
      return PREDICATE_IDS.LIKE || null
    }
    if (predicateName === 'dislike') {
      return PREDICATE_IDS.DISLIKE || null
    }
    return null
  }

  /** Helper to execute a transaction with the wallet client. */
  private async executeTransaction(txParams: ContractWriteParams): Promise<Hash> {
    const viemParams = {
      ...txParams,
      address: txParams.address as Address,
      account: txParams.account as Address
    }

    const { walletClient } = await getClients()
    return await walletClient.writeContract(viemParams)
  }

  /**
   * Create or deposit on a triple with already-resolved vault IDs.
   *
   * @param depositCurveId - Curve for deposits. Default 2n (progressive).
   *   Votes use 1n (linear) via CREATION_CURVE_ID.
   */
  async createTripleOnChain(
    subjectId: string,
    predicateId: string,
    objectId: string,
    address: string,
    customWeight?: bigint,
    depositCurveId: bigint = 2n
  ): Promise<TripleOnChainResult> {
    try {
      const tripleCheck = await BlockchainService.checkTripleExists(
        subjectId,
        predicateId,
        objectId
      )

      if (tripleCheck.exists) {
        // Triple exists — deposit on it
        const { walletClient, publicClient } = await getClients()
        const contractAddress = BlockchainService.getContractAddress()

        const feeCost = await BlockchainService.getTripleCost()
        const depositAmount = customWeight !== undefined ? customWeight : feeCost

        logger.debug('Triple exists, performing deposit instead', {
          tripleVaultId: tripleCheck.tripleVaultId,
          depositAmount: depositAmount.toString()
        })

        const totalDepositCost = await BlockchainService.getTotalDepositCost(depositAmount)

        // Simulate deposit via Proxy
        await publicClient.simulateContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'deposit',
          args: [
            address as Address,
            tripleCheck.tripleVaultId as Address,
            depositCurveId,
            0n
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
            depositCurveId,
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
          subjectVaultId: subjectId,
          predicateVaultId: predicateId,
          objectVaultId: objectId,
          source: 'deposit',
          tripleHash: tripleCheck.tripleHash
        }
      } else {
        // Triple doesn't exist — create it
        const { walletClient, publicClient } = await getClients()
        const contractAddress = BlockchainService.getContractAddress()

        const tripleCost = await BlockchainService.getTripleCost()
        const depositAmount = customWeight !== undefined ? customWeight : MIN_TRIPLE_DEPOSIT
        const multiVaultCost = tripleCost + depositAmount
        const totalCost = await BlockchainService.getTotalCreationCost(1, depositAmount, multiVaultCost)

        // Calculate tripleId BEFORE transaction (deterministic hash)
        const tripleVaultId = await publicClient.readContract({
          address: BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS as Address,
          abi: MultiVaultAbi,
          functionName: 'calculateTripleId',
          args: [subjectId as Address, predicateId as Address, objectId as Address]
        }) as Address

        console.log('🔍 [createTripleOnChain] Creating triple with:', {
          subjectId,
          predicateId,
          objectId,
          tripleVaultId,
          depositAmount: depositAmount.toString(),
          totalCost: totalCost.toString(),
          receiver: address
        })

        // Simulate first
        try {
          await publicClient.simulateContract({
            address: contractAddress as Address,
            abi: SofiaFeeProxyAbi,
            functionName: 'createTriples',
            args: [address as Address, [subjectId as Address], [predicateId as Address], [objectId as Address], [depositAmount], CREATION_CURVE_ID],
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
          abi: SofiaFeeProxyAbi,
          functionName: 'createTriples',
          args: [
            address,
            [subjectId as Address],
            [predicateId as Address],
            [objectId as Address],
            [depositAmount],
            CREATION_CURVE_ID
          ],
          value: totalCost,
          chain: SELECTED_CHAIN,
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: address
        }

        const hash = await this.executeTransaction(txParams)

        const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as Address })

        if (receipt.status !== 'success') {
          throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
        }

        return {
          success: true,
          tripleVaultId: tripleVaultId,
          txHash: hash,
          subjectVaultId: subjectId,
          predicateVaultId: predicateId,
          objectVaultId: objectId,
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

  /**
   * Create/deposit on multiple triples with already-resolved vault IDs.
   * Handles deduplication, batch creation, and fallback to deposits.
   */
  async createTriplesBatch(
    resolvedTriples: ResolvedTriple[],
    address: string
  ): Promise<BatchTripleResult> {
    try {
      if (!address) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      }

      const results: TripleOnChainResult[] = []
      const triplesToCreate: (ResolvedTriple & { index: number })[] = []
      const triplesToDeposit: (ResolvedTriple & { tripleVaultId: string; tripleHash: string })[] = []

      // O(1) deduplication
      const tripleKeysSet = new Set<string>()

      for (let i = 0; i < resolvedTriples.length; i++) {
        const triple = resolvedTriples[i]
        const tripleKey = `${triple.subjectId}-${triple.predicateId}-${triple.objectId}`

        if (tripleKeysSet.has(tripleKey)) continue
        tripleKeysSet.add(tripleKey)

        const tripleCheck = await BlockchainService.checkTripleExists(
          triple.subjectId,
          triple.predicateId,
          triple.objectId
        )

        if (tripleCheck.exists) {
          triplesToDeposit.push({
            ...triple,
            tripleVaultId: tripleCheck.tripleVaultId!,
            tripleHash: tripleCheck.tripleHash
          })
        } else {
          triplesToCreate.push({ ...triple, index: i })
        }
      }

      // Batch create new triples
      if (triplesToCreate.length > 0) {
        const { walletClient, publicClient } = await getClients()
        const contractAddress: Address = BlockchainService.getContractAddress() as Address
        const tripleCost = await BlockchainService.getTripleCost()

        const subjectIds = triplesToCreate.map(t => t.subjectId as Address)
        const predicateIds = triplesToCreate.map(t => t.predicateId as Address)
        const objectIds = triplesToCreate.map(t => t.objectId as Address)

        const depositAmounts = triplesToCreate.map(t =>
          t.customWeight !== undefined ? t.customWeight : MIN_TRIPLE_DEPOSIT
        )

        const depositCount = depositAmounts.filter(a => a > 0n).length
        const totalDeposit = depositAmounts.reduce((sum, a) => sum + a, 0n)
        const multiVaultCost = (tripleCost * BigInt(triplesToCreate.length)) + totalDeposit
        const totalValue = await BlockchainService.getTotalCreationCost(depositCount, totalDeposit, multiVaultCost)

        try {
          const simulation = await publicClient.simulateContract({
            address: contractAddress,
            abi: SofiaFeeProxyAbi,
            functionName: 'createTriples',
            args: [address as Address, subjectIds, predicateIds, objectIds, depositAmounts, CREATION_CURVE_ID],
            value: totalValue,
            account: walletClient.account
          })

          const batchTxParams = {
            address: contractAddress,
            abi: SofiaFeeProxyAbi,
            functionName: 'createTriples',
            args: [address, subjectIds, predicateIds, objectIds, depositAmounts, CREATION_CURVE_ID],
            value: totalValue,
            chain: SELECTED_CHAIN,
            maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
            maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
            account: address
          }

          const hash = await this.executeTransaction(batchTxParams)
          const receipt = await publicClient.waitForTransactionReceipt({ hash })

          if (receipt.status !== 'success') {
            throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
          }

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
          const errorMessage = createError instanceof Error ? createError.message : ''
          const isTripleExistsError =
            errorMessage.includes('MultiVault_TripleExists') ||
            errorMessage.includes('TripleExists')

          if (isTripleExistsError) {
            logger.debug('createTriples simulation failed - triples may exist, falling back to deposits', {
              error: errorMessage,
              triplesToCreate: triplesToCreate.length
            })

            const curveId = 2n
            for (const triple of triplesToCreate) {
              const tripleId = await publicClient.readContract({
                address: contractAddress,
                abi: MultiVaultAbi,
                functionName: 'calculateTripleId',
                args: [
                  triple.subjectId as Address,
                  triple.predicateId as Address,
                  triple.objectId as Address
                ],
                authorizationList: undefined
              }) as Address

              const depositAmount = triple.customWeight !== undefined
                ? triple.customWeight
                : MIN_TRIPLE_DEPOSIT

              const totalDepositCost = await BlockchainService.getTotalDepositCost(depositAmount)

              await publicClient.simulateContract({
                address: contractAddress,
                abi: SofiaFeeProxyAbi,
                functionName: 'deposit',
                args: [address as Address, tripleId, curveId, 0n],
                value: totalDepositCost,
                account: walletClient.account
              })

              const depositHash = await walletClient.writeContract({
                address: contractAddress,
                abi: SofiaFeeProxyAbi,
                functionName: 'deposit',
                args: [address as Address, tripleId, curveId, 0n],
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
            throw createError
          }
        }
      }

      // Process deposits on existing triples
      if (triplesToDeposit.length > 0) {
        const { walletClient, publicClient } = await getClients()
        const contractAddress: Address = BlockchainService.getContractAddress() as Address
        const curveId = 2n

        logger.debug('Processing deposits on existing triples', { count: triplesToDeposit.length })

        for (const tripleToDeposit of triplesToDeposit) {
          const depositAmount = tripleToDeposit.customWeight !== undefined
            ? tripleToDeposit.customWeight
            : MIN_TRIPLE_DEPOSIT

          const totalDepositCost = await BlockchainService.getTotalDepositCost(depositAmount)

          await publicClient.simulateContract({
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
            account: walletClient.account
          })

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
}

// Singleton instance
export const tripleService = new TripleServiceClass()

// Export class for testing
export { TripleServiceClass }
