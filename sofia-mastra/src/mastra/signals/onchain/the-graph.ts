import type { PlatformMetrics, SignalFetcher } from "../types"
import { safeNumber } from "../utils"
import { queryPublicGraphQL } from "./utils"

/**
 * The Graph network subgraph (on mainnet).
 * Queries a user's activity as a Curator / Delegator / Indexer.
 *
 * Uses the public network subgraph (hosted service, no API key).
 */
const THE_GRAPH_NETWORK_SUBGRAPH =
  "https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-mainnet"

const USER_QUERY = `
  query GraphUser($id: String!) {
    graphAccount(id: $id) {
      id
      curator {
        totalSignalledTokens
        totalNameSignalledTokens
        signalCount
      }
      delegator {
        stakedTokens
        totalStakedTokens
        stakesCount
      }
      indexer {
        stakedTokens
      }
    }
  }
`

export const fetchTheGraphSignals: SignalFetcher = async (
  walletAddress,
  _userId,
  _ctx
): Promise<PlatformMetrics> => {
  const addr = walletAddress.toLowerCase()

  const data = await queryPublicGraphQL<{
    graphAccount: {
      id: string
      curator: {
        totalSignalledTokens: string
        signalCount: number
      } | null
      delegator: {
        stakedTokens: string
        totalStakedTokens: string
        stakesCount: number
      } | null
      indexer: {
        stakedTokens: string
      } | null
    } | null
  }>(THE_GRAPH_NETWORK_SUBGRAPH, USER_QUERY, { id: addr })

  const account = data?.graphAccount
  if (!account) {
    return {
      is_curator: 0,
      is_delegator: 0,
      is_indexer: 0,
      signals_count: 0,
      stakes_count: 0,
    }
  }

  const curator = account.curator
  const delegator = account.delegator
  const indexer = account.indexer

  return {
    is_curator: curator ? 1 : 0,
    is_delegator: delegator ? 1 : 0,
    is_indexer: indexer ? 1 : 0,
    signals_count: safeNumber(curator?.signalCount),
    stakes_count: safeNumber(delegator?.stakesCount),
  }
}
