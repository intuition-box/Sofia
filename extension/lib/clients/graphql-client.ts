import { API_CONFIG } from '../config/chainConfig'

// GraphQL endpoint is now dynamically configured based on environment
// - pnpm dev → testnet
// - pnpm build → mainnet
export const INTUITION_GRAPHQL_ENDPOINT = API_CONFIG.GRAPHQL_ENDPOINT

// Cache for GraphQL responses (TTL: 30 seconds)
const CACHE_TTL_MS = 30000
const queryCache = new Map<string, { data: any; timestamp: number }>()

// Request queue to prevent concurrent requests
let requestQueue: Promise<any> = Promise.resolve()
const MIN_REQUEST_INTERVAL_MS = 500 // Minimum 500ms between requests

// Generate cache key from query and variables
const getCacheKey = (query: string, variables?: any): string => {
  return JSON.stringify({ query: query.trim(), variables })
}

// Clean expired cache entries
const cleanCache = () => {
  const now = Date.now()
  for (const [key, entry] of queryCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      queryCache.delete(key)
    }
  }
}

// Simple GraphQL client for queries with rate limiting and caching
export const intuitionGraphqlClient = {
  request: async (query: string, variables?: any) => {
    // Check cache first
    const cacheKey = getCacheKey(query, variables)
    const cached = queryCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data
    }

    // Queue the request to prevent concurrent calls
    const result = await (requestQueue = requestQueue.then(async () => {
      // Double-check cache (another request might have populated it)
      const cached2 = queryCache.get(cacheKey)
      if (cached2 && Date.now() - cached2.timestamp < CACHE_TTL_MS) {
        return cached2.data
      }

      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS))

      const response = await fetch(API_CONFIG.GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      })

      if (!response.ok) {
        // On 429, wait longer before next request
        if (response.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const json = await response.json()

      if (json.errors) {
        throw new Error(`GraphQL error: ${json.errors[0].message}`)
      }

      // Cache the result
      queryCache.set(cacheKey, { data: json.data, timestamp: Date.now() })

      // Clean old cache entries periodically
      if (queryCache.size > 50) {
        cleanCache()
      }

      return json.data
    }))

    return result
  },

  // Clear cache (useful after mutations)
  clearCache: () => {
    queryCache.clear()
  }
}

// Export useful types and functions from SDK
export * from '@0xintuition/graphql'