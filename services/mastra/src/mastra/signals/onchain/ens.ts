import type { PlatformMetrics, SignalFetcher } from "../types"
import { safeNumber } from "../utils"
import { asAddress, getMainnetClient, queryPublicGraphQL } from "./utils"

/**
 * ENS fetcher — the "token" arg is a wallet address.
 *
 * Reads:
 *   - primary ENS name (reverse resolution via viem)
 *   - optional text records (email, url, twitter) if name exists
 *   - subdomain count via the ENS subgraph (public hosted service)
 */

const ENS_SUBGRAPH =
  "https://api.thegraph.com/subgraphs/name/ensdomains/ens"

const SUBGRAPH_QUERY = `
  query EnsAccount($id: String!) {
    account(id: $id) {
      id
      domains(first: 100) {
        id
        name
        expiryDate
        isMigrated
      }
      wrappedDomains(first: 100) {
        id
      }
    }
  }
`

export const fetchEnsSignals: SignalFetcher = async (
  walletAddress,
  _userId,
  ctx
): Promise<PlatformMetrics> => {
  const safe = ctx?.safeStep ?? (async (fn, fallback) => {
    try { return await fn() } catch { return fallback }
  })

  const client = getMainnetClient()
  const addr = asAddress(walletAddress.toLowerCase())

  // Primary — reverse ENS lookup
  const ensName = await safe(
    async () => await client.getEnsName({ address: addr }),
    null,
    "ens_reverse_lookup"
  )

  // Secondary — subgraph for domain + subdomain count
  const subgraphData = await safe(
    async () => {
      const data = await queryPublicGraphQL<{
        account: {
          domains: { id: string; name: string; expiryDate: string | null }[]
          wrappedDomains: { id: string }[]
        } | null
      }>(ENS_SUBGRAPH, SUBGRAPH_QUERY, { id: addr })
      return data?.account
    },
    null,
    "ens_subgraph"
  )

  const domainsOwned = safeNumber(subgraphData?.domains?.length)
  const wrappedCount = safeNumber(subgraphData?.wrappedDomains?.length)

  return {
    has_primary_ens: ensName ? 1 : 0,
    domains_owned: domainsOwned,
    wrapped_domains: wrappedCount,
  }
}
