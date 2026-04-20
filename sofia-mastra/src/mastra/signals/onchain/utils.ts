import { createPublicClient, http, type Address, type PublicClient } from "viem"
import { mainnet } from "viem/chains"

/**
 * Ethereum mainnet RPC. Defaults to a public endpoint; override with
 * ETH_MAINNET_RPC in production for better reliability and rate limits.
 */
const MAINNET_RPC = process.env.ETH_MAINNET_RPC || "https://eth.llamarpc.com"

let _mainnetClient: PublicClient | null = null

export function getMainnetClient(): PublicClient {
  if (!_mainnetClient) {
    _mainnetClient = createPublicClient({
      chain: mainnet,
      transport: http(MAINNET_RPC),
    })
  }
  return _mainnetClient
}

/**
 * Cast a string to a 0x-prefixed address (unchecked — caller is responsible
 * for format validation).
 */
export function asAddress(addr: string): Address {
  return addr as Address
}

/**
 * The Graph gateway query helper. Requires GRAPH_API_KEY env var for the
 * decentralized network; falls back to a no-op error message if missing.
 *
 * subgraphId: the deployment id (Qm...) of the subgraph on the decentralized network.
 */
export async function querySubgraph<T = unknown>(
  subgraphId: string,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T | null> {
  const apiKey = process.env.GRAPH_API_KEY
  if (!apiKey) {
    throw new Error("missing_graph_api_key")
  }

  const url = `https://gateway-arbitrum.network.thegraph.com/api/${apiKey}/subgraphs/id/${subgraphId}`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    throw new Error(`subgraph_error:${res.status}`)
  }

  const data = await res.json()
  if (data.errors) {
    throw new Error(`subgraph_errors:${JSON.stringify(data.errors)}`)
  }

  return data.data as T
}

/**
 * Simple public GraphQL query (no auth). Used for Snapshot, Lens, etc.
 */
export async function queryPublicGraphQL<T = unknown>(
  url: string,
  query: string,
  variables: Record<string, unknown> = {},
  extraHeaders: Record<string, string> = {}
): Promise<T | null> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    throw new Error(`graphql_error:${res.status}`)
  }

  const data = await res.json()
  if (data.errors) {
    throw new Error(`graphql_errors:${JSON.stringify(data.errors)}`)
  }

  return data.data as T
}
