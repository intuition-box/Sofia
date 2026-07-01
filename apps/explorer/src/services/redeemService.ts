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
 * Find the bonding curve on which `account` actually holds shares for `termId`.
 * Returns the first curve (Linear then Progressive) with a non-zero balance, or
 * null when the account holds nothing on any curve.
 */
async function findFundedCurve(
  account: string,
  termId: string,
): Promise<{ curveId: bigint; shares: bigint } | null> {
  for (const curveId of REDEEM_CURVE_IDS) {
    const shares = await getShares(account, termId, curveId)
    if (shares > 0n) return { curveId, shares }
  }
  return null
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
// Redeem a single atom position (all shares)
// ---------------------------------------------------------------------------

export async function redeemAtom(
  wallet: WalletDescriptor,
  termId: string,
  sharesToRedeem?: bigint,
): Promise<RedeemResult> {
  await wallet.switchChain(intuitionChain.id)
  const provider = await wallet.getEthereumProvider()
  const address = wallet.address as `0x${string}`

  // Locate the curve the shares actually live on (Linear or Progressive). When
  // an explicit amount is passed we trust the primary curve; otherwise scan.
  let curveId = CURVE_ID
  let shares: bigint
  if (sharesToRedeem != null) {
    shares = sharesToRedeem
  } else {
    const funded = await findFundedCurve(address, termId)
    if (!funded) {
      // Nothing on any curve — no tx to send. Flag as a no-op so callers don't
      // fake a "validated" success or drop the item from the UI.
      return { success: true, noop: true }
    }
    curveId = funded.curveId
    shares = funded.shares
  }

  const walletClient = createWalletClient({
    account: address,
    chain: intuitionChain,
    transport: custom(provider),
  })

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
