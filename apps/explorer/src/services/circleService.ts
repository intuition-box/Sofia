import {
  useGetTrustCircleAccountsQuery,
  useGetSofiaTrustedActivityQuery,
  useGetFollowingCountQuery,
} from '@0xsofia/graphql'
import { getAddress } from 'viem'
import { SOFIA_PROXY_ADDRESS, PREDICATE_IDS, SUBJECT_IDS } from '../config'
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
  intentionVaults: Record<string, { termId: string; counterTermId: string }>
  /** Topic slugs from nested "in context of" triples (e.g. ["tech-dev", "web3-crypto"]) */
  topicContexts: string[]
}

// Cache trusted wallets keyed by the sorted set of linked wallets that asked.
// Multi-wallet users have the same cache entry regardless of which wallet
// triggered the fetch, so this is effectively a per-user cache.
let cachedTrustedWallets: string[] | null = null
let cachedForKey: string | null = null

function cacheKeyFor(addresses: string[]): string {
  return [...addresses].sort().join(',')
}

/** Step 1: union of wallets trusted by any of the user's linked wallets */
async function fetchTrustedWallets(addresses: string[]): Promise<string[]> {
  const key = cacheKeyFor(addresses)
  if (cachedForKey === key && cachedTrustedWallets) {
    return cachedTrustedWallets
  }

  const data = await useGetTrustCircleAccountsQuery.fetcher({
    subjectId: SUBJECT_IDS.I,
    predicateId: PREDICATE_IDS.TRUSTS,
    walletAddresses: addresses,
  })()

  const wallets: string[] = []
  for (const triple of data.triples ?? []) {
    const accounts = triple.object?.accounts ?? []
    for (const acc of accounts) {
      if (acc.id) wallets.push(acc.id)
    }
  }

  cachedTrustedWallets = wallets
  cachedForKey = key
  return wallets
}

/** Step 2: activity from trusted wallets, unioned across the user's linked wallets */
export async function fetchCircleFeed(
  addresses: string[],
  limit: number = 200,
  offset: number = 0,
): Promise<CircleItem[]> {
  if (addresses.length === 0) return []

  const trustedWallets = await fetchTrustedWallets(addresses)
  if (trustedWallets.length === 0) return []

  // GraphQL stores addresses in checksum case
  const checksumWallets = trustedWallets.map((w) => getAddress(w))

  const data = await useGetSofiaTrustedActivityQuery.fetcher({
    trustedWallets: checksumWallets,
    proxy: getAddress(SOFIA_PROXY_ADDRESS),
    limit,
    offset,
  })()

  const items = processEvents(data.events ?? [], (evt) => {
    const address = evt.deposit?.receiver?.id || evt.redemption?.sender?.id || ''
    const label = evt.deposit?.receiver?.label || evt.redemption?.sender?.label || address
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
export async function fetchFollowingCount(walletAddress: string): Promise<number> {
  try {
    const data = await useGetFollowingCountQuery.fetcher({
      address: walletAddress.toLowerCase(),
    })()
    return data.following_aggregate?.aggregate?.count ?? 0
  } catch {
    return 0
  }
}

/** Escape hatch for tests that need to reset the module-level cache. */
export function __clearTrustedWalletsCacheForTests() {
  cachedTrustedWallets = null
  cachedForKey = null
}
