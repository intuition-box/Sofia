/**
 * sofiaFeedService — single fetch path behind the unified
 * `useSofiaFeed` hook.
 *
 * Replaces the per-surface fetchers (`fetchCircleFeed`,
 * `fetchAllActivity`, `fetchUserActivity`) with one function that
 * routes to a global or scoped GraphQL query based on whether the
 * caller passes a non-empty `accountIds` array.
 *
 * Both queries are triples-based + predicate-label-filtered (the
 * Echoes pattern), so a "Sofia cert" is identified by its predicate
 * regardless of which proxy minted it. Each returned triple is
 * expanded into per-certifier synthetic events that the existing
 * `processEvents` collapses into `CircleItem[]` for display.
 */
import { getAddress } from 'viem'
import {
  useGetSofiaCircleActivityQuery,
  useGetSofiaGlobalFeedQuery,
} from '@0xsofia/graphql'
import { processEvents, enrichWithTopicContexts } from './feedProcessing'
import type { CircleItem } from './circleService'

/** Sofia's canonical predicate labels — kept in sync with
 *  `userOnChainProfileService` and `circleService`. */
export const SOFIA_PREDICATE_LABELS = [
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

export interface SofiaFeedParams {
  /** When non-empty, scope the feed to triples any of these wallets
   *  actively endorses. When empty/undefined, return the global
   *  Sofia feed. */
  accountIds?: readonly string[]
  /** Viewer wallets — drives the per-card `userSupported` /
   *  `userOpposed` flags. Always lowercase or checksum; the service
   *  re-checksums internally. */
  viewerWallets: readonly string[]
  /** Predicate label allow-list. Defaults to the full Sofia set. */
  predicateLabels?: readonly string[]
  limit?: number
  offset?: number
}

export async function fetchSofiaFeed({
  accountIds,
  viewerWallets,
  predicateLabels = SOFIA_PREDICATE_LABELS,
  limit = 1000,
  offset = 0,
}: SofiaFeedParams): Promise<CircleItem[]> {
  const checksumViewer = viewerWallets.map((w) => getAddress(w))
  const labels = [...predicateLabels]

  // Scoped feed — circle / user-activity / my-circle toggle. Each
  // triple carries `trustedPositions` (one row per matching account)
  // so we expand into N synthetic events for processEvents to group.
  if (accountIds && accountIds.length > 0) {
    const checksumAccounts = accountIds.map((w) => getAddress(w))
    const data = await useGetSofiaCircleActivityQuery.fetcher({
      trustedWallets: checksumAccounts,
      userAddresses: checksumViewer,
      predicateLabels: labels,
      limit,
      offset,
    })()

    const triples = data.triples ?? []
    const synthetic: Array<{
      id: string
      created_at?: string
      triple: (typeof triples)[number]
      deposit: { receiver: { id: string; label: string } }
    }> = []
    for (const triple of triples) {
      const positions = triple.trustedPositions ?? []
      if (positions.length === 0) continue
      for (const pos of positions) {
        synthetic.push({
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
    synthetic.sort((a, b) =>
      (b.created_at ?? '').localeCompare(a.created_at ?? ''),
    )

    const items = processEvents(synthetic, (evt) => {
      const address = evt.deposit?.receiver?.id || ''
      const label = evt.deposit?.receiver?.label || address
      return { address, label }
    })
    await enrichWithTopicContexts(items)
    return items
  }

  // Global feed — no account scope. We only get the single most
  // recent depositor per triple (`recentPositions: limit: 1`) so a
  // popular cert doesn't fan out into N cards in the homepage feed.
  const data = await useGetSofiaGlobalFeedQuery.fetcher({
    userAddresses: checksumViewer,
    predicateLabels: labels,
    limit,
    offset,
  })()

  const triples = data.triples ?? []
  const synthetic = triples.map((triple) => {
    const pos = triple.recentPositions?.[0]
    return {
      id: pos ? `${triple.term_id}-${pos.account_id}` : (triple.term_id ?? ''),
      created_at: pos?.created_at ?? undefined,
      triple,
      deposit: {
        receiver: {
          id: pos?.account_id ?? '',
          label: pos?.account?.label ?? pos?.account_id ?? '',
        },
      },
    }
  })

  const items = processEvents(synthetic, (evt) => {
    const address = evt.deposit?.receiver?.id || ''
    const label = evt.deposit?.receiver?.label || address
    return { address, label }
  })
  await enrichWithTopicContexts(items)
  return items
}
