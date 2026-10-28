/**
 * Pure JSON-RPC policy of the proxy: which methods pass, what can be cached
 * and for how long, per-IP rate limit, upstream concurrency. No I/O here, so
 * it is unit-tested on its own (rpc.test.ts).
 */

export interface RpcRequest {
  jsonrpc?: string
  id?: string | number | null
  method: string
  params?: unknown[]
}

/** What Sofia's clients and wallets-through-viem actually call. Anything else
 *  (debug_*, admin_*, txpool_*, personal_*…) is refused. */
export const ALLOWED_METHODS: ReadonlySet<string> = new Set([
  'eth_blockNumber',
  'eth_call',
  'eth_chainId',
  'eth_estimateGas',
  'eth_feeHistory',
  'eth_gasPrice',
  'eth_getBalance',
  'eth_getBlockByHash',
  'eth_getBlockByNumber',
  'eth_getCode',
  'eth_getLogs',
  'eth_getStorageAt',
  'eth_getTransactionByHash',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
  'eth_maxPriorityFeePerGas',
  'eth_sendRawTransaction',
  'eth_simulateV1',
  'net_version',
  'web3_clientVersion',
])

export function isRpcRequest(value: unknown): value is RpcRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as RpcRequest).method === 'string' &&
    ((value as RpcRequest).params === undefined ||
      Array.isArray((value as RpcRequest).params))
  )
}

/** The method no request of the payload may use, if any */
export function forbiddenMethod(
  requests: readonly RpcRequest[],
): string | null {
  for (const r of requests) if (!ALLOWED_METHODS.has(r.method)) return r.method
  return null
}

const BLOCK_TAGS = new Set(['latest', 'pending', 'safe', 'finalized'])

/**
 * How long a single request's result may be served from cache (ms), 0 = never.
 * Reads against a fixed block never change; reads against `latest` are fresh
 * enough for a couple of seconds — the window that absorbs a page mounting
 * twenty hooks at once.
 */
export function cacheTtlMs(req: RpcRequest): number {
  const params = req.params ?? []
  switch (req.method) {
    case 'eth_chainId':
    case 'net_version':
      return 60 * 60_000
    case 'eth_blockNumber':
    case 'eth_gasPrice':
    case 'eth_maxPriorityFeePerGas':
      return 2_000
    case 'eth_getCode':
    case 'eth_getStorageAt':
    case 'eth_call': {
      const tag = params[params.length - 1]
      if (typeof tag === 'string' && tag.startsWith('0x') && tag.length < 20)
        return 5 * 60_000 // a fixed block number: immutable
      if (
        tag === undefined ||
        typeof tag === 'object' ||
        BLOCK_TAGS.has(String(tag))
      )
        return tag === 'pending' ? 0 : 2_000
      return 0
    }
    case 'eth_getTransactionReceipt':
      return 0 // polled until it appears — a cached null would stall waits
    default:
      return 0
  }
}

/** Stable cache key: method + params (key order of objects normalized) */
export function cacheKey(req: RpcRequest): string {
  return `${req.method}:${stableStringify(req.params ?? [])}`
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    return `{${Object.keys(obj)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

/** The upstream's throttle: HTTP 429 or JSON-RPC -31002 "Bandwidth limit" */
export function isUpstreamThrottle(status: number, body: string): boolean {
  if (status === 429) return true
  return /"code"\s*:\s*-31002|bandwidth limit|rate limit/i.test(body)
}

/** Fixed-window counter per key (IP) */
export class RateLimiter {
  private hits = new Map<string, { windowStart: number; count: number }>()

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Counts `weight` requests; false when the key is over its limit */
  take(key: string, weight = 1, now = Date.now()): boolean {
    const entry = this.hits.get(key)
    if (!entry || now - entry.windowStart >= this.windowMs) {
      this.hits.set(key, { windowStart: now, count: weight })
      return weight <= this.limit
    }
    entry.count += weight
    return entry.count <= this.limit
  }

  /** Drop expired windows so the map doesn't grow forever */
  sweep(now = Date.now()): void {
    for (const [key, entry] of this.hits) {
      if (now - entry.windowStart >= this.windowMs) this.hits.delete(key)
    }
  }
}

/** At most `max` upstream calls in flight — bursts queue instead of
 *  tripping the upstream's per-IP throttle */
export class Semaphore {
  private active = 0
  private waiting: (() => void)[] = []

  constructor(private readonly max: number) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.max) {
      await new Promise<void>((resolve) => this.waiting.push(resolve))
    }
    this.active++
    try {
      return await task()
    } finally {
      this.active--
      this.waiting.shift()?.()
    }
  }
}

/** Short-lived response cache with in-flight dedupe */
export class ResponseCache {
  private entries = new Map<string, { body: string; expires: number }>()
  private inflight = new Map<string, Promise<string>>()

  constructor(private readonly maxEntries = 5_000) {}

  get(key: string, now = Date.now()): string | null {
    const e = this.entries.get(key)
    if (!e) return null
    if (e.expires <= now) {
      this.entries.delete(key)
      return null
    }
    return e.body
  }

  set(key: string, body: string, ttlMs: number, now = Date.now()): void {
    if (ttlMs <= 0) return
    if (this.entries.size >= this.maxEntries) {
      // Oldest first (Map keeps insertion order)
      const oldest = this.entries.keys().next().value
      if (oldest !== undefined) this.entries.delete(oldest)
    }
    this.entries.set(key, { body, expires: now + ttlMs })
  }

  /** Identical requests in flight share one upstream call */
  dedupe(key: string, load: () => Promise<string>): Promise<string> {
    const pending = this.inflight.get(key)
    if (pending) return pending
    const p = load().finally(() => this.inflight.delete(key))
    this.inflight.set(key, p)
    return p
  }
}

/** A cached result re-addressed to the caller's request id */
export function withId(body: string, id: RpcRequest['id']): string {
  const parsed = JSON.parse(body) as Record<string, unknown>
  return JSON.stringify({ ...parsed, id: id ?? null })
}

/** Only successful results are cacheable — never an error or a null */
export function isCacheableResult(body: string): boolean {
  try {
    const parsed = JSON.parse(body) as { error?: unknown; result?: unknown }
    return parsed.error === undefined && parsed.result != null
  } catch {
    return false
  }
}
