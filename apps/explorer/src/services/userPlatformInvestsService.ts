/**
 * userPlatformInvestsService — the user's positions on platform ATOM vaults
 * (their "invests"), with timestamps, for the profile activity feed.
 *
 * A platform invest is a deposit on a platform atom (PLATFORM_ATOM_IDS), not
 * a triple — so it doesn't surface via the cert / context-addition queries.
 */
import { GRAPHQL_URL } from '@/config'

const GET_USER_PLATFORM_INVESTS = `
  query GetUserPlatformInvests(
    $addresses: [String!]!
    $termIds: [String!]!
    $limit: Int!
  ) {
    positions(
      where: {
        account_id: { _in: $addresses }
        term_id: { _in: $termIds }
        shares: { _gt: "0" }
      }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      term_id
      created_at
    }
  }
`

export interface UserPlatformInvest {
  /** Platform atom term_id (key into PLATFORM_ATOM_IDS by value). */
  termId: string
  /** ISO timestamp of the position. */
  createdAt: string
}

export async function fetchUserPlatformInvests(
  addresses: string[],
  termIds: string[],
  limit = 100,
): Promise<UserPlatformInvest[]> {
  if (addresses.length === 0 || termIds.length === 0) return []
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: GET_USER_PLATFORM_INVESTS,
      variables: { addresses, termIds, limit },
    }),
  })
  const json = await res.json()
  const rows = json.data?.positions ?? []
  // Dedupe by term_id keeping the earliest position (first invest), so a
  // re-deposit doesn't create a second activity row.
  const byTerm = new Map<string, string>()
  for (const p of rows) {
    if (!p.term_id || !p.created_at) continue
    const prev = byTerm.get(p.term_id)
    if (!prev || p.created_at < prev) byTerm.set(p.term_id, p.created_at)
  }
  return [...byTerm.entries()].map(([termId, createdAt]) => ({
    termId,
    createdAt,
  }))
}
