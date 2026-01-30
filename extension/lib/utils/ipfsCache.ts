/**
 * IPFS metadata fetching with caching and parallel requests
 */

import type { IPFSMetadata } from '../../types/follows'

// In-memory cache: ipfsHash -> metadata
const ipfsCache = new Map<string, IPFSMetadata | null>()

// IPFS gateways (primary + fallbacks)
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/'
]

/**
 * Convert IPFS URI to gateway URL
 */
function ipfsToGatewayUrl(ipfsUri: string, gatewayIndex = 0): string {
  const hash = ipfsUri.replace('ipfs://', '')
  return `${IPFS_GATEWAYS[gatewayIndex]}${hash}`
}

/**
 * Fetch metadata from IPFS with fallback gateways
 */
async function fetchFromIPFS(ipfsUri: string): Promise<IPFSMetadata | null> {
  // Check cache first
  if (ipfsCache.has(ipfsUri)) {
    return ipfsCache.get(ipfsUri)!
  }

  // Try each gateway in order
  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    try {
      const url = ipfsToGatewayUrl(ipfsUri, i)
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) })

      if (!response.ok) continue

      const data = await response.json()
      ipfsCache.set(ipfsUri, data)
      return data
    } catch (error) {
      // Try next gateway
      continue
    }
  }

  // All gateways failed
  console.warn(`Failed to fetch IPFS data from ${ipfsUri} (tried all gateways)`)
  ipfsCache.set(ipfsUri, null)
  return null
}

/**
 * Batch fetch IPFS metadata with concurrency limit
 * @param ipfsUris - Array of IPFS URIs
 * @param concurrency - Max parallel requests (default: 5)
 * @returns Map of ipfsUri -> metadata
 */
export async function batchFetchIPFS(
  ipfsUris: string[],
  concurrency = 5
): Promise<Map<string, IPFSMetadata>> {
  const resultMap = new Map<string, IPFSMetadata>()
  const unique = [...new Set(ipfsUris)].filter((uri) => uri.startsWith('ipfs://'))

  // Process in batches
  for (let i = 0; i < unique.length; i += concurrency) {
    const batch = unique.slice(i, i + concurrency)

    const promises = batch.map(async (uri) => {
      const data = await fetchFromIPFS(uri)
      if (data) {
        resultMap.set(uri, data)
      }
    })

    await Promise.all(promises)
  }

  return resultMap
}

/**
 * Fetch IPFS metadata for a single URI
 */
export async function fetchIPFSMetadata(ipfsUri: string): Promise<IPFSMetadata | null> {
  if (!ipfsUri || !ipfsUri.startsWith('ipfs://')) {
    return null
  }
  return fetchFromIPFS(ipfsUri)
}

/**
 * Clear IPFS cache
 */
export function clearIPFSCache(): void {
  ipfsCache.clear()
}

/**
 * Get cache size
 */
export function getIPFSCacheSize(): number {
  return ipfsCache.size
}
