import {
  useGetSofiaTrustedActivityQuery,
  useGetFollowingCountQuery,
} from '@0xsofia/graphql'
import { getAddress } from 'viem'
import { SOFIA_PROXY_ADDRESS } from '../config'
import { processEvents, enrichWithTopicContexts } from './feedProcessing'

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

  const data = await useGetSofiaTrustedActivityQuery.fetcher({
    trustedWallets: checksumCertifiers,
    proxy: getAddress(SOFIA_PROXY_ADDRESS),
    userAddresses: checksumViewer,
    limit,
    offset,
  })()

  const items = processEvents(data.events ?? [], (evt) => {
    const address =
      evt.deposit?.receiver?.id || evt.redemption?.sender?.id || ''
    const label =
      evt.deposit?.receiver?.label || evt.redemption?.sender?.label || address
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
