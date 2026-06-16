/**
 * userPlatformInvestsService — the user's positions on platform ATOM vaults
 * (their "invests"), with timestamps, for the profile activity feed.
 *
 * A platform invest is a deposit on a platform atom (PLATFORM_ATOM_IDS), not
 * a triple — so it doesn't surface via the cert / context-addition queries.
 */
import { useGetUserPlatformInvestsQuery } from '@0xsofia/graphql'

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
  // Activity-feed data — degrade to empty on any network / parse / GraphQL
  // error rather than rejecting the query (the drawer just shows fewer rows).
  let rows: { term_id?: string; created_at?: string }[] = []
  try {
    const data = await useGetUserPlatformInvestsQuery.fetcher({
      addresses,
      termIds,
      limit,
    })()
    rows = data.positions ?? []
  } catch {
    return []
  }
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
