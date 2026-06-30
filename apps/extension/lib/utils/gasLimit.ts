/**
 * explicitGasLimit — compute a finite, explicit gas limit for a contract write.
 *
 * Intuition mainnet advertises a pathological block gas limit (~2^50). When a
 * wallet can't estimate a tx's gas — large batches (`createTriples`,
 * `createAtoms`, `depositBatch`) make the wallet's own estimate fail — it falls
 * back to that block limit as the tx gas limit, so the displayed max fee becomes
 * ~block_limit × gasPrice ≈ thousands of TRUST and the wallet wrongly reports
 * "insufficient funds" even though the tx costs a fraction of a TRUST.
 *
 * Passing an explicit, finite gas limit ourselves stops the wallet from ever
 * falling back, so any batch size (up to MAX_BATCH_SIZE = 150) goes through in a
 * single tx. We estimate against our own RPC (+30% headroom) and fall back to a
 * generous per-item heuristic if even that estimate fails. Over-estimating the
 * *limit* is harmless — the sender only pays for gas actually used.
 *
 * Measured gas (mainnet, 2026-06): createAtoms ~146k/item, createTriples
 * ~417k/item, so the per-item fallbacks below are deliberately generous.
 */
export async function explicitGasLimit(
  publicClient: {
    estimateContractGas: (config: any) => Promise<bigint>
  },
  config: any,
  fallback: bigint
): Promise<bigint> {
  try {
    const estimate = await publicClient.estimateContractGas(config)
    return (estimate * 130n) / 100n
  } catch {
    return fallback
  }
}
