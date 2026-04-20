import type { PlatformMetrics, SignalFetcher } from "../types"
import { safeNumber } from "../utils"
import { queryPublicGraphQL } from "./utils"

/**
 * Snapshot Hub public GraphQL API.
 * No API key required.
 */
const SNAPSHOT_GRAPHQL = "https://hub.snapshot.org/graphql"

const USER_QUERY = `
  query SnapshotUser($voter: String!) {
    votes(
      first: 1000
      where: { voter: $voter }
      orderBy: "created"
      orderDirection: desc
    ) {
      id
      created
      space { id }
    }
    proposals(
      first: 100
      where: { author: $voter }
      orderBy: "created"
      orderDirection: desc
    ) {
      id
      created
      space { id }
    }
  }
`

export const fetchSnapshotSignals: SignalFetcher = async (
  walletAddress,
  _userId,
  _ctx
): Promise<PlatformMetrics> => {
  const addr = walletAddress.toLowerCase()

  const data = await queryPublicGraphQL<{
    votes: { id: string; created: number; space: { id: string } }[]
    proposals: { id: string; created: number; space: { id: string } }[]
  }>(SNAPSHOT_GRAPHQL, USER_QUERY, { voter: addr })

  const votes = data?.votes ?? []
  const proposals = data?.proposals ?? []

  const uniqueSpaces = new Set<string>()
  votes.forEach((v) => uniqueSpaces.add(v.space.id))
  proposals.forEach((p) => uniqueSpaces.add(p.space.id))

  // Activity in the last 90 days
  const ninetyDaysAgo = Math.floor(
    (Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000
  )
  const recentVotes = votes.filter((v) => v.created > ninetyDaysAgo).length
  const recentProposals = proposals.filter(
    (p) => p.created > ninetyDaysAgo
  ).length

  return {
    votes_total: safeNumber(votes.length),
    proposals_created: safeNumber(proposals.length),
    daos_active: uniqueSpaces.size,
    votes_90d: recentVotes,
    proposals_90d: recentProposals,
    is_voter: votes.length > 0 ? 1 : 0,
    is_proposer: proposals.length > 0 ? 1 : 0,
  }
}
