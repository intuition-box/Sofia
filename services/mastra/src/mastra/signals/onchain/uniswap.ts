import type { PlatformMetrics, SignalFetcher } from "../types"
import { safeNumber } from "../utils"
import { querySubgraph } from "./utils"

/**
 * Uniswap v3 Ethereum mainnet subgraph.
 * Subgraph ID on The Graph decentralized network:
 *   5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV
 *
 * Requires GRAPH_API_KEY env var.
 */
const UNISWAP_V3_SUBGRAPH = "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"

const POSITIONS_QUERY = `
  query UniswapUser($id: String!) {
    positions(where: { owner: $id }, first: 100) {
      id
      liquidity
    }
    swaps(where: { origin: $id }, first: 100, orderBy: timestamp, orderDirection: desc) {
      id
      amountUSD
      timestamp
    }
  }
`

export const fetchUniswapSignals: SignalFetcher = async (
  walletAddress,
  _userId,
  _ctx
): Promise<PlatformMetrics> => {
  const addr = walletAddress.toLowerCase()

  const data = await querySubgraph<{
    positions: { id: string; liquidity: string }[]
    swaps: { id: string; amountUSD: string; timestamp: string }[]
  }>(UNISWAP_V3_SUBGRAPH, POSITIONS_QUERY, { id: addr })

  const positions = data?.positions ?? []
  const swaps = data?.swaps ?? []

  const activePositions = positions.filter(
    (p) => BigInt(p.liquidity || "0") > 0n
  ).length

  const totalSwapVolumeUsd = swaps.reduce(
    (sum, s) => sum + safeNumber(parseFloat(s.amountUSD)),
    0
  )

  // Swaps in last 30 days
  const thirtyDaysAgo = Math.floor(
    (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000
  )
  const recentSwaps = swaps.filter(
    (s) => safeNumber(parseInt(s.timestamp)) > thirtyDaysAgo
  ).length

  return {
    positions_total: positions.length,
    positions_active: activePositions,
    swaps_total: swaps.length,
    swaps_30d: recentSwaps,
    swap_volume_usd: Math.round(totalSwapVolumeUsd),
    is_lp: activePositions > 0 ? 1 : 0,
    is_trader: swaps.length > 0 ? 1 : 0,
  }
}
