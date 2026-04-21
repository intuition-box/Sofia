/**
 * Calculate support vs oppose percentage from raw market cap strings (BigInt).
 * Returns 50/50 when both are zero.
 */
export function calcPercentage(
  supportMarketCap: string,
  opposeMarketCap: string
): { supportPct: number; opposePct: number } {
  try {
    const s = BigInt(supportMarketCap || "0")
    const o = BigInt(opposeMarketCap || "0")
    const total = s + o
    if (total === 0n) return { supportPct: 50, opposePct: 50 }
    const pct = Number((s * 100n) / total)
    return { supportPct: pct, opposePct: 100 - pct }
  } catch {
    return { supportPct: 50, opposePct: 50 }
  }
}
