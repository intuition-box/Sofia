import {
  useGetTrustCircleAccountsQuery,
  useGetSofiaTrustedActivityQuery,
  useGetFollowingCountQuery,
} from '@0xsofia/dashboard-graphql'
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

// Cache trusted wallets so we don't re-fetch on every loadMore
let cachedTrustedWallets: string[] | null = null
let cachedForAddress: string | null = null

/** Step 1: Get wallets the user has trusted */
async function fetchTrustedWallets(walletAddress: string): Promise<string[]> {
  if (cachedForAddress === walletAddress.toLowerCase() && cachedTrustedWallets) {
    return cachedTrustedWallets
  }

  const data = await useGetTrustCircleAccountsQuery.fetcher({
    subjectId: SUBJECT_IDS.I,
    predicateId: PREDICATE_IDS.TRUSTS,
    walletAddress: walletAddress.toLowerCase(),
  })()

  const wallets: string[] = []
  for (const triple of data.triples ?? []) {
    const accounts = triple.object?.accounts ?? []
    for (const acc of accounts) {
      if (acc.id) wallets.push(acc.id)
    }
  }

  cachedTrustedWallets = wallets
  cachedForAddress = walletAddress.toLowerCase()
  return wallets
}

/** Step 2: Get activity from trusted wallets */
export async function fetchCircleFeed(
  walletAddress: string,
  limit: number = 200,
  offset: number = 0,
): Promise<CircleItem[]> {
  const trustedWallets = await fetchTrustedWallets(walletAddress)
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
