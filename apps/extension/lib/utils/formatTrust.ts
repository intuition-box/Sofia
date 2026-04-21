import { formatUnits } from "viem"

/**
 * Format a raw BigInt shares string (18 decimals) into a human-readable TRUST amount.
 * - >= 1000 → "1.2K"
 * - >= 1    → "1.00"
 * - < 1     → "0.0001"
 */
export function formatTrust(shares: string): string {
  try {
    const val = parseFloat(formatUnits(BigInt(shares || "0"), 18))
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`
    if (val >= 1) return val.toFixed(2)
    return val.toFixed(4)
  } catch {
    return "0"
  }
}
