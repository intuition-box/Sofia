/**
 * perspectiveService — data layer for the Compose → Perspective pipeline.
 *
 * The Perspective page compiles a focused feed from a selection of
 * `(circles, topics, mode)`. Circles supply the WHO (member wallets);
 * topics supply the WHAT (filter via "in context of" nested triples).
 *
 * This module owns the network shape: it knows how to translate a
 * wallet+topic spec into a list of certifications, normalises every
 * triple into a `PerspectiveCert`, and stays stateless so the calling
 * hook can React-Query it without surprises.
 *
 * The aggregation across picks (merge / intersect / subtract / contrast)
 * lives in `lib/perspectiveAggregation.ts` — this file only fetches.
 */

import { useGetPerspectiveCertsQuery } from '@0xsofia/graphql'
import { GRAPHQL_URL, PREDICATE_IDS } from '@/config'
import { LABEL_TO_INTENTION } from '@/config/intentions'
import { extractDomain } from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'

/** Predicate ids that count as a "certification" for the Compose pipeline.
 *  Trust/distrust intentionally excluded — those are people-to-people
 *  signals, not URL claims. */
const PERSPECTIVE_PREDICATE_IDS: string[] = [
  PREDICATE_IDS.VISITS_FOR_WORK,
  PREDICATE_IDS.VISITS_FOR_LEARNING,
  PREDICATE_IDS.VISITS_FOR_FUN,
  PREDICATE_IDS.VISITS_FOR_INSPIRATION,
]

export interface PerspectiveCert {
  /** Cert triple term_id. */
  termId: string
  /** Counter (oppose) triple term_id — used for Contrast mode. */
  counterTermId: string
  /** Friendly intention label (e.g. "Work"). Empty string when the
   *  predicate isn't a known visits_for_*. */
  intention: string
  /** Raw predicate label coming back from the indexer. */
  predicateLabel: string
  /** Canonical URL pulled from the object atom's Thing payload. */
  url: string
  /** Display title — atom Thing.name with the atom label as a fallback. */
  title: string
  /** Derived host (e.g. "github.com"). */
  domain: string
  /** Favicon URL — atom image when present, otherwise a domain default. */
  favicon: string
  /** Object atom term_id (the URL/Thing atom). */
  objectTermId: string
  /** Support-side market cap (raw bigint string) — drives Contrast. */
  supportMarketCap: bigint
  /** Counter-side market cap (raw bigint string) — drives Contrast. */
  opposeMarketCap: bigint
  /** Holders on the support vault, summed across curves. */
  supportPositionCount: number
  /** Holders on the counter vault, summed across curves. */
  opposePositionCount: number
  /** Wallet addresses (lowercased) from the input set that hold shares
   *  on the support vault. Drives the "N certifiers in this perspective"
   *  count on the result card. */
  certifierWallets: string[]
}

// ── Internals ──────────────────────────────────────────────────────────

function safeBigInt(v: unknown): bigint {
  if (typeof v === 'bigint') return v
  if (v == null) return 0n
  try {
    return BigInt(v as string | number)
  } catch {
    return 0n
  }
}

function sumVaultStat(
  vaults: Array<{ market_cap?: unknown; position_count?: number }> | undefined,
): { marketCap: bigint; positionCount: number } {
  let marketCap = 0n
  let positionCount = 0
  for (const v of vaults ?? []) {
    marketCap += safeBigInt(v.market_cap)
    positionCount += v.position_count ?? 0
  }
  return { marketCap, positionCount }
}

function normaliseIntention(label: string | null | undefined): string {
  if (!label) return ''
  return LABEL_TO_INTENTION[label.trim().toLowerCase()] ?? ''
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Fetch certifications authored by `wallets`, optionally narrowed to
 * those with an "in context of" nested triple linking to one of
 * `topicAtomIds`. Returns one entry per cert triple — multiple wallets
 * vouching for the same URL collapse into a single row whose
 * `certifierWallets` lists them.
 *
 * No pagination beyond the GraphQL `limit` arg — callers expecting
 * very large circles should chunk their wallet set.
 */
export async function fetchPerspectiveCertifications(
  wallets: string[],
  topicAtomIds: string[] = [],
  limit: number = 500,
): Promise<PerspectiveCert[]> {
  if (wallets.length === 0) return []

  const data = await useGetPerspectiveCertsQuery.fetcher({
    wallets,
    predicateIds: PERSPECTIVE_PREDICATE_IDS,
    limit,
    offset: 0,
  })()

  const lowerWallets = new Set(wallets.map((w) => w.toLowerCase()))
  let certs: PerspectiveCert[] = (data.triples ?? []).map((triple) => {
    const obj = triple.object
    const thing = obj?.value?.thing
    const url = thing?.url ?? ''
    const domain = url ? extractDomain(url) : ''
    const support = sumVaultStat(triple.term?.vaults)
    const oppose = sumVaultStat(triple.counter_term?.vaults)

    // The position list is already filtered server-side to "shares > 0"
    // for our wallets, so every account_id here is a certifier we care
    // about. Lowercased for downstream Set lookups.
    const certifierWallets = (triple.positions ?? [])
      .map((p) => p.account_id?.toLowerCase())
      .filter((id): id is string => !!id && lowerWallets.has(id))

    return {
      termId: triple.term_id,
      counterTermId: triple.counter_term_id,
      intention: normaliseIntention(triple.predicate?.label),
      predicateLabel: triple.predicate?.label ?? '',
      url,
      title: thing?.name || obj?.label || domain || url,
      domain,
      favicon: obj?.image || (domain ? getFaviconUrl(domain) : ''),
      objectTermId: obj?.term_id ?? '',
      supportMarketCap: support.marketCap,
      opposeMarketCap: oppose.marketCap,
      supportPositionCount: support.positionCount,
      opposePositionCount: oppose.positionCount,
      certifierWallets,
    }
  })

  if (topicAtomIds.length > 0 && certs.length > 0) {
    const termIds = certs.map((c) => c.termId)
    const allowed = await fetchCertsInTopics(termIds, topicAtomIds)
    certs = certs.filter((c) => allowed.has(c.termId))
  }

  return certs
}

/** Subset of `certTermIds` that have an "in context of" nested triple
 *  pointing to one of `topicAtomIds`. Returned as a Set for O(1) lookup
 *  in the caller's filter pass. */
async function fetchCertsInTopics(
  certTermIds: string[],
  topicAtomIds: string[],
): Promise<Set<string>> {
  // Reuses the existing GetCertTopicLinks shape but fetched inline so we
  // don't pay the generated-hook overhead for a one-shot raw fetch.
  const query = `
    query CertsInTopics($certTermIds: [String!]!, $topicAtomIds: [String!]!) {
      triples(
        where: {
          predicate: { label: { _eq: "in context of" } }
          subject_id: { _in: $certTermIds }
          object_id: { _in: $topicAtomIds }
        }
        limit: 50000
      ) {
        subject_id
      }
    }
  `
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { certTermIds, topicAtomIds },
    }),
  })
  const json = (await res.json()) as {
    data?: { triples?: Array<{ subject_id?: string }> }
  }
  const allowed = new Set<string>()
  for (const t of json.data?.triples ?? []) {
    if (t.subject_id) allowed.add(t.subject_id)
  }
  return allowed
}
