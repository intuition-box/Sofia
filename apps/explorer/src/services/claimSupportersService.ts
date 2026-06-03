/**
 * claimSupportersService — ordered stakers per claim (support + oppose).
 *
 * This is the backbone of the reputation system (see
 * docs/reputation-curation.md): reputation is derived from the credible
 * accounts that took a position AFTER you on a claim you hold. To compute
 * that, we need, per claim, the time-ordered list of stakers on each side.
 *
 * Data comes from the `ClaimSupporters` query (positions ordered by
 * created_at asc → index 0 is the first staker / Pioneer).
 */
import { useClaimSupportersQuery } from '@0xsofia/graphql'

export interface ClaimStaker {
  /** Staker wallet address. */
  account: string
  /** ISO timestamp of the position — the ordering key (asc = Pioneer first). */
  createdAt: string
  /** Raw shares (bigint string). Financial only — NOT used for reputation. */
  shares: string
}

export interface ClaimSupporters {
  /** Ordered support positions (index 0 = first staker / Pioneer). */
  support: ClaimStaker[]
  /** Ordered oppose positions (counter_term). */
  oppose: ClaimStaker[]
}

// Chunk size for the `term_id _in` filter — keeps each request bounded.
const BATCH = 50

function toStaker(p: {
  account_id: string
  created_at: string
  shares: string
}): ClaimStaker {
  return { account: p.account_id, createdAt: p.created_at, shares: p.shares }
}

/**
 * Fetch ordered support/oppose stakers for a set of claims (triple term_ids).
 * Returns a Map keyed by claim term_id; claims with no positions are absent.
 * Chunks are fired in parallel — the shared fetcher throttles concurrency.
 */
export async function fetchClaimSupporters(
  claimTermIds: readonly string[],
): Promise<Map<string, ClaimSupporters>> {
  const out = new Map<string, ClaimSupporters>()
  const ids = [...new Set(claimTermIds)].filter(Boolean)
  if (ids.length === 0) return out

  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += BATCH) chunks.push(ids.slice(i, i + BATCH))

  const results = await Promise.all(
    chunks.map((chunk) =>
      useClaimSupportersQuery.fetcher({ claimTermIds: chunk })(),
    ),
  )

  for (const data of results) {
    for (const triple of data.triples ?? []) {
      out.set(triple.term_id, {
        support: (triple.support ?? []).map(toStaker),
        oppose: (triple.counter_term?.oppose ?? []).map(toStaker),
      })
    }
  }
  return out
}
