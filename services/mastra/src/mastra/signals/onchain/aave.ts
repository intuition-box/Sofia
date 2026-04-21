import type { PlatformMetrics, SignalFetcher } from "../types"
import { safeNumber } from "../utils"
import { querySubgraph } from "./utils"

/**
 * Aave v3 Ethereum mainnet subgraph.
 * Subgraph ID on The Graph decentralized network:
 *   JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk
 *
 * Requires GRAPH_API_KEY env var.
 */
const AAVE_V3_SUBGRAPH = "JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk"

const USER_QUERY = `
  query AaveUser($id: String!) {
    user(id: $id) {
      id
      borrowedReservesCount
      reserves {
        currentATokenBalance
        currentVariableDebt
        currentStableDebt
      }
    }
  }
`

export const fetchAaveSignals: SignalFetcher = async (
  walletAddress,
  _userId,
  _ctx
): Promise<PlatformMetrics> => {
  const addr = walletAddress.toLowerCase()

  const data = await querySubgraph<{
    user: {
      id: string
      borrowedReservesCount: number
      reserves: {
        currentATokenBalance: string
        currentVariableDebt: string
        currentStableDebt: string
      }[]
    } | null
  }>(AAVE_V3_SUBGRAPH, USER_QUERY, { id: addr })

  const user = data?.user
  if (!user) {
    return {
      positions_count: 0,
      active_deposits: 0,
      active_borrows: 0,
      is_user: 0,
    }
  }

  const activeDeposits = user.reserves.filter(
    (r) => BigInt(r.currentATokenBalance || "0") > 0n
  ).length

  const activeBorrows = user.reserves.filter(
    (r) =>
      BigInt(r.currentVariableDebt || "0") + BigInt(r.currentStableDebt || "0") >
      0n
  ).length

  return {
    positions_count: safeNumber(user.reserves.length),
    active_deposits: activeDeposits,
    active_borrows: activeBorrows,
    borrowed_reserves_count: safeNumber(user.borrowedReservesCount),
    is_user: 1,
  }
}
