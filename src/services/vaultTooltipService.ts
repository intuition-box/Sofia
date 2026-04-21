import { useGetTripleVaultStatsQuery } from '@0xsofia/dashboard-graphql'

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

// Global cache to avoid re-fetching
export const statsCache = new Map<string, VaultStats>()

export async function fetchVaultStats(termId: string, walletAddress: string): Promise<VaultStats | null> {
  const cached = statsCache.get(termId)
  if (cached) return cached

  const data = await useGetTripleVaultStatsQuery.fetcher({
    termId,
    address: walletAddress || '0x0000000000000000000000000000000000000000',
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

  statsCache.set(termId, result)
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
