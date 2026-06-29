import { GraphQLClient } from 'graphql-request'

import { API_URL_PROD } from './constants'
import { configureWsClient } from './wsClient'

export interface ClientConfig {
  headers: HeadersInit
  apiUrl?: string
}

const DEFAULT_API_URL = API_URL_PROD
const DEFAULT_MAX_CONCURRENT = 4

let globalConfig: {
  apiUrl?: string
  /** Authenticated pinning endpoint. Intuition gated `pinThing` (the only
   *  GraphQL mutation we send) behind an API key on a dedicated host. The
   *  network read endpoint (`apiUrl`) no longer accepts mutations at all, so
   *  there is NO fallback — mutations must go here. In prod this points at a
   *  backend proxy that injects the secret key server-side. */
  pinApiUrl?: string
  /** Optional Intuition API key, sent as the `apikey` header on mutations.
   *  Direct mode only — left unset in prod, where the proxy holds the key. */
  pinApiKey?: string
  maxConcurrent: number
} = {
  apiUrl: DEFAULT_API_URL,
  maxConcurrent: DEFAULT_MAX_CONCURRENT,
}

export function configureClient(config: {
  apiUrl: string
  wsUrl?: string
  /** Authenticated pinning endpoint (e.g. the backend pin proxy URL). */
  pinApiUrl?: string
  /** Intuition API key for direct pinning (omit when using a proxy). */
  pinApiKey?: string
  /** Max parallel HTTP requests through the fetcher.
   *  Defaults to 4 — caps the burst on first paint so the upstream
   *  Hasura/Kong gate doesn't 429 a wave of mounted hooks. */
  maxConcurrent?: number
}) {
  globalConfig = {
    ...globalConfig,
    apiUrl: config.apiUrl,
    pinApiUrl: config.pinApiUrl ?? globalConfig.pinApiUrl,
    pinApiKey: config.pinApiKey ?? globalConfig.pinApiKey,
    maxConcurrent: config.maxConcurrent ?? globalConfig.maxConcurrent,
  }
  if (config.wsUrl) {
    configureWsClient({ wsUrl: config.wsUrl })
  }
}

export function getClientConfig(token?: string): ClientConfig {
  return {
    headers: {
      ...(token && { authorization: `Bearer ${token}` }),
      'Content-Type': 'application/json',
    },
    apiUrl: globalConfig.apiUrl,
  }
}

export function createServerClient({ token }: { token?: string }) {
  const config = getClientConfig(token)
  if (!config.apiUrl) {
    throw new Error(
      'GraphQL API URL not configured. Call configureClient first.',
    )
  }
  return new GraphQLClient(config.apiUrl, config)
}

export const fetchParams = () => {
  return {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  }
}

// ── Concurrency limiter ─────────────────────────────────────────────
//
// Singleton queue scoped to this module — every `fetcher()` call goes
// through it. Caps the in-flight HTTP requests to `globalConfig.
// maxConcurrent` so a wave of hook mounts on first paint doesn't drown
// the upstream gate. Tasks queue FIFO and release their slot when the
// underlying fetch settles (success or error).

let inflight = 0
const waiters: Array<() => void> = []

function acquireSlot(): Promise<void> {
  if (inflight < globalConfig.maxConcurrent) {
    inflight++
    return Promise.resolve()
  }
  return new Promise<void>((resolve) => {
    waiters.push(() => {
      inflight++
      resolve()
    })
  })
}

function releaseSlot() {
  inflight--
  const next = waiters.shift()
  if (next) next()
}

// ── Dev-only audit logging ──────────────────────────────────────────
//
// Off in production. In dev, traces every request through the fetcher
// so we can see exactly which queries fire on cold-load and where the
// concurrency peak lands. Status 429 is highlighted.

// Vite (used by the explorer + dashboard apps) replaces this at build
// time; in the extension/Plasmo build it falls back to NODE_ENV.
const isDev = (() => {
  try {
    const meta = import.meta as { env?: { DEV?: boolean } }
    if (typeof import.meta !== 'undefined' && meta.env?.DEV) return true
  } catch {
    // ignored — non-Vite consumer
  }
  const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
    .process
  return !!proc && proc.env?.NODE_ENV !== 'production'
})()

function extractQueryName(query: string): string {
  const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/)
  return match?.[1] ?? 'anonymous'
}

function logStart(name: string, queued: boolean) {
  if (!isDev) return
  // eslint-disable-next-line no-console
  console.debug(
    `[gql] start ${name} inflight=${inflight}/${globalConfig.maxConcurrent}${queued ? ' (was queued)' : ''}`,
  )
}

function logDone(name: string, status: number, durMs: number) {
  if (!isDev) return
  const level = status === 429 ? 'warn' : status >= 400 ? 'error' : 'debug'
  // eslint-disable-next-line no-console
  console[level](
    `[gql] done  ${name} status=${status} dur=${durMs}ms inflight=${inflight}/${globalConfig.maxConcurrent} waiters=${waiters.length}`,
  )
}

export function fetcher<TData, TVariables>(
  query: string,
  variables?: TVariables,
  options?: RequestInit['headers'],
) {
  return async () => {
    // Intuition gated `pinThing` (our only mutation) behind an authenticated
    // host — the network read endpoint no longer accepts mutations at all, so
    // there is NO fallback. Route mutations to `pinApiUrl` (in prod a backend
    // proxy that injects the secret `apikey` server-side; the key never ships
    // in the client bundle). Reads stay on the network `apiUrl`.
    const isMutation = /^\s*mutation\b/.test(query)
    const url = isMutation ? globalConfig.pinApiUrl : globalConfig.apiUrl
    if (!url) {
      throw new Error(
        isMutation
          ? 'Pinning endpoint not configured. pinThing requires the authenticated pin proxy — call configureClient({ pinApiUrl }).'
          : 'GraphQL API URL not configured. Call configureClient first.',
      )
    }

    const name = extractQueryName(query)
    const wasQueued = inflight >= globalConfig.maxConcurrent
    await acquireSlot()
    logStart(name, wasQueued)

    const start = isDev ? performance.now() : 0
    let status = 0
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...(options as Record<string, string> | undefined),
          // Direct mode only: when a raw key is configured (no proxy) it is
          // sent as the `apikey` header. In proxy mode `pinApiKey` is unset
          // and the proxy attaches the key itself.
          ...(isMutation && globalConfig.pinApiKey
            ? { apikey: globalConfig.pinApiKey }
            : {}),
        },
        body: JSON.stringify({ query, variables }),
      })
      status = res.status

      const json = await res.json()

      if (json.errors && (!json.data || Object.keys(json.data).length === 0)) {
        const { message } = json.errors[0]
        throw new Error(message)
      }

      return json.data as TData
    } finally {
      logDone(name, status, isDev ? Math.round(performance.now() - start) : 0)
      releaseSlot()
    }
  }
}
