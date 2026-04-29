/**
 * circleTopicCountsService — alltime per-topic certification counts scoped
 * to a Trust Circle.
 *
 * Two-step pipeline mirroring the pattern that already powers
 * `feedProcessing.enrichWithTopicContexts`:
 *   1. Pull every cert triple whose subject is one of the circle's wallets
 *      (filter is a flat `_in` on a known-working FK path).
 *   2. Pull the "in context of" links from those cert term_ids to the
 *      requested topic atoms; bucket client-side by `object_id`.
 *
 * Avoids deep-nested `where` clauses that Hasura silently no-ops in some
 * relationship paths. Limits cap the worst case but typical Sofia circles
 * stay well below them.
 */

import { getAddress } from 'viem'
import {
  useGetCircleCertsQuery,
  useGetCertTopicLinksQuery,
} from '@0xsofia/graphql'

const CERTS_LIMIT = 50000
const LINKS_LIMIT = 50000

export type CircleTopicCounts = Map<string, number>

export async function fetchCircleTopicCounts(
  trustedWallets: readonly string[],
  topicAtomIds: readonly string[],
): Promise<CircleTopicCounts> {
  const counts: CircleTopicCounts = new Map()
  if (trustedWallets.length === 0 || topicAtomIds.length === 0) return counts

  // The indexer stores `positions.account_id` inconsistently across deposit
  // emitters — pass both checksum and lowercase casings (deduped) so the
  // `_in` filter hits regardless of how a row was written. Same pattern as
  // discoveryScoreService and useOnChainIntentionGroups.
  const checksum = trustedWallets.map((w) => getAddress(w))
  const lower = trustedWallets.map((w) => w.toLowerCase())
  const allCases = Array.from(new Set([...checksum, ...lower]))

  // Step 1 — every cert triple where one of the wallets holds shares > 0.
  const certData = await useGetCircleCertsQuery.fetcher({
    trustedWallets: allCases,
    limit: CERTS_LIMIT,
  })()
  const certTermIds = (certData.triples ?? [])
    .map((t) => t.term_id)
    .filter((x): x is string => !!x)
  if (certTermIds.length === 0) return counts

  // Step 2 — "in context of" links from those certs to the requested topics.
  const linkData = await useGetCertTopicLinksQuery.fetcher({
    certTermIds,
    topicAtomIds: [...topicAtomIds],
    limit: LINKS_LIMIT,
  })()

  for (const row of linkData.triples ?? []) {
    const topicId = row.object_id
    if (!topicId) continue
    counts.set(topicId, (counts.get(topicId) ?? 0) + 1)
  }

  return counts
}
