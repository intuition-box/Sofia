import type { PlatformMetrics, SignalFetcher } from "../types"
import { monthsSince, safeNumber } from "../utils"
import { queryPublicGraphQL } from "./utils"

/**
 * Lens Protocol v3 (Lens Network) public GraphQL API.
 * Docs: https://lens.xyz/docs
 *
 * The legacy v2 endpoint (api-v2.lens.dev) is deprecated and returns HTML.
 * v3 schema uses Account (instead of Profile), keyed by EVM address.
 *
 * accountStats requires forFeeds/forGraphs scope addresses — skipped here for
 * simplicity. We derive metrics from Account fields directly (presence + score).
 */
const LENS_GRAPHQL = "https://api.lens.xyz/graphql"

const ACCOUNT_QUERY = `
  query AccountByAddress($address: EvmAddress!) {
    account(request: { address: $address }) {
      address
      owner
      createdAt
      score
      username {
        value
      }
    }
  }
`

export const fetchLensSignals: SignalFetcher = async (
  walletAddress,
  _userId,
  _ctx
): Promise<PlatformMetrics> => {
  const data = await queryPublicGraphQL<{
    account: {
      address: string
      owner: string
      createdAt: string
      score: number
      username: { value: string } | null
    } | null
  }>(LENS_GRAPHQL, ACCOUNT_QUERY, { address: walletAddress })

  const account = data?.account
  if (!account) {
    return {
      has_profile: 0,
      has_username: 0,
      score: 0,
      anciennete_mois: 0,
    }
  }

  return {
    has_profile: 1,
    has_username: account.username?.value ? 1 : 0,
    score: safeNumber(account.score),
    anciennete_mois: account.createdAt ? monthsSince(account.createdAt) : 0,
  }
}
