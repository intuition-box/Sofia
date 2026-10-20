/**
 * Redeem Service
 * Direct MultiVault calls for redeeming atom positions (not via SofiaFeeProxy).
 * Adapted from extension/hooks/useRedeemTriple.ts
 */

import { createPublicClient, createWalletClient, custom, http } from 'viem'
import {
  intuitionChain,
  INTUITION_RPC_URL,
  MULTI_VAULT_ADDRESS,
  MultiVaultAbi,
  explicitGasLimit,
} from '../lib/contracts'
import type { WalletDescriptor } from './depositService'

const CURVE_ID = 1n
// Positions can sit on Linear (1n, explorer creations/deposits) OR Progressive
// (2n, the extension's regular deposits). A redeem must target the curve the
// shares actually live on — reading only 1n silently no-ops on a 2n position
// (looks like "tx validated" with no wallet popup). Scan both, newest first.
const REDEEM_CURVE_IDS = [1n, 2n] as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RedeemResult {
  success: boolean
  txHash?: string
  error?: string
  /** True when there was nothing to redeem (the wallet holds 0 shares on this
   *  vault) — no transaction was sent. Callers must not report this as a
   *  validated tx nor optimistically drop the item from any list. */
  noop?: boolean
}

// ---------------------------------------------------------------------------
// Shared public client (read-only)
// ---------------------------------------------------------------------------

const publicClient = createPublicClient({
  transport: http(INTUITION_RPC_URL),
})

// ---------------------------------------------------------------------------
// Read user shares for an atom (no wallet interaction)
// ---------------------------------------------------------------------------

export async function getShares(
  account: string,
  termId: string,
  curveId: bigint = CURVE_ID,
): Promise<bigint> {
  return (await publicClient.readContract({
    address: MULTI_VAULT_ADDRESS,
    abi: MultiVaultAbi,
    functionName: 'getShares',
    args: [account as `0x${string}`, termId as `0x${string}`, curveId],
    authorizationList: undefined,
  })) as bigint
}

/**
 * Every bonding curve on which `account` holds shares for `termId` (Linear
 * then Progressive). Empty when the account holds nothing on any curve.
 */
async function findFundedCurves(
  account: string,
  termId: string,
): Promise<{ curveId: bigint; shares: bigint }[]> {
  const balances = await Promise.all(
    REDEEM_CURVE_IDS.map(async (curveId) => ({
      curveId,
      shares: await getShares(account, termId, curveId),
    })),
  )
  return balances.filter((b) => b.shares > 0n)
}

/** Share of a position to exit, in percent of the shares held. */
export type RedeemPercent = 25 | 50 | 100

/** `shares × percent / 100`, exact (no rounding) for a full exit. */
export function sharesForPercent(
  shares: bigint,
  percent: RedeemPercent,
): bigint {
  if (percent >= 100) return shares
  return (shares * BigInt(percent)) / 100n
}

/**
 * Batch read shares for multiple atoms in parallel.
 */
export async function getSharesBatch(
  account: string,
  termIds: string[],
): Promise<Map<string, bigint>> {
  const results = await Promise.all(
    termIds.map(async (termId) => ({
      termId,
      shares: await getShares(account, termId),
    })),
  )
  return new Map(results.map((r) => [r.termId, r.shares]))
}

/**
 * Same as getSharesBatch but emits N requests at a time instead of N*total.
 * Use for large termId sets (e.g. 161 categories) to avoid saturating the RPC.
 */
export async function getSharesBatchChunked(
  account: string,
  termIds: string[],
  chunkSize = 25,
): Promise<Map<string, bigint>> {
  const out = new Map<string, bigint>()
  for (let i = 0; i < termIds.length; i += chunkSize) {
    const chunk = termIds.slice(i, i + chunkSize)
    const part = await getSharesBatch(account, chunk)
    for (const [k, v] of part) out.set(k, v)
  }
  return out
}

// ---------------------------------------------------------------------------
// Redeem a single atom position (all shares, or a percentage of them)
// ---------------------------------------------------------------------------

export async function redeemAtom(
  wallet: WalletDescriptor,
  termId: string,
  sharesToRedeem?: bigint,
  percent?: RedeemPercent,
): Promise<RedeemResult> {
  await wallet.switchChain(intuitionChain.id)
  const provider = await wallet.getEthereumProvider()
  const address = wallet.address as `0x${string}`

  // Locate the curves the shares actually live on (Linear and/or
  // Progressive). When an explicit amount is passed we trust the primary
  // curve. Without `percent` (legacy callers) we keep the historical
  // behaviour: all shares of the first funded curve. With `percent` (partial
  // exit flow) we exit that share of every funded curve.
  let legs: { curveId: bigint; shares: bigint }[]
  if (sharesToRedeem != null) {
    legs = [{ curveId: CURVE_ID, shares: sharesToRedeem }]
  } else if (percent == null) {
    legs = (await findFundedCurves(address, termId)).slice(0, 1)
  } else {
    legs = (await findFundedCurves(address, termId))
      .map((f) => ({
        curveId: f.curveId,
        shares: sharesForPercent(f.shares, percent),
      }))
      .filter((l) => l.shares > 0n)
  }
  if (legs.length === 0) {
    // Nothing on any curve — no tx to send. Flag as a no-op so callers don't
    // fake a "validated" success or drop the item from the UI.
    return { success: true, noop: true }
  }

  const walletClient = createWalletClient({
    account: address,
    chain: intuitionChain,
    transport: custom(provider),
  })

  // Position on both curves → one redeemBatch tx (same termId, one leg per
  // curve) so the whole position exits, not just the Linear side.
  if (legs.length > 1) {
    const batchConfig = {
      address: MULTI_VAULT_ADDRESS,
      abi: MultiVaultAbi,
      functionName: 'redeemBatch',
      args: [
        address,
        legs.map(() => termId as `0x${string}`),
        legs.map((l) => l.curveId),
        legs.map((l) => l.shares),
        legs.map(() => 0n),
      ],
      account: address,
    } as const
    await publicClient.simulateContract(batchConfig)
    const batchGas = await explicitGasLimit(
      publicClient,
      batchConfig,
      2_000_000n,
    )
    const batchHash = await walletClient.writeContract({
      ...batchConfig,
      gas: batchGas,
      chain: intuitionChain,
    })
    const batchReceipt = await publicClient.waitForTransactionReceipt({
      hash: batchHash,
    })
    return batchReceipt.status === 'success'
      ? { success: true, txHash: batchHash }
      : { success: false, error: 'Transaction reverted' }
  }

  const { curveId, shares } = legs[0]
  const args = [
    address,
    termId as `0x${string}`,
    curveId,
    shares,
    0n, // minAssets
  ] as const

  // Simulate first
  const simConfig = {
    address: MULTI_VAULT_ADDRESS,
    abi: MultiVaultAbi,
    functionName: 'redeem',
    args,
    account: address,
  } as const

  await publicClient.simulateContract(simConfig)

  const gas = await explicitGasLimit(publicClient, simConfig, 1_500_000n)

  const hash = await walletClient.writeContract({
    ...simConfig,
    gas,
    chain: intuitionChain,
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return receipt.status === 'success'
    ? { success: true, txHash: hash }
    : { success: false, error: 'Transaction reverted' }
}

// ---------------------------------------------------------------------------
// Batch redeem multiple atom positions
// ---------------------------------------------------------------------------

export async function redeemBatchAtoms(
  wallet: WalletDescriptor,
  termIds: string[],
): Promise<RedeemResult> {
  if (termIds.length === 0) return { success: true }

  await wallet.switchChain(intuitionChain.id)
  const provider = await wallet.getEthereumProvider()
  const address = wallet.address as `0x${string}`

  // Read all shares in parallel
  const sharesResults = await Promise.all(
    termIds.map(async (termId) => ({
      termId,
      shares: await getShares(address, termId),
    })),
  )
  const valid = sharesResults.filter((r) => r.shares > 0n)

  if (valid.length === 0) return { success: true }

  // Single atom → delegate
  if (valid.length === 1) {
    return redeemAtom(wallet, valid[0].termId, valid[0].shares)
  }

  const walletClient = createWalletClient({
    account: address,
    chain: intuitionChain,
    transport: custom(provider),
  })

  const args = [
    address,
    valid.map((r) => r.termId as `0x${string}`),
    valid.map(() => CURVE_ID),
    valid.map((r) => r.shares),
    valid.map(() => 0n),
  ] as const

  const simConfig = {
    address: MULTI_VAULT_ADDRESS,
    abi: MultiVaultAbi,
    functionName: 'redeemBatch',
    args,
    account: address,
  } as const

  await publicClient.simulateContract(simConfig)

  const gas = await explicitGasLimit(
    publicClient,
    simConfig,
    BigInt(valid.length) * 500_000n + 1_000_000n,
  )

  const hash = await walletClient.writeContract({
    ...simConfig,
    gas,
    chain: intuitionChain,
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return receipt.status === 'success'
    ? { success: true, txHash: hash }
    : { success: false, error: 'Transaction reverted' }
}

// ---------------------------------------------------------------------------
// Batch redeem across curves (legacy-position migration)
// ---------------------------------------------------------------------------

/** One vault × curve where the wallet holds shares */
export interface RedeemLeg {
  termId: string
  curveId: bigint
  shares: bigint
}

/** The wallet's funded legs on these vaults, both curves */
export async function findFundedLegs(
  account: string,
  termIds: readonly string[],
): Promise<RedeemLeg[]> {
  const unique = [...new Set(termIds)]
  const funded = await Promise.all(
    unique.map(async (termId) =>
      (await findFundedCurves(account, termId)).map((c) => ({
        termId,
        ...c,
      })),
    ),
  )
  return funded.flat()
}

/** Exit every leg in ONE transaction (redeem, or redeemBatch for several) */
export async function redeemLegs(
  wallet: WalletDescriptor,
  legs: readonly RedeemLeg[],
): Promise<RedeemResult> {
  if (legs.length === 0) return { success: true, noop: true }

  await wallet.switchChain(intuitionChain.id)
  const provider = await wallet.getEthereumProvider()
  const address = wallet.address as `0x${string}`
  const walletClient = createWalletClient({
    account: address,
    chain: intuitionChain,
    transport: custom(provider),
  })

  const args = [
    address,
    legs.map((l) => l.termId as `0x${string}`),
    legs.map((l) => l.curveId),
    legs.map((l) => l.shares),
    legs.map(() => 0n),
  ] as const
  const simConfig = {
    address: MULTI_VAULT_ADDRESS,
    abi: MultiVaultAbi,
    functionName: 'redeemBatch',
    args,
    account: address,
  } as const

  await publicClient.simulateContract(simConfig)
  const gas = await explicitGasLimit(
    publicClient,
    simConfig,
    BigInt(legs.length) * 500_000n + 1_000_000n,
  )
  const hash = await walletClient.writeContract({
    ...simConfig,
    gas,
    chain: intuitionChain,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return receipt.status === 'success'
    ? { success: true, txHash: hash }
    : { success: false, error: 'Transaction reverted' }
}
