import { getClients, getPublicClient } from '../clients/viemClients'
import { MultiVaultAbi } from '../../ABI/MultiVault'
import { SofiaFeeProxyAbi } from '../../ABI/SofiaFeeProxy'
import { stringToHex } from 'viem'
import type { Abi } from 'viem'
import type { AtomCheckResult, TripleCheckResult, FeeParams, ProtocolCosts } from '../../types/blockchain'

// viem's ABI-typed APIs rely on TypeScript reading the literal string
// `type: "function"` (not the widened `type: string`) on every ABI entry.
// They use that literal to derive the union of valid `functionName` values
// and the argument tuple types — i.e. the part that gives you autocomplete
// and `args: [...]` checking. With a literal, an Abi entry matches
// `AbiFunction`; without it, the entry matches none of the AbiX shapes and
// the whole array stops being assignable to viem's `Abi`.
//
// `MultiVaultAbi` is exported as a plain array (no `as const`), so each
// entry's `type` is inferred as the wider `string`. `readContract`
// historically accepts this because its generic resolves to a permissive
// shape; `multicall` does not — it requires `Abi` strictly, so the same
// untouched ABI fails to typecheck inside `contracts: [...]` even though
// the runtime behaviour is identical.
//
// Two ways to fix it: (a) add `as const` to the ABI source, which would
// tighten every consumer site (risk of cascading errors), or (b) cast
// once locally to `Abi`. We do (b). The cast is safe: viem validates the
// resolved function exists at runtime via the ABI bytes, the TS layer is
// purely for ergonomics.
const MultiVaultAbiTyped = MultiVaultAbi as Abi
import { MULTIVAULT_CONTRACT_ADDRESS, SOFIA_PROXY_ADDRESS, SELECTED_CHAIN } from '../config/chainConfig'
import { createServiceLogger } from '../utils/logger'

const logger = createServiceLogger('BlockchainService')

/**
 * Slippage tolerance applied to every deposit/redeem (1% = 100 bps).
 *
 * Bonding-curve mints are MEV-vulnerable: a sandwich attack pushes the curve
 * forward and the user receives near-zero shares for the same TRUST. We pass
 * a non-zero `minShares` derived from `previewDeposit() * (1 - SLIPPAGE_BPS)`,
 * so an attacker that moves the curve more than 1% causes the deposit to
 * revert instead of silently extracting value.
 */
export const SLIPPAGE_BPS = 100n // 1%
const BPS_DENOMINATOR = 10000n

/**
 * Subtract `bps` basis points from `amount`. Used to derive a slippage-aware
 * lower bound for `minShares` / `minAssets`.
 */
export function applySlippage(amount: bigint, bps: bigint = SLIPPAGE_BPS): bigint {
  return amount - (amount * bps) / BPS_DENOMINATOR
}

/**
 * Centralized service for blockchain operations
 *
 * All write operations go through the Sofia Fee Proxy which:
 * - Collects fees (0.1 TRUST fixed per deposit + 5% of deposit amount)
 * - Forwards transactions to the MultiVault
 * - Has the same function signatures as MultiVault
 */
export class BlockchainService {
  private static readonly MULTIVAULT_ADDRESS = MULTIVAULT_CONTRACT_ADDRESS
  private static readonly PROXY_ADDRESS = SOFIA_PROXY_ADDRESS
  private static feeCache: FeeParams | null = null
  private static protocolCostsCache: ProtocolCosts | null = null

  /**
   * Read previewDeposit on the MultiVault and return the slippage-adjusted
   * minimum shares the user should accept for this deposit.
   *
   * `assets` is the amount that reaches the MultiVault after the proxy fees
   * are deducted — i.e. the user-facing nominal stake (e.g. INTENTION_MIN_STAKE).
   */
  static async previewDepositMinShares(
    termId: string,
    curveId: bigint,
    assets: bigint,
    bps: bigint = SLIPPAGE_BPS
  ): Promise<bigint> {
    const publicClient = getPublicClient()
    const [shares] = (await publicClient.readContract({
      address: this.MULTIVAULT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'previewDeposit',
      args: [termId as `0x${string}`, curveId, assets],
      authorizationList: undefined
    })) as [bigint, bigint]
    return applySlippage(shares, bps)
  }

  /**
   * Batch-version using Multicall3. Returns minShares aligned with the input
   * arrays. Falls back to parallel reads if multicall3 is unavailable.
   */
  static async previewDepositMinSharesBatch(
    termIds: readonly string[],
    curveIds: readonly bigint[],
    assets: readonly bigint[],
    bps: bigint = SLIPPAGE_BPS
  ): Promise<bigint[]> {
    if (termIds.length === 0) return []
    const publicClient = getPublicClient()
    try {
      const responses = await publicClient.multicall({
        contracts: termIds.map((termId, i) => ({
          address: this.MULTIVAULT_ADDRESS as `0x${string}`,
          abi: MultiVaultAbiTyped,
          functionName: 'previewDeposit',
          args: [termId as `0x${string}`, curveIds[i], assets[i]]
        })),
        allowFailure: false,
        // viem 2.x MulticallParameters intersects with Pick<CallParameters,
        // "authorizationList" | ...> which lists this as required (EIP-7702
        // opt-in). Pass undefined to opt out cleanly.
        authorizationList: undefined
      })
      return responses.map((r) => applySlippage((r as readonly bigint[])[0], bps))
    } catch (err) {
      logger.warn('Multicall previewDeposit failed, falling back to parallel reads', { error: err })
      return Promise.all(
        termIds.map((termId, i) =>
          this.previewDepositMinShares(termId, curveIds[i], assets[i], bps)
        )
      )
    }
  }

  /**
   * Read previewRedeem on the MultiVault and return the slippage-adjusted
   * minimum assets the user should accept when burning `shares`.
   */
  static async previewRedeemMinAssets(
    termId: string,
    curveId: bigint,
    shares: bigint,
    bps: bigint = SLIPPAGE_BPS
  ): Promise<bigint> {
    const publicClient = getPublicClient()
    const [assets] = (await publicClient.readContract({
      address: this.MULTIVAULT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'previewRedeem',
      args: [termId as `0x${string}`, curveId, shares],
      authorizationList: undefined
    })) as [bigint, bigint]
    return applySlippage(assets, bps)
  }

  /**
   * Batch-version using Multicall3. Returns minAssets aligned with the input
   * arrays. Falls back to parallel reads if multicall3 is unavailable.
   */
  static async previewRedeemMinAssetsBatch(
    termIds: readonly string[],
    curveIds: readonly bigint[],
    shares: readonly bigint[],
    bps: bigint = SLIPPAGE_BPS
  ): Promise<bigint[]> {
    if (termIds.length === 0) return []
    const publicClient = getPublicClient()
    try {
      const responses = await publicClient.multicall({
        contracts: termIds.map((termId, i) => ({
          address: this.MULTIVAULT_ADDRESS as `0x${string}`,
          abi: MultiVaultAbiTyped,
          functionName: 'previewRedeem',
          args: [termId as `0x${string}`, curveIds[i], shares[i]]
        })),
        allowFailure: false,
        authorizationList: undefined
      })
      return responses.map((r) => applySlippage((r as readonly bigint[])[0], bps))
    } catch (err) {
      logger.warn('Multicall previewRedeem failed, falling back to parallel reads', { error: err })
      return Promise.all(
        termIds.map((termId, i) =>
          this.previewRedeemMinAssets(termId, curveIds[i], shares[i], bps)
        )
      )
    }
  }

  /**
   * Calculate Sofia fee for deposits
   * @param depositCount Number of non-zero deposits
   * @param totalDeposit Total amount being deposited
   */
  static async calculateDepositFee(depositCount: number, totalDeposit: bigint): Promise<bigint> {
    const publicClient = getPublicClient()
    return await publicClient.readContract({
      address: this.PROXY_ADDRESS as `0x${string}`,
      abi: SofiaFeeProxyAbi,
      functionName: 'calculateDepositFee',
      args: [BigInt(depositCount), totalDeposit],
      authorizationList: undefined
    }) as bigint
  }

  /**
   * Get total cost for a single deposit including Sofia fees
   */
  static async getTotalDepositCost(depositAmount: bigint): Promise<bigint> {
    const publicClient = getPublicClient()
    return await publicClient.readContract({
      address: this.PROXY_ADDRESS as `0x${string}`,
      abi: SofiaFeeProxyAbi,
      functionName: 'getTotalDepositCost',
      args: [depositAmount],
      authorizationList: undefined
    }) as bigint
  }

  /**
   * Get total cost for createAtoms/createTriples including Sofia fees
   * @param depositCount Number of non-zero deposits
   * @param totalDeposit Sum of all deposit amounts
   * @param multiVaultCost Total cost required by MultiVault (atomCost/tripleCost * count + totalDeposit)
   */
  static async getTotalCreationCost(depositCount: number, totalDeposit: bigint, multiVaultCost: bigint): Promise<bigint> {
    const publicClient = getPublicClient()
    return await publicClient.readContract({
      address: this.PROXY_ADDRESS as `0x${string}`,
      abi: SofiaFeeProxyAbi,
      functionName: 'getTotalCreationCost',
      args: [BigInt(depositCount), totalDeposit, multiVaultCost],
      authorizationList: undefined
    }) as bigint
  }

  /**
   * Read fee parameters from SofiaFeeProxy contract.
   * Cached in memory — call clearFeeCache() after admin fee changes.
   */
  static async getFeeParams(): Promise<FeeParams> {
    if (this.feeCache) return this.feeCache

    const publicClient = getPublicClient()
    const addr = this.PROXY_ADDRESS as `0x${string}`

    const [depositFixed, depositPct, feeDenom] = await Promise.all([
      publicClient.readContract({ address: addr, abi: SofiaFeeProxyAbi, functionName: 'depositFixedFee', authorizationList: undefined }) as Promise<bigint>,
      publicClient.readContract({ address: addr, abi: SofiaFeeProxyAbi, functionName: 'depositPercentageFee', authorizationList: undefined }) as Promise<bigint>,
      publicClient.readContract({ address: addr, abi: SofiaFeeProxyAbi, functionName: 'FEE_DENOMINATOR', authorizationList: undefined }) as Promise<bigint>
    ])

    // creationFixedFee may not exist on older contract deployments
    let creationFixed = 0n
    try {
      creationFixed = await publicClient.readContract({ address: addr, abi: SofiaFeeProxyAbi, functionName: 'creationFixedFee', authorizationList: undefined }) as bigint
    } catch {
      logger.debug('creationFixedFee not available on contract, defaulting to 0')
    }

    this.feeCache = { depositFixed, depositPct, creationFixed, feeDenom }

    logger.debug('Fee params loaded', {
      depositFixed: Number(depositFixed) / 1e18,
      depositPct: Number(depositPct),
      creationFixed: Number(creationFixed) / 1e18,
      feeDenom: Number(feeDenom)
    })

    return this.feeCache
  }

  static clearFeeCache() {
    this.feeCache = null
    this.protocolCostsCache = null
  }

  /**
   * Read full creation costs from MultiVault getAtomCost/getTripleCost.
   * These are the mandatory amounts required by the contract on CREATE path.
   * Includes protocol fee + initial vault deposits (both leave the user's wallet).
   * Cached in memory alongside fee params.
   */
  static async getProtocolCosts(): Promise<ProtocolCosts> {
    if (this.protocolCostsCache) return this.protocolCostsCache

    const [atomCost, tripleCost] = await Promise.all([
      this.getAtomCost(),
      this.getTripleCost()
    ])

    this.protocolCostsCache = { atomCost, tripleCost }

    logger.debug('Protocol costs loaded', {
      atomCost: Number(atomCost) / 1e18,
      tripleCost: Number(tripleCost) / 1e18
    })

    return this.protocolCostsCache
  }

  /**
   * Calculate atom ID using the contract's calculateAtomId function
   * This ensures the ID matches exactly what the contract uses
   */
  static async calculateAtomId(ipfsUri: string): Promise<string> {
    const publicClient = getPublicClient()
    const encodedData = stringToHex(ipfsUri)

    return await publicClient.readContract({
      address: this.MULTIVAULT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'calculateAtomId',
      args: [encodedData],
      authorizationList: undefined
    }) as string
  }

  /**
   * Check if atom exists on-chain
   */
  static async checkAtomExists(ipfsUri: string): Promise<AtomCheckResult> {
    const publicClient = getPublicClient()
    const atomHash = await this.calculateAtomId(ipfsUri)

    const exists = await publicClient.readContract({
      address: this.MULTIVAULT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'isTermCreated',
      args: [atomHash as `0x${string}`],
      authorizationList: undefined
    }) as boolean

    return {
      exists,
      atomHash
    }
  }

  /**
   * Check if triple exists on-chain
   */
  static async checkTripleExists(
    subjectVaultId: string,
    predicateVaultId: string,
    objectVaultId: string
  ): Promise<TripleCheckResult> {
    logger.debug('checkTripleExists - Starting check', {
      subjectVaultId,
      predicateVaultId,
      objectVaultId,
      contractAddress: this.MULTIVAULT_ADDRESS
    })

    const publicClient = getPublicClient()

    try {
      logger.debug('checkTripleExists - Calculating triple ID')

      // Calculate the triple ID
      const tripleId = await publicClient.readContract({
        address: this.MULTIVAULT_ADDRESS as `0x${string}`,
        abi: MultiVaultAbi,
        functionName: 'calculateTripleId',
        args: [
          subjectVaultId as `0x${string}`,
          predicateVaultId as `0x${string}`,
          objectVaultId as `0x${string}`
        ],
        authorizationList: undefined
      }) as `0x${string}`

      logger.debug('checkTripleExists - Triple ID calculated', { tripleId })

      // Check if triple exists using getTriple
      try {
        logger.debug('checkTripleExists - Calling getTriple')

        const tripleData = await publicClient.readContract({
          address: this.MULTIVAULT_ADDRESS as `0x${string}`,
          abi: MultiVaultAbi,
          functionName: 'getTriple',
          args: [tripleId],
          authorizationList: undefined
        }) as [string, string, string] // [subjectId, predicateId, objectId]

        logger.debug('checkTripleExists - Triple data retrieved', {
          tripleId,
          tripleData,
          expectedSubject: subjectVaultId,
          expectedPredicate: predicateVaultId,
          expectedObject: objectVaultId
        })

        // IMPORTANT: Validate that the retrieved triple data matches exactly what we're looking for
        // This prevents hash collision false positives
        const [retrievedSubject, retrievedPredicate, retrievedObject] = tripleData
        
        const exactMatch = 
          retrievedSubject.toLowerCase() === subjectVaultId.toLowerCase() &&
          retrievedPredicate.toLowerCase() === predicateVaultId.toLowerCase() &&
          retrievedObject.toLowerCase() === objectVaultId.toLowerCase()

        if (exactMatch) {
          logger.info('checkTripleExists - Exact triple match found', {
            tripleId,
            retrievedData: tripleData
          })

          return {
            exists: true,
            tripleVaultId: tripleId,
            tripleHash: tripleId
          }
        } else {
          logger.warn('checkTripleExists - Hash collision detected', {
            tripleId,
            expected: [subjectVaultId, predicateVaultId, objectVaultId],
            retrieved: tripleData,
            message: 'TripleId exists but with different vaultIds - treating as non-existent'
          })

          return {
            exists: false,
            tripleHash: tripleId
          }
        }
      } catch (getTripleError) {
        logger.debug('checkTripleExists - getTriple failed (triple does not exist)', {
          tripleId,
          errorMessage: getTripleError instanceof Error ? getTripleError.message : 'Unknown error',
          errorSignature: getTripleError instanceof Object && 'signature' in getTripleError ? (getTripleError as { signature: string }).signature : 'no signature'
        })

        // getTriple reverts if triple doesn't exist
        return {
          exists: false,
          tripleHash: tripleId
        }
      }
    } catch (contractError) {
      logger.error('checkTripleExists - Contract error', {
        errorMessage: contractError instanceof Error ? contractError.message : 'Unknown error'
      })

      // Return false if we can't check - let the contract handle duplicates
      return {
        exists: false,
        tripleHash: ''
      }
    }
  }

  /**
   * Batch-verify that a list of triple term IDs exist on-chain.
   * Uses Multicall3 to issue a single RPC roundtrip for N reads.
   *
   * @returns Map of termId → exists. Missing/invalid IDs map to false.
   */
  static async checkTriplesExistByTermIds(
    termIds: string[]
  ): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>()
    if (termIds.length === 0) return result

    const publicClient = getPublicClient()

    try {
      const responses = await publicClient.multicall({
        contracts: termIds.map(termId => ({
          address: this.MULTIVAULT_ADDRESS as `0x${string}`,
          abi: MultiVaultAbiTyped,
          functionName: 'getTriple',
          args: [termId as `0x${string}`]
        })),
        allowFailure: true,
        authorizationList: undefined
      })

      termIds.forEach((termId, i) => {
        // getTriple reverts when the triple doesn't exist → status: 'failure'.
        result.set(termId, responses[i]?.status === 'success')
      })
      return result
    } catch (err) {
      // Fallback: parallel individual reads (e.g., if multicall3 isn't deployed
      // on the active chain). Slower but functional.
      logger.warn('Multicall failed, falling back to parallel getTriple', { error: err })
      const checks = await Promise.all(
        termIds.map(async termId => {
          try {
            await publicClient.readContract({
              address: this.MULTIVAULT_ADDRESS as `0x${string}`,
              abi: MultiVaultAbi,
              functionName: 'getTriple',
              args: [termId as `0x${string}`],
              authorizationList: undefined
            })
            return [termId, true] as const
          } catch {
            return [termId, false] as const
          }
        })
      )
      for (const [termId, exists] of checks) result.set(termId, exists)
      return result
    }
  }

  /**
   * Get user's shares in a triple vault
   * Returns > 0n if the user has deposited into this triple
   */
  static async getUserSharesInTriple(
    userAddress: string,
    tripleTermId: string
  ): Promise<bigint> {
    const { getPublicClient } = await import('../clients/viemClients')
    const publicClient = getPublicClient()

    return await publicClient.readContract({
      address: this.MULTIVAULT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'getShares',
      args: [
        userAddress as `0x${string}`,
        tripleTermId as `0x${string}`,
        1n // curveId = 1 for triples
      ],
      authorizationList: undefined
    }) as bigint
  }

  /**
   * Get user's shares in an atom vault
   * Returns > 0n if the user has deposited into this atom
   */
  static async getUserSharesInAtom(
    userAddress: string,
    atomTermId: string
  ): Promise<bigint> {
    const { getPublicClient } = await import('../clients/viemClients')
    const publicClient = getPublicClient()

    return await publicClient.readContract({
      address: this.MULTIVAULT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'getShares',
      args: [
        userAddress as `0x${string}`,
        atomTermId as `0x${string}`,
        1n // curveId = 1 for atom vaults
      ],
      authorizationList: undefined
    }) as bigint
  }

  /**
   * Get atom cost from contract (reads from MultiVault)
   */
  static async getAtomCost(): Promise<bigint> {
    const { getPublicClient } = await import('../clients/viemClients')
    const publicClient = getPublicClient()

    return await publicClient.readContract({
      address: this.MULTIVAULT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'getAtomCost',
      authorizationList: undefined
    }) as bigint
  }

  /**
   * Get triple cost from contract (reads from MultiVault)
   */
  static async getTripleCost(): Promise<bigint> {
    const { getPublicClient } = await import('../clients/viemClients')
    const publicClient = getPublicClient()

    const cost = await publicClient.readContract({
      address: this.MULTIVAULT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'getTripleCost',
      authorizationList: undefined
    }) as bigint

    logger.debug('getTripleCost returned', {
      cost: cost.toString(),
      costInTRUST: Number(cost) / 1e18,
      contractAddress: this.MULTIVAULT_ADDRESS
    })

    return cost
  }

  /**
   * Get contract address
   */
  static getContractAddress(): `0x${string}` {
    return this.PROXY_ADDRESS as `0x${string}`
  }

  /**
   * Get the direct MultiVault address (for redeem operations)
   */
  static getMultiVaultAddress(): `0x${string}` {
    return this.MULTIVAULT_ADDRESS as `0x${string}`
  }

  /**
   * Get the proxy address
   */
  static getProxyAddress(): `0x${string}` {
    return this.PROXY_ADDRESS as `0x${string}`
  }

  // ============ Approval Functions ============

  /**
   * ApprovalTypes enum values matching MultiVault contract
   */
  static readonly ApprovalTypes = {
    NONE: 0,      // No approval
    DEPOSIT: 1,   // Can deposit on behalf
    REDEMPTION: 2, // Can redeem on behalf
    BOTH: 3       // Can deposit and redeem
  } as const

  /**
   * Request user to approve proxy for deposits on MultiVault
   * @returns Transaction hash
   */
  static async requestProxyApproval(): Promise<`0x${string}`> {
    const { walletClient } = await getClients()
    const [address] = await walletClient.getAddresses()

    const hash = await walletClient.writeContract({
      chain: SELECTED_CHAIN,
      account: address,
      address: this.MULTIVAULT_ADDRESS as `0x${string}`,
      abi: MultiVaultAbi,
      functionName: 'approve',
      args: [this.PROXY_ADDRESS as `0x${string}`, this.ApprovalTypes.DEPOSIT]
    })

    return hash
  }

  /**
   * Wait for approval transaction and verify it succeeded
   */
  static async waitForApprovalConfirmation(txHash: `0x${string}`): Promise<boolean> {
    const publicClient = getPublicClient()

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash
    })

    return receipt.status === 'success'
  }
}