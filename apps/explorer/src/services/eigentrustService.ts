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
import {
  fetchCompositeScore,
  fetchPersonalizedTrust,
} from './mcpTrustService'

// The MCP graph syncs on a cron, so credibility changes slowly → long TTL.
const TTL_MS = 30 * 60 * 1000
// mcpCall has no internal queue; cap our own fan-out to be gentle.
const MAX_PARALLEL = 6

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

/** Global credibility (composite score) for one address. 0 when unknown. */
export async function fetchEigentrustScore(address: string): Promise<number> {
  const cached = globalCache.get(address)
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.score
  const composite = await fetchCompositeScore(address)
  const score = composite?.compositeScore ?? 0
  globalCache.set(address, { score, ts: Date.now() })
  return score
}

/** Map address → global credibility, cached + concurrency-limited. */
export async function fetchEigentrustMap(
  addresses: readonly string[],
): Promise<Map<string, number>> {
  const ids = [...new Set(addresses)].filter(Boolean)
  const scores = await mapWithConcurrency(
    ids,
    MAX_PARALLEL,
    fetchEigentrustScore,
  )
  const map = new Map<string, number>()
  ids.forEach((a, i) => map.set(a, scores[i]))
  return map
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
): Promise<Map<string, number>> {
  const ids = [...new Set(targets)].filter(Boolean)
  if (anchors.length === 0 || ids.length === 0) return new Map()
  const results = await mapWithConcurrency(ids, MAX_PARALLEL, (target) =>
    fetchPersonalizedTrust(anchors, target, predicates),
  )
  const map = new Map<string, number>()
  ids.forEach((t, i) => map.set(t, results[i]?.score ?? 0))
  return map
}
