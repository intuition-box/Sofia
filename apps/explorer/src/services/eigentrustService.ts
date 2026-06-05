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
  const key = address.toLowerCase()
  const cached = globalCache.get(key)
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.score
  try {
    const composite = await fetchCompositeScore(key)
    const score = composite?.compositeScore ?? 0
    globalCache.set(key, { score, ts: Date.now() })
    return score
  } catch {
    // Transient MCP failure (timeout / rate-limit). A single throw must NOT
    // reject the whole eigentrust map — that would zero out the boost for
    // every topic at once (the "sometimes it shows, sometimes not" bug).
    // Contribute 0 for now and DON'T cache the miss, so the next pass retries.
    return 0
  }
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
