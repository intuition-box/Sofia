import {
  useGetSofiaCircleActivityQuery,
  useGetFollowingCountQuery,
} from '@0xsofia/graphql'
import { getAddress } from 'viem'
import { processEvents, enrichWithTopicContexts } from './feedProcessing'

// Sofia's canonical certification predicate labels — matches
// `CERT_PREDICATE_LABELS` in userOnChainProfileService so the circle
// feed and the Echoes profile feed pull the same data shape.
const CERT_PREDICATE_LABELS = [
  'visits for work',
  'visits for learning',
  'visits for learning ', // legacy trailing-space variant
  'visits for fun',
  'visits for inspiration',
  'visits for buying',
  'visits for music',
  'trusts',
  'distrust',
] as const

export interface CircleItem {
  id: string
  title: string
  url: string
  domain: string
  favicon: string
  certifier: string
  certifierAddress: string
  intentions: string[]
  timestamp: string
  intentionVaults: Record<
    string,
    {
      termId: string
      counterTermId: string
      /** Total position count on the cert triple summed across all curves (support side). */
      supportCount: number
      /** Total position count on the counter term summed across all curves (oppose side). */
      opposeCount: number
      /** True if any of the user's linked wallets holds shares > 0 on the support side. */
      userSupported: boolean
      /** True if any of the user's linked wallets holds shares > 0 on the oppose side. */
      userOpposed: boolean
    }
  >
  /** Topic slugs from nested "in context of" triples (e.g. ["tech-dev", "web3-crypto"]) */
  topicContexts: string[]
}

/**
 * Activity authored by `certifierWallets` — the circle's roster, regardless
 * of whether that roster is "wallets the user trusts" (Trust Circle) or
 * "wallets claimed as members of this group" (on-chain group).
 *
 * `viewerWallets` is the current user's own linked wallets; it powers the
 * per-item `userSupported`/`userOpposed` flags so the support/oppose thumbs
 * light up on triples the viewer has already staked on. It's intentionally
 * decoupled from `certifierWallets` — a viewer browsing a group they
 * haven't joined still wants to see whether they vouched on any of the
 * certs surfaced there.
 *
 * Implementation: walks the `positions` table for the trust wallets,
 * scoped to triples whose creator is the Sofia proxy. This inverts the
 * old events-table approach (200 latest indexer-wide events then
 * filtered) — the new query starts from Sofia's own minted claims, so
 * a 200-row page is dense with feed-relevant cards instead of a
 * sparse intersection with the global Intuition firehose.
 */
export async function fetchCircleFeed(
  certifierWallets: string[],
  viewerWallets: string[],
  limit: number = 200,
  offset: number = 0,
): Promise<CircleItem[]> {
  if (certifierWallets.length === 0) return []

  // GraphQL stores addresses in EIP-55 checksum case — normalize both sets.
  const checksumCertifiers = certifierWallets.map((w) => getAddress(w))
  const checksumViewer = viewerWallets.map((w) => getAddress(w))

  const data = await useGetSofiaCircleActivityQuery.fetcher({
    trustedWallets: checksumCertifiers,
    userAddresses: checksumViewer,
    predicateLabels: [...CERT_PREDICATE_LABELS],
    limit,
    offset,
  })()

  // Each returned triple carries its `trustedPositions` — one row
  // per circle member who endorsed it. Expand to N synthetic events
  // so `processEvents` produces N feed cards (one per certifier).
  // We piggy-back on the existing event shape (synthetic `deposit`
  // payload) so the dedup + intention-merging logic stays untouched.
  const triples = data.triples ?? []
  const syntheticEvents: Array<{
    id: string
    created_at?: string
    triple: (typeof triples)[number]
    deposit: { receiver: { id: string; label: string } }
  }> = []
  for (const triple of triples) {
    const positions = triple.trustedPositions ?? []
    if (positions.length === 0) continue
    for (const pos of positions) {
      syntheticEvents.push({
        id: `${triple.term_id}-${pos.account_id}`,
        created_at: pos.created_at ?? undefined,
        triple,
        deposit: {
          receiver: {
            id: pos.account_id ?? '',
            label: pos.account?.label ?? pos.account_id ?? '',
          },
        },
      })
    }
  }
  // Newest first — `created_at` on the position is when that
  // certifier first staked. Triples query is keyed by `term_id` for
  // stable pagination, but the cards should feel chronological.
  syntheticEvents.sort((a, b) =>
    (b.created_at ?? '').localeCompare(a.created_at ?? ''),
  )

  const items = processEvents(syntheticEvents, (evt) => {
    const address = evt.deposit?.receiver?.id || ''
    const label = evt.deposit?.receiver?.label || address
    return { address, label }
  })
  await enrichWithTopicContexts(items)
  return items
}

/**
 * Count how many accounts the given wallet follows. This is per-wallet and
 * backed by a Hasura function that takes a single address arg — callers should
 * pass the primary wallet. In a multi-wallet world the embedded wallet
 * typically has no social graph, so primary-only is the practical signal.
 */
export async function fetchFollowingCount(
  walletAddress: string,
): Promise<number> {
  try {
    const data = await useGetFollowingCountQuery.fetcher({
      address: walletAddress.toLowerCase(),
    })()
    return data.following_aggregate?.aggregate?.count ?? 0
  } catch {
    return 0
  }
}
