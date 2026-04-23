import { useGetTripleVaultStatsQuery } from '@0xsofia/graphql'

export interface VaultStats {
  supportMarketCap: string
  opposeMarketCap: string
  supportCount: number
  opposeCount: number
  userPnlPct: number | null
}

interface SideResult {
  marketCap: string
  count: number
  userPnlPct: number | null
}

export function extractSide(vaults: any[] | undefined, decimals = 18n): SideResult {
  let totalMarketCap = 0n
  let totalCount = 0
  let userShares = 0n
  let userCostBasis = 0n
  let weightedSharePrice = 0n

  for (const v of vaults ?? []) {
    totalMarketCap += BigInt(v.market_cap || '0')
    totalCount += v.position_count || 0
    const sharePrice = BigInt(v.current_share_price || '0')
    for (const p of v.positions ?? []) {
      if (p.shares && BigInt(p.shares) > 0n) {
        const s = BigInt(p.shares)
        userShares += s
        userCostBasis += BigInt(p.total_deposit_assets_after_total_fees || '0')
        weightedSharePrice += s * sharePrice
      }
    }
  }

  let userPnlPct: number | null = null
  if (userShares > 0n && userCostBasis > 0n) {
    const currentValue = weightedSharePrice / (10n ** decimals)
    const pnl = Number(currentValue - userCostBasis) / Number(userCostBasis)
    userPnlPct = Math.round(pnl * 1000) / 10
  }

  return { marketCap: String(totalMarketCap), count: totalCount, userPnlPct }
}

// Global cache to avoid re-fetching. Key includes the addresses set because
// userPnlPct depends on which wallets own positions on the triple.
export const statsCache = new Map<string, VaultStats>()

export function cacheKey(termId: string, addresses: string[]): string {
  if (addresses.length === 0) return `${termId}::`
  return `${termId}::${[...addresses].sort().join(',')}`
}

export async function fetchVaultStats(
  termId: string,
  addresses: string[],
): Promise<VaultStats | null> {
  const key = cacheKey(termId, addresses)
  const cached = statsCache.get(key)
  if (cached) return cached

  const data = await useGetTripleVaultStatsQuery.fetcher({
    termId,
    addresses,
  })()

  const triple = data.triples?.[0]
  if (!triple) return null

  const support = extractSide(triple.term?.vaults)
  const oppose = extractSide(triple.counter_term?.vaults)

  const userPnlPct = support.userPnlPct ?? oppose.userPnlPct

  const result: VaultStats = {
    supportMarketCap: support.marketCap,
    opposeMarketCap: oppose.marketCap,
    supportCount: support.count,
    opposeCount: oppose.count,
    userPnlPct,
  }

  statsCache.set(key, result)
  return result
}

/** Format wei value as ETH with appropriate decimals */
export function formatEth(wei: string): string {
  const val = Number(BigInt(wei)) / 1e18
  if (val === 0) return '0'
  if (val < 0.001) return '<0.001'
  if (val < 1) return val.toFixed(3)
  if (val < 100) return val.toFixed(2)
  return val.toFixed(1)
}
