/**
 * Redeem Service
 * Direct MultiVault calls for redeeming atom positions (not via SofiaFeeProxy).
 * Adapted from extension/hooks/useRedeemTriple.ts
 */

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
} from 'viem'
import { intuitionChain, INTUITION_RPC_URL, MULTI_VAULT_ADDRESS, MultiVaultAbi } from '../lib/contracts'
import type { WalletDescriptor } from './depositService'

const CURVE_ID = 1n

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RedeemResult {
  success: boolean
  txHash?: string
  error?: string
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
): Promise<bigint> {
  return await publicClient.readContract({
    address: MULTI_VAULT_ADDRESS,
    abi: MultiVaultAbi,
    functionName: 'getShares',
    args: [account as `0x${string}`, termId as `0x${string}`, CURVE_ID],
  }) as bigint
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

  // Read current shares if not provided
  const shares = sharesToRedeem ?? await getShares(address, termId)

  if (shares === 0n) {
    return { success: true } // nothing to redeem
  }

  const walletClient = createWalletClient({
    account: address,
    chain: intuitionChain,
    transport: custom(provider),
  })

  const args = [
    address,
    termId as `0x${string}`,
    CURVE_ID,
    shares,
    0n, // minAssets
  ] as const

  // Simulate first
  await publicClient.simulateContract({
    address: MULTI_VAULT_ADDRESS,
    abi: MultiVaultAbi,
    functionName: 'redeem',
    args,
    account: address,
  })

  const hash = await walletClient.writeContract({
    address: MULTI_VAULT_ADDRESS,
    abi: MultiVaultAbi,
    functionName: 'redeem',
    args,
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

  await publicClient.simulateContract({
    address: MULTI_VAULT_ADDRESS,
    abi: MultiVaultAbi,
    functionName: 'redeemBatch',
    args,
    account: address,
  })

  const hash = await walletClient.writeContract({
    address: MULTI_VAULT_ADDRESS,
    abi: MultiVaultAbi,
    functionName: 'redeemBatch',
    args,
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return receipt.status === 'success'
    ? { success: true, txHash: hash }
    : { success: false, error: 'Transaction reverted' }
}
