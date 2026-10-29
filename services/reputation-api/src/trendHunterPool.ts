// Trend Hunter monthly pool: the Top N of a month share a TRUST pot pro rata
// of their Flair. Sofia pays it by hand at the start of the next month, once
// the month is frozen and the ranking checked. Pure — tested in
// trendHunterPool.test.ts.

export interface PoolSettings {
  /** TRUST shared each month */
  trust: number
  /** Ranks that share it */
  size: number
}

/** TRUST each ranked wallet earns this month (2 decimals), keyed by wallet */
export function poolShares(
  ranked: readonly { wallet: string; flair: number; rank: number }[],
  pool: PoolSettings,
): Map<string, number> {
  const winners = ranked.filter((r) => r.rank <= pool.size && r.flair > 0)
  const total = winners.reduce((sum, r) => sum + r.flair, 0)
  const shares = new Map<string, number>()
  if (total <= 0 || pool.trust <= 0) return shares
  for (const r of winners) {
    // Rounded down: the sum never exceeds the pot
    shares.set(r.wallet, Math.floor((r.flair / total) * pool.trust * 100) / 100)
  }
  return shares
}
