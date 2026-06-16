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

import { getAddress } from 'viem'
import {
  useGetPerspectiveCertsQuery,
  useCertsInTopicsQuery,
  type GetPerspectiveCertsQuery,
} from '@0xsofia/graphql'
import { LABEL_TO_INTENTION } from '@/config/intentions'
import { extractDomain } from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'

/** Predicate labels that count as a "certification" for the Compose
 *  pipeline. Label-based filtering instead of id-based so Music and
 *  Buying are included (their predicate IDs aren't in
 *  `config.PREDICATE_IDS` because they were added later, and the old
 *  id-based filter silently dropped every Music/Buying cert).
 *  Trust/distrust intentionally excluded — those are people-to-people
 *  signals, not URL claims. */
const PERSPECTIVE_PREDICATE_LABELS: string[] = [
  'visits for work',
  'visits for learning',
  'visits for learning ', // legacy trailing-space variant
  'visits for fun',
  'visits for inspiration',
  'visits for buying',
  'visits for music',
]

/** Page size for the alltime loop. Bumped from the legacy 500 cap so
 *  a circle's full cert history fits in 1-2 pages on first call. */
const PAGE_SIZE = 1000

/** Safety cap on the loop — 50 pages × 1000 = 50 000 certs, far past
 *  any plausible circle size today. */
const MAX_PAGES = 50

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
 * Paginates the indexer alltime — calls the query in a loop until a
 * short page comes back. Previously hard-capped to 500 rows per
 * circle which silently dropped the long tail on large trust
 * circles.
 */
export async function fetchPerspectiveCertifications(
  wallets: string[],
  topicAtomIds: string[] = [],
): Promise<PerspectiveCert[]> {
  if (wallets.length === 0) return []

  // The Intuition indexer stores account ids in EIP-55 checksum case;
  // a lowercase `_in` filter silently matches nothing. Checksum the
  // wallet list before the network call, and keep a lowercase mirror
  // for the client-side certifier filter below.
  const checksumWallets: string[] = []
  for (const w of wallets) {
    try {
      checksumWallets.push(getAddress(w))
    } catch {
      // Skip non-address strings rather than throw — keeps the rest of
      // the selection compilable when one circle member has a bad id.
    }
  }
  if (checksumWallets.length === 0) return []

  // Alltime loop — fetch pages until the indexer returns less than a
  // full page or we hit the safety cap.
  const rawTriples: GetPerspectiveCertsQuery['triples'] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await useGetPerspectiveCertsQuery.fetcher({
      wallets: checksumWallets,
      predicateLabels: PERSPECTIVE_PREDICATE_LABELS,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    })()
    const rows = data.triples ?? []
    rawTriples.push(...rows)
    if (rows.length < PAGE_SIZE) break
  }

  const lowerWallets = new Set(wallets.map((w) => w.toLowerCase()))
  let certs: PerspectiveCert[] = rawTriples.map((triple) => {
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
  const data = await useCertsInTopicsQuery.fetcher({
    certTermIds,
    topicAtomIds,
  })()
  const allowed = new Set<string>()
  for (const t of data.triples ?? []) {
    if (t.subject_id) allowed.add(t.subject_id)
  }
  return allowed
}
