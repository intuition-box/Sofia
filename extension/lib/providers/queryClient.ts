/**
 * Shared QueryClient + persister — instantiated at module load so both
 * the popup (via queryProvider.tsx) and the offscreen document (via
 * realtime.ts) consume the same singleton.
 *
 * Why the split from queryProvider.tsx: the offscreen runtime has no
 * React, so we can't import a .tsx that pulls in ReactNode. This file
 * is React-free — queryProvider.tsx imports from here.
 *
 * Cross-context cache flow (Phase 1 + Phase 2):
 *   offscreen setQueryData → persister writes chrome.storage.local
 *     → chrome.storage.onChanged fires in the popup
 *     → popup rehydrates the impacted keys via queryClient.setQueryData
 */

import { QueryClient } from "@tanstack/react-query"
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import { CACHE_VERSION } from "~/lib/config/cacheVersion"

export const CACHE_MAX_AGE = 24 * 60 * 60 * 1000 // 24h
export const CACHE_KEY = "sofia-ext-rq-cache"
export { CACHE_VERSION }

// chrome.storage.local adapter — async, unlike sofia-explorer's sync
// localStorage. Survives popup close and is readable from SW + offscreen.
const chromeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const result = await chrome.storage.local.get(key)
    return (result[key] as string | undefined) ?? null
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await chrome.storage.local.set({ [key]: value })
  },
  removeItem: async (key: string): Promise<void> => {
    await chrome.storage.local.remove(key)
  }
}

// BigInt-safe roundtrip. Sofia caches contain vault shares (bigint) which
// JSON.stringify refuses to serialize — without this tag, the persister
// would silently throw on every save and leave the cache in-memory only.
const BIGINT_TAG = "__bigint__"

const replacer = (_key: string, value: unknown): unknown => {
  if (typeof value === "bigint") return `${BIGINT_TAG}${value.toString()}`
  return value
}

const reviver = (_key: string, value: unknown): unknown => {
  if (typeof value === "string" && value.startsWith(BIGINT_TAG)) {
    try {
      return BigInt(value.slice(BIGINT_TAG.length))
    } catch {
      return value
    }
  }
  return value
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Long staleTime so rehydrated entries don't all refetch at once on
      // mount — that burst was causing 429 bursts on sofia-explorer.
      staleTime: 10 * 60 * 1000,
      // gcTime must be >= maxAge for the persister to keep entries alive.
      gcTime: CACHE_MAX_AGE,
      refetchOnWindowFocus: false,
      retry: 1,
      retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 15_000),
      throwOnError: false
    }
  }
})

export const persister = createAsyncStoragePersister({
  storage: chromeStorage,
  key: CACHE_KEY,
  serialize: (client) => JSON.stringify(client, replacer),
  deserialize: (raw) => JSON.parse(raw, reviver)
})
