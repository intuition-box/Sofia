/**
 * perspectiveAggregation — pure combinators that compile a per-pick
 * `PerspectiveCert[]` map into a single ranked list, one entry per URL.
 *
 * The four modes (merge / intersect / subtract / contrast) all share
 * the same shape: collapse certs by URL (one row per object atom),
 * then keep / drop / sort according to mode-specific rules.
 *
 * Lives in `lib/` rather than `services/` because it has zero I/O —
 * it's a pure transform over already-fetched data, easy to reason
 * about and reuse from other surfaces (e.g. a future CLI replay).
 */

import type { PerspectiveCert } from '@/services/perspectiveService'

export type AggregationMode = 'merge' | 'intersect' | 'subtract' | 'contrast'

/** Per-pick certs. `pickKey` is the caller's circle id or topic id —
 *  opaque to this module, used only for ordering (Subtract picks the
 *  first key as the "base") and counting (Intersect requires every
 *  pick). Insertion order matters: callers MUST insert picks in the
 *  semantic order they want surfaced. */
export type CertsByPick = Map<string, PerspectiveCert[]>

/** Combined result row — one per URL (object atom). Carries enough
 *  metadata for the Perspective card UI to render without re-querying. */
export interface AggregatedCert {
  /** Object atom term_id — the row's unique key. */
  objectTermId: string
  url: string
  title: string
  domain: string
  favicon: string
  /** Unique intention labels observed across the underlying cert
   *  triples (e.g. ["Work", "Learning"] when different members tagged
   *  the same URL with different visits_for_* predicates). */
  intentions: string[]
  /** Sum of every contributing cert's support-side market cap. */
  totalSupportMarketCap: bigint
  /** Sum of every contributing cert's oppose-side market cap. */
  totalOpposeMarketCap: bigint
  /** Sum of holders on the support vaults. */
  totalSupportHolders: number
  /** Sum of holders on the oppose vaults. */
  totalOpposeHolders: number
  /** Union of the wallets (from the input picks) that hold shares on
   *  this URL's support vault. Drives the "N certifiers in this
   *  perspective" badge. */
  certifierWallets: string[]
  /** Picks (keys from the input map) that surfaced this URL. */
  contributingPicks: string[]
  /** Per-pick stake snapshot — feeds the Contrast score. */
  perPick: Array<{
    pickKey: string
    /** `supportMarketCap − opposeMarketCap` summed across cert
     *  triples for this URL inside the pick. Negative = pick leans
     *  against this URL on average. */
    netSignal: bigint
    holders: number
  }>
  /** Only populated for Contrast mode — range of `netSignal` across
   *  picks. The bigger, the more the picks disagree on this URL. */
  contrastScore?: bigint
}

// ── Internals ──────────────────────────────────────────────────────────

function uniqueAppend<T>(arr: T[], values: Iterable<T>): T[] {
  const seen = new Set(arr)
  const out = [...arr]
  for (const v of values) {
    if (!seen.has(v)) {
      seen.add(v)
      out.push(v)
    }
  }
  return out
}

/** Bucket every cert by its object atom — one bucket = one URL row in
 *  the final list. Returns the buckets keyed by objectTermId plus a
 *  reverse index from objectTermId → set of pickKeys that touched it. */
function bucketByObject(certsByPick: CertsByPick): {
  byObject: Map<string, AggregatedCert>
  picksWithObject: Map<string, Set<string>>
} {
  const byObject = new Map<string, AggregatedCert>()
  const picksWithObject = new Map<string, Set<string>>()

  for (const [pickKey, certs] of certsByPick) {
    /** Inner per-pick accumulator so the per-pick stats (netSignal,
     *  holders) reflect ALL contributing certs for this URL inside
     *  this single pick — not just the first one we hit. */
    const perPickAgg = new Map<string, { netSignal: bigint; holders: number }>()

    for (const cert of certs) {
      const objId = cert.objectTermId
      if (!objId) continue

      // Reverse index — used by Intersect & Subtract.
      if (!picksWithObject.has(objId)) {
        picksWithObject.set(objId, new Set())
      }
      picksWithObject.get(objId)!.add(pickKey)

      // Global bucket — merge counts across every pick.
      let bucket = byObject.get(objId)
      if (!bucket) {
        bucket = {
          objectTermId: objId,
          url: cert.url,
          title: cert.title,
          domain: cert.domain,
          favicon: cert.favicon,
          intentions: cert.intention ? [cert.intention] : [],
          totalSupportMarketCap: cert.supportMarketCap,
          totalOpposeMarketCap: cert.opposeMarketCap,
          totalSupportHolders: cert.supportPositionCount,
          totalOpposeHolders: cert.opposePositionCount,
          certifierWallets: [...cert.certifierWallets],
          contributingPicks: [],
          perPick: [],
        }
        byObject.set(objId, bucket)
      } else {
        bucket.totalSupportMarketCap += cert.supportMarketCap
        bucket.totalOpposeMarketCap += cert.opposeMarketCap
        bucket.totalSupportHolders += cert.supportPositionCount
        bucket.totalOpposeHolders += cert.opposePositionCount
        if (cert.intention && !bucket.intentions.includes(cert.intention)) {
          bucket.intentions.push(cert.intention)
        }
        bucket.certifierWallets = uniqueAppend(
          bucket.certifierWallets,
          cert.certifierWallets,
        )
      }

      // Per-pick accumulator update — `perPick` is finalised after the
      // pick loop so we never emit duplicate (pickKey) entries.
      const prev = perPickAgg.get(objId) ?? { netSignal: 0n, holders: 0 }
      prev.netSignal += cert.supportMarketCap - cert.opposeMarketCap
      prev.holders += cert.supportPositionCount
      perPickAgg.set(objId, prev)
    }

    // Flush this pick's per-object aggregates into the buckets.
    for (const [objId, agg] of perPickAgg) {
      const bucket = byObject.get(objId)
      if (!bucket) continue
      bucket.contributingPicks.push(pickKey)
      bucket.perPick.push({
        pickKey,
        netSignal: agg.netSignal,
        holders: agg.holders,
      })
    }
  }

  return { byObject, picksWithObject }
}

function compareBigInt(a: bigint, b: bigint): number {
  if (a === b) return 0
  return a > b ? 1 : -1
}

function bigintAbs(v: bigint): bigint {
  return v < 0n ? -v : v
}

function bigintRange(values: bigint[]): bigint {
  if (values.length === 0) return 0n
  let min = values[0]
  let max = values[0]
  for (const v of values) {
    if (v < min) min = v
    if (v > max) max = v
  }
  return max - min
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Run the Compose-mode combinator against pre-fetched per-pick certs.
 * Stable ordering across calls:
 *   - merge:     by total support market cap (desc)
 *   - intersect: by total support market cap (desc), restricted to
 *                URLs present in every pick
 *   - subtract:  by total support market cap (desc), restricted to
 *                URLs in the first pick that no other pick has
 *   - contrast:  by `contrastScore` (desc) — range of per-pick net
 *                signals — restricted to URLs touched by 2+ picks
 */
export function aggregatePerspective(
  certsByPick: CertsByPick,
  mode: AggregationMode,
): AggregatedCert[] {
  const { byObject, picksWithObject } = bucketByObject(certsByPick)
  const totalPicks = certsByPick.size
  const pickOrder = [...certsByPick.keys()]
  const firstPick = pickOrder[0]

  const all = [...byObject.values()]

  switch (mode) {
    case 'merge':
      return all.sort((a, b) =>
        compareBigInt(b.totalSupportMarketCap, a.totalSupportMarketCap),
      )

    case 'intersect':
      return all
        .filter((c) => picksWithObject.get(c.objectTermId)?.size === totalPicks)
        .sort((a, b) =>
          compareBigInt(b.totalSupportMarketCap, a.totalSupportMarketCap),
        )

    case 'subtract': {
      if (!firstPick) return []
      const otherPicks = pickOrder.slice(1)
      return all
        .filter((c) => {
          const picks = picksWithObject.get(c.objectTermId)
          if (!picks?.has(firstPick)) return false
          return otherPicks.every((p) => !picks.has(p))
        })
        .sort((a, b) =>
          compareBigInt(b.totalSupportMarketCap, a.totalSupportMarketCap),
        )
    }

    case 'contrast':
      return all
        .filter((c) => c.contributingPicks.length >= 2)
        .map((c) => {
          const values = c.perPick.map((p) => p.netSignal)
          // Treat picks that didn't touch this URL as a 0 net signal —
          // a URL that one pick strongly supports while another never
          // engaged is still divergent for our purposes.
          const allPickValues =
            c.perPick.length < totalPicks
              ? [...values, ...Array(totalPicks - c.perPick.length).fill(0n)]
              : values
          return { ...c, contrastScore: bigintRange(allPickValues) }
        })
        .filter((c) => bigintAbs(c.contrastScore ?? 0n) > 0n)
        .sort((a, b) =>
          compareBigInt(b.contrastScore ?? 0n, a.contrastScore ?? 0n),
        )

    default:
      return []
  }
}
