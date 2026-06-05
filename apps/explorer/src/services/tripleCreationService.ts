/**
 * tripleCreationService — single source of truth for minting a new
 * `(subject | predicate | object)` triple from the explorer.
 *
 * Mirrors `depositService.executeSingleDeposit` but calls
 * `SofiaFeeProxy.createTriples`, which atomically:
 *   1. mints the triple (if subject/predicate/object atoms exist)
 *   2. deposits the caller's signal stake on the positive vault
 *
 * The triple's deterministic term_id is pre-computed via
 * `calculateTripleId` so callers can invalidate caches and route to
 * the new entity right after the receipt lands.
 */

import { createPublicClient, http } from 'viem'
import {
  INTUITION_RPC_URL,
  PROXY_ADDRESS,
  SofiaFeeProxyAbi,
  intuitionChain,
  explicitGasLimit,
} from '../lib/contracts'
import { buildWalletClient, type WalletDescriptor } from './depositService'

const CREATION_CURVE_ID = 1n

/** Minimum signal deposit accepted by SofiaFeeProxy.createTriples /
 *  deposit. Mirrors the extension's `MIN_DEPOSIT` constant
 *  (see `apps/extension/lib/services/QuestBadgeService.ts`).
 *  Anything below 0.01 TRUST reverts with
 *  `MultiVault_DepositBelowMinimumDeposit`. */
export const MIN_SIGNAL_TRUST = 0.01

const publicClient = createPublicClient({
  transport: http(INTUITION_RPC_URL),
})

export interface CreateTripleResult {
  success: boolean
  /** Deterministic term_id of the triple (newly created or pre-existing). */
  tripleTermId?: string
  txHash?: string
  /** True when the triple was already on-chain and we deposited on it
   *  instead of minting a new one. UI surfaces this as "you backed an
   *  existing claim" rather than "you created a claim". */
  alreadyExisted?: boolean
  error?: string
}

/** Read-only check for an existing triple via `getTriple`. Returns true
 *  if the triple lives on-chain (the contract's `getTriple` returns the
 *  three atom term_ids when it exists, or reverts/zero-tuple otherwise). */
async function tripleExistsOnChain(tripleId: string): Promise<boolean> {
  try {
    const result = (await publicClient.readContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'getTriple',
      args: [tripleId as `0x${string}`],
      authorizationList: undefined,
    })) as readonly [string, string, string]
    const [s, , o] = result
    // Zero-tuple = does not exist (contract sometimes returns it instead
    // of reverting). A real triple has non-zero subject + object.
    const ZERO =
      '0x0000000000000000000000000000000000000000000000000000000000000000'
    return s !== ZERO && o !== ZERO
  } catch {
    // Revert = does not exist
    return false
  }
}

/**
 * Mint `(subjectId | predicateId | objectId)` and deposit `signalTrust`
 * TRUST on the positive vault in a single transaction.
 *
 * Subject, predicate and object atoms must already exist on Intuition
 * — this function does NOT create atoms, only the triple wrapping them.
 */
export async function executeCreateTriple(
  wallet: WalletDescriptor,
  subjectId: string,
  predicateId: string,
  objectId: string,
  signalTrust: number,
): Promise<CreateTripleResult> {
  try {
    const { address, client } = await buildWalletClient(wallet)
    const signalDeposit = BigInt(Math.floor(signalTrust * 1e18))

    // Pre-compute the triple term_id so callers can route/cache before
    // the receipt lands.
    const tripleTermId = (await publicClient.readContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'calculateTripleId',
      args: [
        subjectId as `0x${string}`,
        predicateId as `0x${string}`,
        objectId as `0x${string}`,
      ],
      authorizationList: undefined,
    })) as `0x${string}`

    // Idempotent path — if the triple already exists on-chain (indexer
    // lag or prior session), `createTriples` would revert with
    // `MultiVault_TripleExists`. Deposit on the existing vault instead
    // so the user still ends up holding shares + flagged as a member.
    if (await tripleExistsOnChain(tripleTermId)) {
      const totalCost = (await publicClient.readContract({
        address: PROXY_ADDRESS,
        abi: SofiaFeeProxyAbi,
        functionName: 'getTotalDepositCost',
        args: [signalDeposit],
        authorizationList: undefined,
      })) as bigint
      const depositArgs = [
        address,
        tripleTermId,
        CREATION_CURVE_ID,
        0n,
      ] as const
      const simConfig = {
        address: PROXY_ADDRESS,
        abi: SofiaFeeProxyAbi,
        functionName: 'deposit',
        args: depositArgs,
        value: totalCost,
        account: address,
      } as const
      await publicClient.simulateContract(simConfig)
      const gas = await explicitGasLimit(publicClient, simConfig, 1_500_000n)
      const hash = await client.writeContract({
        ...simConfig,
        gas,
        chain: intuitionChain,
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      return receipt.status === 'success'
        ? { success: true, tripleTermId, txHash: hash, alreadyExisted: true }
        : { success: false, error: 'Transaction reverted', tripleTermId }
    }

    // Total cost = MultiVault creation cost (~0.1 TRUST) + signal deposit
    // + Sofia fees. We let the proxy compute the canonical total.
    const tripleCost = (await publicClient.readContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'getTripleCost',
      authorizationList: undefined,
    })) as bigint
    const multiVaultCost = tripleCost + signalDeposit
    const totalCost = (await publicClient.readContract({
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'getTotalCreationCost',
      args: [1n, signalDeposit, multiVaultCost],
      authorizationList: undefined,
    })) as bigint

    const args = [
      address,
      [subjectId as `0x${string}`],
      [predicateId as `0x${string}`],
      [objectId as `0x${string}`],
      [signalDeposit],
      CREATION_CURVE_ID,
    ] as const

    const simConfig = {
      address: PROXY_ADDRESS,
      abi: SofiaFeeProxyAbi,
      functionName: 'createTriples',
      args,
      value: totalCost,
      account: address,
    } as const

    await publicClient.simulateContract(simConfig)

    const gas = await explicitGasLimit(publicClient, simConfig, 2_000_000n)

    const hash = await client.writeContract({
      ...simConfig,
      gas,
      chain: intuitionChain,
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    return receipt.status === 'success'
      ? { success: true, tripleTermId, txHash: hash }
      : { success: false, error: 'Transaction reverted' }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Batch create-triples — used by the cart submit flow when the cart
 * holds one or more `kind: 'create-triple'` items (e.g. multiple group
 * Joins queued at once). All triples are minted in a single tx.
 *
 * Pre-existing triples in the batch are split off and replayed via
 * `executeSingleDeposit` afterwards, so the call is fully idempotent
 * even when a subset already lives on-chain.
 */
export interface BatchCreateTripleItem {
  subjectId: string
  predicateId: string
  objectId: string
  signalTrust: number
}

export async function executeCreateTriplesBatch(
  wallet: WalletDescriptor,
  items: BatchCreateTripleItem[],
): Promise<CreateTripleResult> {
  if (items.length === 0) return { success: false, error: 'No items' }

  try {
    const { address, client } = await buildWalletClient(wallet)

    // Pre-compute every triple_id and partition into "needs creation" vs
    // "already exists".
    const calculated: Array<{
      item: BatchCreateTripleItem
      tripleId: `0x${string}`
      exists: boolean
    }> = []
    for (const item of items) {
      const id = (await publicClient.readContract({
        address: PROXY_ADDRESS,
        abi: SofiaFeeProxyAbi,
        functionName: 'calculateTripleId',
        args: [
          item.subjectId as `0x${string}`,
          item.predicateId as `0x${string}`,
          item.objectId as `0x${string}`,
        ],
        authorizationList: undefined,
      })) as `0x${string}`
      calculated.push({
        item,
        tripleId: id,
        exists: await tripleExistsOnChain(id),
      })
    }

    const toCreate = calculated.filter((c) => !c.exists)
    const toDeposit = calculated.filter((c) => c.exists)

    let lastTxHash: string | undefined
    let alreadyExisted = false

    // Path 1 — mint the new triples in one batched tx.
    if (toCreate.length > 0) {
      const subjectIds = toCreate.map((c) => c.item.subjectId as `0x${string}`)
      const predicateIds = toCreate.map(
        (c) => c.item.predicateId as `0x${string}`,
      )
      const objectIds = toCreate.map((c) => c.item.objectId as `0x${string}`)
      const assets = toCreate.map((c) =>
        BigInt(Math.floor(c.item.signalTrust * 1e18)),
      )
      const totalDeposit = assets.reduce((a, b) => a + b, 0n)

      const tripleCost = (await publicClient.readContract({
        address: PROXY_ADDRESS,
        abi: SofiaFeeProxyAbi,
        functionName: 'getTripleCost',
        authorizationList: undefined,
      })) as bigint
      const multiVaultCost = tripleCost * BigInt(toCreate.length) + totalDeposit
      const totalCost = (await publicClient.readContract({
        address: PROXY_ADDRESS,
        abi: SofiaFeeProxyAbi,
        functionName: 'getTotalCreationCost',
        args: [BigInt(toCreate.length), totalDeposit, multiVaultCost],
        authorizationList: undefined,
      })) as bigint

      const args = [
        address,
        subjectIds,
        predicateIds,
        objectIds,
        assets,
        CREATION_CURVE_ID,
      ] as const

      const simConfig = {
        address: PROXY_ADDRESS,
        abi: SofiaFeeProxyAbi,
        functionName: 'createTriples',
        args,
        value: totalCost,
        account: address,
      } as const

      await publicClient.simulateContract(simConfig)

      const gas = await explicitGasLimit(
        publicClient,
        simConfig,
        BigInt(toCreate.length) * 1_000_000n + 1_000_000n,
      )

      const hash = await client.writeContract({
        ...simConfig,
        gas,
        chain: intuitionChain,
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== 'success')
        return {
          success: false,
          error: 'createTriples batch reverted',
        }
      lastTxHash = hash
    }

    // Path 2 — depositBatch on the triples that already exist.
    if (toDeposit.length > 0) {
      alreadyExisted = true
      const termIds = toDeposit.map((c) => c.tripleId)
      const curveIds = toDeposit.map(() => CREATION_CURVE_ID)
      const assets = toDeposit.map((c) =>
        BigInt(Math.floor(c.item.signalTrust * 1e18)),
      )
      const minShares = toDeposit.map(() => 0n)
      const totalDeposit = assets.reduce((a, b) => a + b, 0n)

      const fee = (await publicClient.readContract({
        address: PROXY_ADDRESS,
        abi: SofiaFeeProxyAbi,
        functionName: 'calculateDepositFee',
        args: [BigInt(toDeposit.length), totalDeposit],
        authorizationList: undefined,
      })) as bigint
      const totalValue = totalDeposit + fee

      const args = [address, termIds, curveIds, assets, minShares] as const

      const simConfig = {
        address: PROXY_ADDRESS,
        abi: SofiaFeeProxyAbi,
        functionName: 'depositBatch',
        args,
        value: totalValue,
        account: address,
      } as const

      await publicClient.simulateContract(simConfig)

      const gas = await explicitGasLimit(
        publicClient,
        simConfig,
        BigInt(toDeposit.length) * 600_000n + 1_000_000n,
      )

      const hash = await client.writeContract({
        ...simConfig,
        gas,
        chain: intuitionChain,
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== 'success')
        return {
          success: false,
          error: 'depositBatch on existing triples reverted',
        }
      lastTxHash = hash
    }

    return {
      success: true,
      txHash: lastTxHash,
      alreadyExisted,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
