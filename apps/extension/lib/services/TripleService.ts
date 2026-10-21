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
 * - PlatformPoolService.ts: platform pool share, taken out of the stake
 */

import { getPublicClient } from '../clients/viemClients'
import { getSigner } from '../signer'
import { MultiVaultAbi } from '../../ABI/MultiVault'
import { SofiaFeeProxyAbi } from '../../ABI/SofiaFeeProxy'
import { BlockchainService } from './blockchainService'
import { platformPoolService } from './PlatformPoolService'
import { createServiceLogger } from '../utils/logger'
import { explicitGasLimit } from '../utils/gasLimit'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES, SUBJECT_IDS } from '../config/constants'
import { getPredicateIdByName } from '../config/predicateConstants'
import type { TripleOnChainResult, BatchTripleResult } from '../../types/blockchain'
import type { Address, Hash } from 'viem'

const logger = createServiceLogger('TripleService')

// Minimum deposit for triple creation (0.01 TRUST in wei)
const MIN_TRIPLE_DEPOSIT = 10000000000000000n // 10^16 wei = 0.01 ether

// Curve for creation AND deposits on page claims: progressive (2), so the
// price rises as followers take a position — that's how early positions gain.
const CREATION_CURVE_ID = 2n
const MARKET_CURVE_ID = 2n

/** Triple with already-resolved vault IDs */
export interface ResolvedTriple {
  subjectId: string
  predicateId: string
  objectId: string
  customWeight?: bigint
  /** oppose = deposit on the claim's counter vault (created first if needed) */
  side?: 'support' | 'oppose'
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
    return getPredicateIdByName(predicateName)
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
    const signer = await getSigner()
    const publicClient = getPublicClient()
    const contractAddress = BlockchainService.getContractAddress()

    const totalDeposit = assets.reduce((sum, a) => sum + a, 0n)
    const fee = await BlockchainService.calculateDepositFee(assets.length, totalDeposit)
    const totalValue = totalDeposit + fee
    const minShares = await BlockchainService.previewDepositMinSharesBatch(
      termIds,
      curveIds,
      assets
    )

    logger.debug('depositBatch', {
      count: termIds.length,
      totalDeposit: totalDeposit.toString(),
      fee: fee.toString(),
      totalValue: totalValue.toString()
    })

    const depositArgs = [
      address as Address,
      termIds as Address[],
      curveIds,
      assets,
      minShares
    ] as const

    // Simulate first
    await publicClient.simulateContract({
      address: contractAddress as Address,
      abi: SofiaFeeProxyAbi,
      functionName: 'depositBatch',
      args: depositArgs,
      value: totalValue,
      account: signer.account
    })

    // Explicit gas limit so the wallet never falls back to the 2^50 block
    // limit on large batches (~600k gas/item heuristic; over-estimate is free)
    const gas = await explicitGasLimit(
      publicClient,
      {
        address: contractAddress as Address,
        abi: SofiaFeeProxyAbi,
        functionName: 'depositBatch',
        args: depositArgs,
        value: totalValue,
        account: signer.account
      },
      BigInt(termIds.length) * 600_000n + 1_000_000n
    )

    // Execute
    const hash = await signer.writeContract({
      address: contractAddress as Address,
      abi: SofiaFeeProxyAbi,
      functionName: 'depositBatch',
      args: depositArgs,
      value: totalValue,
      gas,
      maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS
    })

    return hash
  }

  /**
   * Take the platform pool share OUT of the stake: scale the signal entries
   * down by the pool amount, then append one pool entry per platform.
   * The user pays exactly `totalDepositAmount`. Mutates the arrays in place.
   */
  private appendPoolDeposits(
    termIds: string[],
    curveIds: bigint[],
    assets: bigint[],
    totalDepositAmount: bigint,
    platformTermIds: string[]
  ): void {
    if (totalDepositAmount === 0n) return

    const ppEnabled = platformPoolService.isEnabled() && platformTermIds.length > 0
    const ppSplit = ppEnabled ? platformPoolService.calculateSplit(totalDepositAmount) : null

    if (!ppSplit) return

    const ppAmount = ppSplit.platformAmount
    const signalAmount = totalDepositAmount - ppAmount

    if (signalAmount <= 0n) {
      logger.warn("Pool deposits would consume entire deposit, skipping", {
        total: totalDepositAmount.toString(),
        pp: ppAmount.toString()
      })
      return
    }

    // Scale down ALL existing assets in one pass
    const originalCount = assets.length
    for (let i = 0; i < originalCount; i++) {
      assets[i] = (assets[i] * signalAmount) / totalDepositAmount
    }

    // Append PP entries (split equally per platform)
    const perPlatform = ppAmount / BigInt(platformTermIds.length)
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
   * to combine main deposit + platform pool deposit in a single TX.
   *
   * When the triple doesn't exist, creates it first, then does a separate
   * platform pool deposit (can't mix createTriples + depositBatch).
   *
   * @param depositCurveId - Curve for the creation deposit and later
   *   deposits. Default 2n (progressive, the page market); the social graph
   *   (follow / account trust) passes 1n.
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

        // Append platform pool entries if enabled (taken out of the stake)
        this.appendPoolDeposits(termIds, curveIds, assets, depositAmount, [])

        let hash: Hash

        if (termIds.length > 1) {
          // depositBatch: main + pools in 1 TX
          hash = await this.executeDepositBatch(address, termIds, curveIds, assets)
        } else {
          // Single deposit (no platform pool for this deposit)
          const totalDepositCost = await BlockchainService.getTotalDepositCost(depositAmount)

          const signer = await getSigner()
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
            account: signer.account
          })

          hash = await signer.writeContract({
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
            maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
            maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS
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
        const signer = await getSigner()
        const publicClient = getPublicClient()
        const contractAddress = BlockchainService.getContractAddress()

        const tripleCost = await BlockchainService.getTripleCost()
        const totalDeposit = customWeight !== undefined ? customWeight : MIN_TRIPLE_DEPOSIT

        const signalDeposit = totalDeposit

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
          totalCost: totalCost.toString()
        })

        // Simulate first
        await publicClient.simulateContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'createTriples',
          args: [address as Address, [subjectId as Address], [predicateId as Address], [objectId as Address], [signalDeposit], depositCurveId],
          value: totalCost,
          account: signer.account
        })

        const hash = await signer.writeContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'createTriples',
          args: [
            address as Address,
            [subjectId as Address],
            [predicateId as Address],
            [objectId as Address],
            [signalDeposit],
            depositCurveId
          ],
          value: totalCost,
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS
        })

        const receipt = await publicClient.waitForTransactionReceipt({ hash })

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
      // A page opposed and supported in the same batch is created once
      const baseKey = (t: ResolvedTriple) =>
        `${t.subjectId}-${t.predicateId}-${t.objectId}`
      const createKeys = new Set<string>()
      const opposeTriples: (ResolvedTriple & { tripleVaultId: string | null })[] = []

      for (let i = 0; i < resolvedTriples.length; i++) {
        const triple = resolvedTriples[i]
        const tripleKey = `${triple.subjectId}-${triple.predicateId}-${triple.objectId}-${triple.side ?? 'support'}`

        if (tripleKeysSet.has(tripleKey)) continue
        tripleKeysSet.add(tripleKey)

        const tripleCheck = await BlockchainService.checkTripleExists(
          triple.subjectId,
          triple.predicateId,
          triple.objectId
        )

        if (triple.side === 'oppose') {
          // Oppose: the claim must exist (created with the protocol minimum
          // on its support side), then the stake goes to its counter vault.
          opposeTriples.push({
            ...triple,
            tripleVaultId: tripleCheck.exists ? tripleCheck.tripleVaultId! : null
          })
          if (!tripleCheck.exists && !createKeys.has(baseKey(triple))) {
            createKeys.add(baseKey(triple))
            triplesToCreate.push({
              ...triple,
              customWeight: MIN_TRIPLE_DEPOSIT,
              index: i
            })
          }
        } else if (tripleCheck.exists) {
          triplesToDeposit.push({
            ...triple,
            tripleVaultId: tripleCheck.tripleVaultId!,
            tripleHash: tripleCheck.tripleHash
          })
        } else if (!createKeys.has(baseKey(triple))) {
          createKeys.add(baseKey(triple))
          triplesToCreate.push({ ...triple, index: i })
        }
      }

      // Batch create new triples
      if (triplesToCreate.length > 0) {
        const signer = await getSigner()
        const publicClient = getPublicClient()
        const contractAddress: Address = BlockchainService.getContractAddress() as Address
        const tripleCost = await BlockchainService.getTripleCost()

        const subjectIds = triplesToCreate.map(t => t.subjectId as Address)
        const predicateIds = triplesToCreate.map(t => t.predicateId as Address)
        const objectIds = triplesToCreate.map(t => t.objectId as Address)

        const originalAmounts = triplesToCreate.map(t =>
          t.customWeight !== undefined ? t.customWeight : MIN_TRIPLE_DEPOSIT
        )

        // Platform pool share is taken OUT of the stake: scale the signal
        // deposits down, the pool deposits go in a depositBatch after create.
        const totalOriginal = originalAmounts.reduce((sum, a) => sum + a, 0n)
        const createPlatformTermIds = this.resolveUniquePlatformTermIds(urls)
        const ppSplit = createPlatformTermIds.length > 0
          ? platformPoolService.calculateSplit(totalOriginal)
          : null

        const depositAmounts = ppSplit
          ? originalAmounts.map(a => (a * ppSplit.mainAmount) / totalOriginal)
          : originalAmounts

        const depositCount = depositAmounts.filter(a => a > 0n).length
        const totalDeposit = depositAmounts.reduce((sum, a) => sum + a, 0n)
        const multiVaultCost = (tripleCost * BigInt(triplesToCreate.length)) + totalDeposit
        const totalValue = await BlockchainService.getTotalCreationCost(depositCount, totalDeposit, multiVaultCost)

        const createArgs = [address as Address, subjectIds, predicateIds, objectIds, depositAmounts, CREATION_CURVE_ID] as const

        try {
          const simulation = await publicClient.simulateContract({
            address: contractAddress,
            abi: SofiaFeeProxyAbi,
            functionName: 'createTriples',
            args: createArgs,
            value: totalValue,
            account: signer.account
          })

          // Explicit gas limit so the wallet never falls back to the 2^50 block
          // limit on large batches (~417k gas/triple measured; fallback generous)
          const gas = await explicitGasLimit(
            publicClient,
            {
              address: contractAddress,
              abi: SofiaFeeProxyAbi,
              functionName: 'createTriples',
              args: createArgs,
              value: totalValue,
              account: signer.account
            },
            BigInt(triplesToCreate.length) * 1_000_000n + 1_000_000n
          )

          const hash = await signer.writeContract({
            address: contractAddress,
            abi: SofiaFeeProxyAbi,
            functionName: 'createTriples',
            args: createArgs,
            value: totalValue,
            gas,
            maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
            maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS
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

          // Platform pool deposits after creation (separate TX, non-blocking),
          // one per unique platform — the share already left the signal above
          const postCreateTermIds: string[] = []
          const postCreateCurveIds: bigint[] = []
          const postCreateAssets: bigint[] = []

          if (ppSplit) {
            const perPlatform = ppSplit.platformAmount / BigInt(createPlatformTermIds.length)
            for (const ptId of createPlatformTermIds) {
              postCreateTermIds.push(ptId)
              postCreateCurveIds.push(1n)
              postCreateAssets.push(perPlatform)
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
              logger.info('Post-create platform pool deposits succeeded', {
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
              fallbackCurveIds.push(MARKET_CURVE_ID)
              fallbackAssets.push(depositAmount)
            }

            // Append platform pool entries (taken out of the stake)
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
        const curveIds = triplesToDeposit.map(() => MARKET_CURVE_ID)
        const assets = triplesToDeposit.map(t =>
          t.customWeight !== undefined ? t.customWeight : MIN_TRIPLE_DEPOSIT
        )

        // Append platform pool entries (taken out of the stake)
        const totalDeposit = assets.reduce((sum, a) => sum + a, 0n)
        const depositPlatformTermIds = this.resolveUniquePlatformTermIds(urls)
        this.appendPoolDeposits(termIds, curveIds, assets, totalDeposit, depositPlatformTermIds)

        // Single depositBatch for all existing triple deposits + platform pool
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

      // Oppose positions — one depositBatch on the counter vaults
      if (opposeTriples.length > 0) {
        const publicClient = getPublicClient()
        const contractAddress: Address = BlockchainService.getContractAddress() as Address
        const counterIds: string[] = []
        for (const triple of opposeTriples) {
          const tripleId =
            triple.tripleVaultId ??
            results.find(
              r =>
                r.subjectVaultId === triple.subjectId &&
                r.predicateVaultId === triple.predicateId &&
                r.objectVaultId === triple.objectId
            )?.tripleVaultId
          if (!tripleId) throw new Error('Oppose: claim was not created')
          triple.tripleVaultId = tripleId
          counterIds.push(
            (await publicClient.readContract({
              address: contractAddress,
              abi: MultiVaultAbi,
              functionName: 'getCounterIdFromTripleId',
              args: [tripleId as Address],
              authorizationList: undefined
            })) as string
          )
        }
        const termIds = [...counterIds]
        const curveIds = opposeTriples.map(() => MARKET_CURVE_ID)
        const assets = opposeTriples.map(t =>
          t.customWeight !== undefined ? t.customWeight : MIN_TRIPLE_DEPOSIT
        )
        const totalDeposit = assets.reduce((sum, a) => sum + a, 0n)
        this.appendPoolDeposits(termIds, curveIds, assets, totalDeposit, this.resolveUniquePlatformTermIds(urls))

        const opposeHash = await this.executeDepositBatch(address, termIds, curveIds, assets)
        const opposeReceipt = await publicClient.waitForTransactionReceipt({ hash: opposeHash })
        if (opposeReceipt.status !== 'success') {
          throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${opposeReceipt.status}`)
        }
        opposeTriples.forEach((triple, i) => {
          results.push({
            success: true,
            tripleVaultId: triple.tripleVaultId!,
            counterVaultId: counterIds[i],
            side: 'oppose',
            txHash: opposeHash,
            subjectVaultId: triple.subjectId,
            predicateVaultId: triple.predicateId,
            objectVaultId: triple.objectId,
            source: 'deposit',
            tripleHash: triple.tripleVaultId!
          })
        })
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
