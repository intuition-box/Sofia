/**
 * explicitGasLimit — compute a finite, explicit gas limit for a contract write.
 *
 * Intuition mainnet advertises a pathological block gas limit (~2^50). When a
 * wallet can't estimate a tx's gas — large batches (`createTriples`,
 * `createAtoms`, `depositBatch`) make MetaMask's own estimate time out — it
 * falls back to that block limit as the tx gas limit, so the displayed max fee
 * becomes ~block_limit × gasPrice ≈ thousands of TRUST and the wallet wrongly
 * reports "insufficient funds" even though the tx costs a fraction of a TRUST.
 *
 * Passing an explicit, finite gas limit ourselves stops the wallet from ever
 * falling back, so any batch size goes through in a single tx. We estimate
 * against our own RPC (+30% headroom) and fall back to a generous per-item
 * heuristic if even that estimate fails. Over-estimating the *limit* is
 * harmless — the sender only pays for gas actually used.
 */
import type { PublicClient } from 'viem'

/**
 * `config` is the same object handed to `simulateContract` at each call site
 * (address/abi/functionName/args/value/account), so it is already type-checked
 * there; we type it loosely here only to dodge viem's deep generic inference.
 */
export async function explicitGasLimit(
  publicClient: PublicClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any,
  fallback: bigint,
): Promise<bigint> {
  try {
    const estimate = await publicClient.estimateContractGas(config)
    return (estimate * 130n) / 100n
  } catch {
    return fallback
  }
}
