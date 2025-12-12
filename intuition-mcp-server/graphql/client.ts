import { GraphQLClient } from "graphql-request";

const graphqlUrl =
  process.env.INTUITION_GRAPHQL_URL ||
  "https://mainnet.intuition.sh/v1/graphql";

const TIMEOUT_MS = 30000; // 30 seconds
const CACHE_TTL = 60000; // Cache for 1 minute

// Simple in-memory cache
type CacheEntry = {
  data: any;
  timestamp: number;
};

const queryCache = new Map<string, CacheEntry>();

const getCacheKey = (input: RequestInfo | URL, init?: RequestInit): string => {
  if (typeof input !== "string") {
    input = input.toString();
  }
  return `${input}-${init?.body || ""}`;
};

const getFromCache = (key: string): any | null => {
  const entry = queryCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL) {
    queryCache.delete(key);
    return null;
  }

  return entry.data;
};

const setInCache = (key: string, data: any) => {
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

// Performance monitoring
const logPerformance = (
  startTime: number,
  operation: string,
  success: boolean,
  cached: boolean = false,
) => {
  const duration = Date.now() - startTime;
  console.log(
    `[Performance] ${operation} - Duration: ${duration}ms - Status: ${
      success ? "Success" : "Failed"
    } - Cached: ${cached}`,
  );

  // Alert on slow queries
  if (duration > 5000) {
    console.warn(
      `[Performance Warning] Slow operation detected: ${operation} took ${duration}ms`,
    );
  }
};

export const client = new GraphQLClient(graphqlUrl, {
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "@0xintuition/mcp-server",
  },
  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    const startTime = Date.now();
    const operation = init?.body
      ? JSON.parse(init.body as string)?.operationName || "Unknown Query"
      : "Unknown Query";

    // Try to get from cache first
    console.log("graphqlURL", graphqlUrl);
    const cacheKey = getCacheKey(input, init);
    const cachedData = getFromCache(cacheKey);

    if (cachedData) {
      logPerformance(startTime, operation, true, true);
      return new Response(JSON.stringify(cachedData), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.clone().json();
        setInCache(cacheKey, data);
      }

      logPerformance(startTime, operation, response.ok, false);
      return response;
    } catch (error) {
      logPerformance(startTime, operation, false, false);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },
});

export type { GraphQLClient };
