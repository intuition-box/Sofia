/**
 * TripleService
 *
 * Handles triple creation and deposits on the Intuition blockchain.
 * Extracted from useCreateTripleOnChain hook to separate blockchain logic from React.
 *
 * Uses depositBatch() to combine multiple deposits (+ global stake) into a single
 * MetaMask confirmation when possible.
 *
 * Related files:
 * - hooks/useCreateTripleOnChain.ts: React hook wrapper (atom resolution)
 * - hooks/useCreateFollowTriples.ts: Follow hook (uses createTripleOnChain)
 * - hooks/useTrustAccount.ts: Trust hook (uses createTripleOnChain)
 * - AtomService.ts: atom creation
 * - blockchainService.ts: low-level blockchain operations
 * - GlobalStakeService.ts: split calculation for global stake
 */

import { getClients, getPublicClient } from '../clients/viemClients'
import { MultiVaultAbi } from '../../ABI/MultiVault'
import { SofiaFeeProxyAbi } from '../../ABI/SofiaFeeProxy'
import { SELECTED_CHAIN } from '../config/chainConfig'
import { BlockchainService } from './blockchainService'
import { globalStakeService } from './GlobalStakeService'
import { platformPoolService } from './PlatformPoolService'
import { createServiceLogger } from '../utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES, PREDICATE_IDS, SUBJECT_IDS } from '../config/constants'
import type { TripleOnChainResult, BatchTripleResult } from '../../types/blockchain'
import type { Address, Hash } from '../../types/viem'

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
    if (predicateName === 'in context of') {
      return PREDICATE_IDS.IN_CONTEXT_OF || null
    }
    return null
  }

  /**
   * Execute a depositBatch with fee calculation.
   * Combines multiple deposits into a single MetaMask confirmation.
   */
  private async executeDepositBatch(
    address: string,
    termIds: string[],
    curveIds: bigint[],
    assets: bigint[]
  ): Promise<Hash> {
    const { walletClient, publicClient } = await getClients()
    const contractAddress = BlockchainService.getContractAddress()

    const totalDeposit = assets.reduce((sum, a) => sum + a, 0n)
    const fee = await BlockchainService.calculateDepositFee(assets.length, totalDeposit)
    const totalValue = totalDeposit + fee
    const minShares = assets.map(() => 0n)

    logger.debug('depositBatch', {
      count: termIds.length,
      totalDeposit: totalDeposit.toString(),
      fee: fee.toString(),
      totalValue: totalValue.toString()
    })

    // Simulate first
    await publicClient.simulateContract({
      address: contractAddress as Address,
      abi: SofiaFeeProxyAbi,
      functionName: 'depositBatch',
      args: [
        address as Address,
        termIds as Address[],
        curveIds,
        assets,
        minShares
      ],
      value: totalValue,
      account: walletClient.account
    })

    // Execute
    const hash = await walletClient.writeContract({
      address: contractAddress as Address,
      abi: SofiaFeeProxyAbi,
      functionName: 'depositBatch',
      args: [
        address as Address,
        termIds as Address[],
        curveIds,
        assets,
        minShares
      ],
      value: totalValue,
      chain: SELECTED_CHAIN,
      maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
      account: address as Address
    })

    return hash
  }

  /**
   * Append GS + PP entries to batch arrays in a SINGLE pass.
   * Computes the combined signal ratio once, avoiding double-scaling.
   * Mutates the arrays in place.
   */
  private appendPoolDeposits(
    termIds: string[],
    curveIds: bigint[],
    assets: bigint[],
    totalDepositAmount: bigint,
    platformTermIds: string[]
  ): void {
    if (totalDepositAmount === 0n) return

    const gsEnabled = globalStakeService.isEnabled()
    const gsSplit = gsEnabled ? globalStakeService.calculateSplit(totalDepositAmount) : null
    const gsConfig = gsEnabled ? globalStakeService.getConfig() : null

    const ppEnabled = platformPoolService.isEnabled() && platformTermIds.length > 0
    const ppSplit = ppEnabled ? platformPoolService.calculateSplit(totalDepositAmount) : null

    // Calculate combined signal ratio in one pass
    // signal = total - gsAmount - ppAmount
    const gsAmount = gsSplit?.globalAmount ?? 0n
    const ppAmount = ppSplit?.platformAmount ?? 0n
    const signalAmount = totalDepositAmount - gsAmount - ppAmount

    if (signalAmount <= 0n) {
      logger.warn("Pool deposits would consume entire deposit, skipping", {
        total: totalDepositAmount.toString(),
        gs: gsAmount.toString(),
        pp: ppAmount.toString()
      })
      return
    }

    // Scale down ALL existing assets in one pass
    const originalCount = assets.length
    for (let i = 0; i < originalCount; i++) {
      assets[i] = (assets[i] * signalAmount) / totalDepositAmount
    }

    // Append GS entry
    if (gsSplit && gsConfig) {
      termIds.push(gsConfig.termId)
      curveIds.push(gsConfig.curveId)
      assets.push(gsAmount)
      logger.debug("GS appended", { amount: gsAmount.toString() })
    }

    // Append PP entries (split equally per platform)
    if (ppSplit && platformTermIds.length > 0) {
      const perPlatform = ppAmount / BigInt(platformTermIds.length)
      if (perPlatform > 0n) {
        for (const termId of platformTermIds) {
          termIds.push(termId)
          curveIds.push(1n)
          assets.push(perPlatform)
        }
        logger.debug("PP appended", {
          count: platformTermIds.length,
          perPlatform: perPlatform.toString()
        })
      }
    }
  }

  /**
   * Detect unique platforms from URLs.
   * Returns deduplicated array of platform termIds.
   */
  private resolveUniquePlatformTermIds(urls?: string[]): string[] {
    if (!urls?.length || !platformPoolService.isEnabled()) return []
    const seen = new Set<string>()
    const result: string[] = []
    for (const url of urls) {
      const platform = platformPoolService.detectPlatformFromUrl(url)
      if (platform && !seen.has(platform.termId)) {
        seen.add(platform.termId)
        result.push(platform.termId)
      }
    }
    return result
  }

  /**
   * Create or deposit on a triple with already-resolved vault IDs.
   *
   * When the triple exists and global stake is enabled, uses depositBatch
   * to combine main deposit + GS deposit in a single TX.
   *
   * When the triple doesn't exist, creates it first, then does a separate
   * GS deposit (can't mix createTriples + depositBatch).
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
        // Triple exists — deposit on it (+ global stake if enabled)
        const publicClient = getPublicClient()

        const feeCost = await BlockchainService.getTripleCost()
        const depositAmount = customWeight !== undefined ? customWeight : feeCost

        logger.debug('Triple exists, performing deposit', {
          tripleVaultId: tripleCheck.tripleVaultId,
          depositAmount: depositAmount.toString()
        })

        // Build batch arrays
        const termIds = [tripleCheck.tripleVaultId!]
        const curveIds = [depositCurveId]
        const assets = [depositAmount]

        // Append GS + PP if enabled (single pass, no double-scaling)
        this.appendPoolDeposits(termIds, curveIds, assets, depositAmount, [])

        let hash: Hash

        if (termIds.length > 1) {
          // depositBatch: main + pools in 1 TX
          hash = await this.executeDepositBatch(address, termIds, curveIds, assets)
        } else {
          // Single deposit (GS disabled or amount too small)
          const totalDepositCost = await BlockchainService.getTotalDepositCost(depositAmount)

          const { walletClient } = await getClients()
          const contractAddress = BlockchainService.getContractAddress()

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

          hash = await walletClient.writeContract({
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
        }

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
        const totalDeposit = customWeight !== undefined ? customWeight : MIN_TRIPLE_DEPOSIT

        // Split deposit: reduce signal amount if GS enabled, GS deposited separately after create
        const split = globalStakeService.isEnabled()
          ? globalStakeService.calculateSplit(totalDeposit)
          : null
        const signalDeposit = split ? split.mainAmount : totalDeposit

        const multiVaultCost = tripleCost + signalDeposit
        const totalCost = await BlockchainService.getTotalCreationCost(1, signalDeposit, multiVaultCost)

        // Calculate tripleId BEFORE transaction (deterministic hash)
        const tripleVaultId = await publicClient.readContract({
          address: BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS as Address,
          abi: MultiVaultAbi,
          functionName: 'calculateTripleId',
          args: [subjectId as Address, predicateId as Address, objectId as Address],
          authorizationList: undefined
        }) as Address

        logger.debug('Creating triple', {
          subjectId,
          predicateId,
          objectId,
          tripleVaultId,
          signalDeposit: signalDeposit.toString(),
          gsAmount: split?.globalAmount?.toString() || '0',
          totalCost: totalCost.toString()
        })

        // Simulate first
        await publicClient.simulateContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'createTriples',
          args: [address as Address, [subjectId as Address], [predicateId as Address], [objectId as Address], [signalDeposit], CREATION_CURVE_ID],
          value: totalCost,
          account: walletClient.account
        })

        const hash = await walletClient.writeContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'createTriples',
          args: [
            address as Address,
            [subjectId as Address],
            [predicateId as Address],
            [objectId as Address],
            [signalDeposit],
            CREATION_CURVE_ID
          ],
          value: totalCost,
          chain: SELECTED_CHAIN,
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: address as Address
        })

        const receipt = await publicClient.waitForTransactionReceipt({ hash })

        if (receipt.status !== 'success') {
          throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
        }

        // Global stake deposit after successful create (separate TX, non-blocking on failure)
        if (split) {
          try {
            const config = globalStakeService.getConfig()
            const gsCost = await BlockchainService.getTotalDepositCost(split.globalAmount)

            const gsHash = await walletClient.writeContract({
              address: contractAddress as Address,
              abi: SofiaFeeProxyAbi,
              functionName: 'deposit',
              args: [
                address as Address,
                config.termId as Address,
                config.curveId,
                0n
              ],
              value: gsCost,
              chain: SELECTED_CHAIN,
              maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
              maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
              account: address as Address
            })

            await publicClient.waitForTransactionReceipt({ hash: gsHash })
            logger.info('Global stake deposit after create succeeded')
          } catch (gsError) {
            logger.warn('Global stake deposit failed (non-blocking)', gsError)
          }
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
   * Handles deduplication, batch creation, and uses depositBatch for existing triples.
   *
   * Existing triples are combined into a single depositBatch() call
   * (+ global stake if enabled) = 1 MetaMask popup instead of N.
   */
  async createTriplesBatch(
    resolvedTriples: ResolvedTriple[],
    address: string,
    urls?: string[]
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

        const originalAmounts = triplesToCreate.map(t =>
          t.customWeight !== undefined ? t.customWeight : MIN_TRIPLE_DEPOSIT
        )

        // Split: reduce signal amounts if GS enabled, GS deposited separately after create
        const totalOriginal = originalAmounts.reduce((sum, a) => sum + a, 0n)
        const batchSplit = globalStakeService.isEnabled()
          ? globalStakeService.calculateSplit(totalOriginal)
          : null

        // Scale down each deposit proportionally if GS active
        const depositAmounts = batchSplit
          ? originalAmounts.map(a => (a * batchSplit.mainAmount) / totalOriginal)
          : originalAmounts

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

          const hash = await walletClient.writeContract({
            address: contractAddress,
            abi: SofiaFeeProxyAbi,
            functionName: 'createTriples',
            args: [address as Address, subjectIds, predicateIds, objectIds, depositAmounts, CREATION_CURVE_ID],
            value: totalValue,
            chain: SELECTED_CHAIN,
            maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
            maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
            account: address as Address
          })
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

          // Global stake + platform pool after batch create (separate TX, non-blocking)
          const postCreateTermIds: string[] = []
          const postCreateCurveIds: bigint[] = []
          const postCreateAssets: bigint[] = []

          if (batchSplit) {
            const config = globalStakeService.getConfig()
            postCreateTermIds.push(config.termId)
            postCreateCurveIds.push(config.curveId)
            postCreateAssets.push(batchSplit.globalAmount)
          }

          // Platform pool deposits after creation (one per unique platform)
          const createPlatformTermIds = this.resolveUniquePlatformTermIds(urls)
          if (createPlatformTermIds.length > 0) {
            const ppSplit = platformPoolService.calculateSplit(totalDeposit)
            if (ppSplit) {
              const perPlatform = ppSplit.platformAmount / BigInt(createPlatformTermIds.length)
              for (const ptId of createPlatformTermIds) {
                postCreateTermIds.push(ptId)
                postCreateCurveIds.push(1n)
                postCreateAssets.push(perPlatform)
              }
            }
          }

          if (postCreateTermIds.length > 0) {
            try {
              const postCreateHash = await this.executeDepositBatch(
                address,
                postCreateTermIds,
                postCreateCurveIds,
                postCreateAssets
              )
              await publicClient.waitForTransactionReceipt({ hash: postCreateHash })
              logger.info('Post-create deposits succeeded (GS + platform pool)', {
                entries: postCreateTermIds.length
              })
            } catch (postError) {
              logger.warn('Post-create deposits failed (non-blocking)', postError)
            }
          }

        } catch (createError) {
          const errorMessage = createError instanceof Error ? createError.message : ''
          const isTripleExistsError =
            errorMessage.includes('MultiVault_TripleExists') ||
            errorMessage.includes('TripleExists')

          if (isTripleExistsError) {
            logger.debug('createTriples failed - triples may exist, falling back to depositBatch', {
              error: errorMessage,
              triplesToCreate: triplesToCreate.length
            })

            // Fallback: all "to create" triples actually exist → batch deposit them
            const fallbackTermIds: string[] = []
            const fallbackCurveIds: bigint[] = []
            const fallbackAssets: bigint[] = []

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

              fallbackTermIds.push(tripleId)
              fallbackCurveIds.push(2n)
              fallbackAssets.push(depositAmount)
            }

            // Append GS + PP in single pass
            const totalFallbackDeposit = fallbackAssets.reduce((sum, a) => sum + a, 0n)
            const fallbackPlatformTermIds = this.resolveUniquePlatformTermIds(urls)
            this.appendPoolDeposits(fallbackTermIds, fallbackCurveIds, fallbackAssets, totalFallbackDeposit, fallbackPlatformTermIds)

            // Single depositBatch for all fallback deposits
            const fallbackHash = await this.executeDepositBatch(
              address,
              fallbackTermIds,
              fallbackCurveIds,
              fallbackAssets
            )

            const fallbackReceipt = await publicClient.waitForTransactionReceipt({ hash: fallbackHash })

            if (fallbackReceipt.status !== 'success') {
              throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${fallbackReceipt.status}`)
            }

            for (let i = 0; i < triplesToCreate.length; i++) {
              const triple = triplesToCreate[i]
              results.push({
                success: true,
                tripleVaultId: fallbackTermIds[i],
                txHash: fallbackHash,
                subjectVaultId: triple.subjectId,
                predicateVaultId: triple.predicateId,
                objectVaultId: triple.objectId,
                source: 'deposit',
                tripleHash: fallbackTermIds[i]
              })
            }
          } else {
            throw createError
          }
        }
      }

      // Process deposits on existing triples — single depositBatch
      if (triplesToDeposit.length > 0) {
        const publicClient = getPublicClient()

        logger.debug('Processing deposits on existing triples via depositBatch', {
          count: triplesToDeposit.length
        })

        const termIds = triplesToDeposit.map(t => t.tripleVaultId)
        const curveIds = triplesToDeposit.map(() => 2n)
        const assets = triplesToDeposit.map(t =>
          t.customWeight !== undefined ? t.customWeight : MIN_TRIPLE_DEPOSIT
        )

        // Append GS + PP in single pass
        const totalDeposit = assets.reduce((sum, a) => sum + a, 0n)
        const depositPlatformTermIds = this.resolveUniquePlatformTermIds(urls)
        this.appendPoolDeposits(termIds, curveIds, assets, totalDeposit, depositPlatformTermIds)

        // Single depositBatch for all existing triple deposits + GS + PP
        const depositHash = await this.executeDepositBatch(
          address,
          termIds,
          curveIds,
          assets
        )

        const depositReceipt = await publicClient.waitForTransactionReceipt({ hash: depositHash })

        if (depositReceipt.status !== 'success') {
          throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${depositReceipt.status}`)
        }

        for (const tripleToDeposit of triplesToDeposit) {
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

        logger.debug('Batch deposits completed', { count: triplesToDeposit.length })
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
