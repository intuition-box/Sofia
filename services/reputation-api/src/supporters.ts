// Ordered stakers per claim (support + oppose) — backend port of the explorer's
// claimSupportersService, reusing the same generated `ClaimSupporters` query.
import { useClaimSupportersQuery } from '@0xsofia/graphql'
import type { ClaimSupporters, ClaimStaker } from '@0xsofia/reputation'
import { ensureGraphqlConfigured } from './graphql'

const BATCH = 50

function toStaker(p: {
  account_id: string
  created_at: string
  shares: string
}): ClaimStaker {
  return { account: p.account_id, createdAt: p.created_at, shares: p.shares }
}

/**
 * Ordered support/oppose stakers for a set of claim term_ids, keyed by claim.
 * Claims with no positions are absent. Term_ids are chunked to bound each
 * request; the shared GraphQL client throttles concurrency.
 */
export async function fetchClaimSupporters(
  claimTermIds: readonly string[],
): Promise<Map<string, ClaimSupporters>> {
  ensureGraphqlConfigured()
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
