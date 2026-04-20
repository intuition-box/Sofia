import type { PlatformMetrics, SignalFetcher } from "../types"
import { safeNumber } from "../utils"

/**
 * OpenSea v2 API — API key pattern.
 *
 * Requires OPENSEA_API_KEY (get one at https://docs.opensea.io/reference/api-keys).
 * Free tier: ~4 requests/second, plenty for our per-user fetches.
 */
const OPENSEA_BASE = "https://api.opensea.io/api/v2"

export const fetchOpenseaSignals: SignalFetcher = async (
  walletAddress,
  _userId,
  ctx
): Promise<PlatformMetrics> => {
  const apiKey = process.env.OPENSEA_API_KEY
  if (!apiKey) {
    throw new Error("missing_opensea_api_key")
  }

  const addr = walletAddress.toLowerCase()
  const headers = {
    "X-API-KEY": apiKey,
    Accept: "application/json",
  }

  const safe = ctx?.safeStep ?? (async (fn, fallback) => {
    try { return await fn() } catch { return fallback }
  })

  // Account stats — username, profile picture, created date
  const account = await safe(
    async () => {
      const res = await fetch(`${OPENSEA_BASE}/accounts/${addr}`, { headers })
      if (!res.ok) throw new Error(`opensea_account:${res.status}`)
      return await res.json()
    },
    null as any,
    "opensea_account"
  )

  // NFTs owned (first 200 page)
  const nfts = await safe(
    async () => {
      const res = await fetch(
        `${OPENSEA_BASE}/chain/ethereum/account/${addr}/nfts?limit=200`,
        { headers }
      )
      if (!res.ok) throw new Error(`opensea_nfts:${res.status}`)
      const data = await res.json()
      return Array.isArray(data?.nfts) ? data.nfts : []
    },
    [] as any[],
    "opensea_nfts"
  )

  // Distinct collections
  const collections = new Set<string>()
  for (const nft of nfts) {
    if (nft.collection) collections.add(nft.collection)
  }

  return {
    nfts_owned: safeNumber(nfts.length),
    distinct_collections: collections.size,
    is_verified: account?.is_verified ? 1 : 0,
    has_profile: account?.username ? 1 : 0,
  }
}
