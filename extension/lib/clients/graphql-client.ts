import { API_CONFIG } from '../config/chainConfig'
import { createServiceLogger } from '../utils/logger'

const logger = createServiceLogger('GraphQLClient')

// GraphQL endpoint is now dynamically configured based on environment
// - pnpm dev → testnet
// - pnpm build → mainnet
export const INTUITION_GRAPHQL_ENDPOINT = API_CONFIG.GRAPHQL_ENDPOINT

// Cache for GraphQL responses (TTL: 30 seconds)
const CACHE_TTL_MS = 30000
const queryCache = new Map<string, { data: any; timestamp: number }>()

// Concurrency limit — up to MAX_CONCURRENT requests run in parallel. Replaces
// the previous single-slot queue which serialized every GraphQL call and
// bottlenecked the whole extension. Rate-limit protection is handled by the
// 429 retry/backoff logic below plus MIN_REQUEST_INTERVAL_MS jitter per slot.
const MAX_CONCURRENT = 3
const MIN_REQUEST_INTERVAL_MS = 50 // Per-slot minimum interval

let activeSlots = 0
const waitingForSlot: Array<() => void> = []

const acquireSlot = (): Promise<void> => {
  if (activeSlots < MAX_CONCURRENT) {
    activeSlots++
    return Promise.resolve()
  }
  return new Promise<void>((resolve) => {
    waitingForSlot.push(() => {
      activeSlots++
      resolve()
    })
  })
}

const releaseSlot = (): void => {
  activeSlots--
  const next = waitingForSlot.shift()
  if (next) next()
}

// Retry configuration
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY_MS = 1000 // 1s, then 2s, then 4s (exponential backoff)

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

// Simple GraphQL client for queries with rate limiting, retry, and caching
export const intuitionGraphqlClient = {
  request: async (query: string, variables?: any) => {
    // Check cache first
    const cacheKey = getCacheKey(query, variables)
    const cached = queryCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data
    }

    await acquireSlot()
    try {
      // Double-check cache (another request might have populated it while we waited)
      const cached2 = queryCache.get(cacheKey)
      if (cached2 && Date.now() - cached2.timestamp < CACHE_TTL_MS) {
        return cached2.data
      }

      // Retry loop with exponential backoff
      let lastError: Error | null = null
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt === 0) {
          await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS))
        } else {
          const backoffDelay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1)
          logger.warn(`Retry ${attempt}/${MAX_RETRIES} after ${backoffDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
        }

        try {
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
            if (response.status === 429) {
              lastError = new Error(`HTTP error! status: 429 (rate limited)`)
              continue
            }
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const json = await response.json()

          if (json.errors) {
            throw new Error(`GraphQL error: ${json.errors[0].message}`)
          }

          queryCache.set(cacheKey, { data: json.data, timestamp: Date.now() })

          if (queryCache.size > 50) {
            cleanCache()
          }

          return json.data
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err))
          if (!lastError.message.includes('429')) {
            throw lastError
          }
        }
      }

      throw lastError || new Error('GraphQL request failed after retries')
    } finally {
      releaseSlot()
    }
  },

  // Clear cache (useful after mutations)
  clearCache: () => {
    queryCache.clear()
  },

  // Subscribe to TX events — clear cache on any TX
  _initTxSubscription: (() => {
    import("../services/TxEventBus").then(({ txEventBus }) => {
      txEventBus.on("*", () => {
        queryCache.clear()
        logger.debug("Cache cleared via TxEventBus")
      })
    })
  })(),

  /**
   * Paginated fetch - fetches all pages of results
   * @param query - GraphQL query with $limit and $offset variables
   * @param variables - Query variables (without limit/offset)
   * @param resultKey - Key in response to extract array from (e.g., 'triples')
   * @param pageSize - Number of items per page (default 100)
   * @param maxPages - Maximum pages to fetch (default 100 = 10000 items)
   */
  fetchAllPages: async <T>(
    query: string,
    variables: any,
    resultKey: string,
    pageSize: number = 100,
    maxPages: number = 100
  ): Promise<T[]> => {
    const allResults: T[] = []
    let offset = 0
    let hasMore = true
    let pageCount = 0

    while (hasMore && pageCount < maxPages) {
      const pageVariables = { ...variables, limit: pageSize, offset }
      const response = await intuitionGraphqlClient.request(query, pageVariables)
      const pageResults = response?.[resultKey] || []

      allResults.push(...pageResults)

      // If we got fewer results than page size, we've reached the end
      if (pageResults.length < pageSize) {
        hasMore = false
      } else {
        offset += pageSize
        pageCount++
      }
    }

    return allResults
  }
}

// Export useful types and functions from SDK
export * from '@0xsofia/graphql'
