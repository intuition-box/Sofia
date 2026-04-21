import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { PrivyProvider } from '@privy-io/react-auth'
import { BrowserRouter } from 'react-router-dom'
import { configureClient } from '@0xsofia/dashboard-graphql'
import { PRIVY_APP_ID, GRAPHQL_URL, GRAPHQL_WS_URL } from '../config'
import { CartProvider } from '../hooks/useCart'
import { ViewAsProvider } from '../hooks/useViewAs'

// HTTP proxy (/v1/graphql) in dev for CORS, direct WSS for subscriptions.
configureClient({ apiUrl: GRAPHQL_URL, wsUrl: GRAPHQL_WS_URL })

const CACHE_MAX_AGE = 24 * 60 * 60 * 1000 // 24h

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Longer staleTime so rehydrated queries from the persister don't
      // all refetch immediately on mount — that burst was causing 429s
      // on mainnet GraphQL, which the browser reported as CORS errors
      // (429 responses don't include CORS headers).
      staleTime: 10 * 60 * 1000, // 10 min
      // gcTime must be >= maxAge for the persister to keep entries
      gcTime: CACHE_MAX_AGE,
      // Avoid refetching every time the user switches tabs — the cache is fresh enough
      refetchOnWindowFocus: false,
      // retry:1 keeps a single automatic retry for transient network blips
      // but doesn't amplify rate-limit storms — when ~20 hooks mount at the
      // same time and one gets 429'd, retry:3 turns 20 requests into 80
      // within a few seconds, and Kong answers 429 without CORS headers,
      // which the browser surfaces as "No Access-Control-Allow-Origin".
      retry: 1,
      retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 15_000),
      throwOnError: false,
    },
  },
})

// Persist React Query cache to localStorage so scores (and other fetched data)
// show up instantly on reload, before Privy finishes re-authenticating and the
// background refetch completes.
//
// Several caches contain bigints (vault shares, market caps). JSON.stringify
// throws on bigint values, which would silently break the persister on every
// save and leave the cache in-memory only — the user then sees a "loading"
// flash on each reload. The custom serialize/deserialize marshals bigints
// through a tagged string so the persister roundtrips them cleanly.
const BIGINT_TAG = '__bigint__'

function replacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') return `${BIGINT_TAG}${value.toString()}`
  return value
}

function reviver(_key: string, value: unknown): unknown {
  if (typeof value === 'string' && value.startsWith(BIGINT_TAG)) {
    try { return BigInt(value.slice(BIGINT_TAG.length)) } catch { return value }
  }
  return value
}

const persister =
  typeof window !== 'undefined'
    ? createSyncStoragePersister({
        storage: window.localStorage,
        key: 'sofia-rq-cache',
        serialize: (client) => JSON.stringify(client, replacer),
        deserialize: (raw) => JSON.parse(raw, reviver),
      })
    : undefined

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['wallet', 'google'],
        appearance: { theme: 'dark' },
      }}
    >
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={
          persister
            ? { persister, maxAge: CACHE_MAX_AGE }
            : { persister: undefined as any, maxAge: CACHE_MAX_AGE }
        }
      >
        <CartProvider>
          <ViewAsProvider>
            <BrowserRouter>
              {children}
            </BrowserRouter>
          </ViewAsProvider>
        </CartProvider>
      </PersistQueryClientProvider>
    </PrivyProvider>
  )
}
