/**
 * eigentrustService — credibility weights for the reputation system.
 *
 * "Credibility" of an account = the remote trust engine's composite score
 * (EigenTrust + AgentRank + transitive trust). It weights each follower in the
 * reputation derivation (docs/reputation-curation.md). Sybil-resistant: fresh
 * accounts score ~0, so they confer ~0 reputation.
 *
 * Scores come from the remote trust MCP and refresh on its **sync cron** (not
 * real-time), so we cache aggressively at module level + via React Query.
 *
 * Two flavours:
 *   - `fetchEigentrustMap`  → GLOBAL credibility (the reputation v1 weight)
 *   - `fetchGroupTrustMap`  → community/topic-scoped credibility, anchored on
 *     a group of addresses (the DAO/circle lens) — no engine change needed.
 */
import { fetchCompositeScore, fetchPersonalizedTrust } from './mcpTrustService'

// The MCP graph syncs on a cron, so credibility changes slowly → long TTL.
const TTL_MS = 30 * 60 * 1000
// mcpCall has no internal queue and each composite_score triggers a full
// server-side EigenTrust pass, so a high fan-out can stall the engine. Keep it
// gentle — a hung call now also times out (see mcpTrustService).
const MAX_PARALLEL = 3

const globalCache = new Map<string, { score: number; ts: number }>()

// Durable per-address cache. The cold MCP path can take >20s (a full
// server-side EigenTrust pass) and intermittently time out — without
// persistence, every reload re-rolls which followers resolve, so the backer
// count and boost flicker (8 → 3 → …). Persisting per ADDRESS (not per
// follower-set, like the React Query map) means a score we've seen once stays
// put across reloads and set changes; a later timeout reuses it instead of
// regressing to 0. localStorage, best-effort.
const LS_KEY = 'sofia-eigentrust-v1'
let hydrated = false

function hydrate(): void {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return
    const obj = JSON.parse(raw) as Record<string, { score: number; ts: number }>
    for (const [k, v] of Object.entries(obj))
      if (!globalCache.has(k)) globalCache.set(k, v)
  } catch {
    // corrupt/inaccessible storage — ignore, fall back to in-memory only
  }
}

function persist(): void {
  if (typeof window === 'undefined') return
  try {
    const obj: Record<string, { score: number; ts: number }> = {}
    for (const [k, v] of globalCache) obj[k] = v
    window.localStorage.setItem(LS_KEY, JSON.stringify(obj))
  } catch {
    // quota / private-mode — non-fatal, the in-memory cache still works
  }
}

/** Run `fn` over `items` with a bounded number of concurrent workers. */
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let cursor = 0
  const worker = async () => {
    while (cursor < items.length) {
      const idx = cursor++
      out[idx] = await fn(items[idx])
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  )
  return out
}

/** Global credibility (composite score) for one address. 0 when unknown.
 *  The trust engine indexes addresses lowercased, but the indexer hands us
 *  EIP-55 checksummed (mixed-case) addresses — querying mixed-case returns 0.
 *  So we lowercase for the MCP call + cache key. */
export async function fetchEigentrustScore(address: string): Promise<number> {
  hydrate()
  const key = address.toLowerCase()
  const cached = globalCache.get(key)
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.score

  // `fetchCompositeScore` swallows transient failures and returns null (a real
  // in-graph zero comes back as `{ compositeScore: 0 }`). So null = "no answer"
  // → reuse the last-known score (never regress to 0 on a timeout) and DON'T
  // cache the miss, so a manual reload retries it. Only a real response updates
  // the durable cache.
  const composite = await fetchCompositeScore(key)
  if (composite == null) return cached?.score ?? 0

  const score = composite.compositeScore ?? 0
  globalCache.set(key, { score, ts: Date.now() })
  persist()
  return score
}

/**
 * address → global credibility, cached + concurrency-limited. Returns a plain
 * object (not a Map) so the result survives React Query's localStorage
 * persistence — a Map round-trips to `{}` through JSON. The hook rebuilds a Map.
 */
export async function fetchEigentrustMap(
  addresses: readonly string[],
): Promise<Record<string, number>> {
  const ids = [...new Set(addresses)].filter(Boolean)
  const scores = await mapWithConcurrency(
    ids,
    MAX_PARALLEL,
    fetchEigentrustScore,
  )
  const out: Record<string, number> = {}
  ids.forEach((a, i) => (out[a] = scores[i]))
  return out
}

/**
 * Community/topic-scoped credibility: how much a GROUP of anchors collectively
 * trusts each target (group-anchor mode of `compute_personalized_trust`).
 * - DAO/circle lens → anchors = circle members
 * - Topic lens      → anchors = the topic's credible set
 * Not cached at module level (depends on the anchor set); React Query handles it.
 */
export async function fetchGroupTrustMap(
  anchors: readonly string[],
  targets: readonly string[],
  predicates?: readonly string[],
): Promise<Record<string, number>> {
  const ids = [...new Set(targets)].filter(Boolean)
  if (anchors.length === 0 || ids.length === 0) return {}
  const results = await mapWithConcurrency(ids, MAX_PARALLEL, (target) =>
    fetchPersonalizedTrust(anchors, target, predicates),
  )
  const out: Record<string, number> = {}
  ids.forEach((t, i) => (out[t] = results[i]?.score ?? 0))
  return out
}
