/**
 * userOnChainProfileService — single-source-of-truth fetcher for the
 * authenticated user's on-chain profile.
 *
 * One paginated query (`GetUserCertsAlltime`) pulls every cert triple
 * the user holds shares on. A second batch query resolves the
 * `in context of <topic>` nested triples for those certs in one round
 * trip. The output is a flat, derive-from-anywhere shape:
 *
 *   - `certs`              — every UserCert (paginated alltime)
 *   - `topicContextsByTerm` — Map<certTermId, topicAtomIds[]>
 *
 * Selectors (calendar, radar, topic counts, discovery badges, top
 * platforms…) live in pure derivers and consume this once. Callers
 * should always read through `useUserOnChainProfile` so React Query
 * dedupes the fetch across panels.
 */

import { getAddress } from 'viem'
import {
  useGetUserCertsAlltimeQuery,
  useGetCertTopicLinksQuery,
  useGetUserContextAdditionsQuery,
  type GetUserCertsAlltimeQuery,
} from '@0xsofia/graphql'
import { CONTEXT_TERM_IDS } from '@/config/atomIds'
import { resolveContextAtom } from '@/config/contextNodes'

type RawCertTriple = NonNullable<GetUserCertsAlltimeQuery['triples']>[number]

const PAGE_SIZE = 200
const MAX_PAGES = 100 // 20 000 certs cap — far past any real user
const TOPIC_LINKS_LIMIT = 50_000

// Predicate labels Sofia treats as "certifications" for the profile.
// Includes the legacy trailing-space variant that still appears on old data.
const CERT_PREDICATE_LABELS = [
  'visits for work',
  'visits for learning',
  'visits for learning ', // legacy trailing space
  'visits for fun',
  'visits for inspiration',
  'visits for buying',
  'visits for music',
  'trusts',
  'distrust',
] as const

export interface UserCert {
  /** Cert triple term_id. */
  termId: string
  /** Counter term_id (oppose side), used for downstream redeem flows. */
  counterTermId: string
  /** Predicate label, e.g. `"visits for work"`. */
  intention: string
  /** Predicate term_id — for downstream label/intention lookups. */
  predicateTermId: string
  /** Object atom term_id (the URL atom). */
  objectTermId: string
  /** Display label / domain of the object. */
  objectLabel: string
  /** Full URL when the object exposes one (new-style atoms only). */
  objectUrl: string
  /** Total certifiers on the positive side (shares > 0). */
  certifierCount: number
  /** User's own shares on this cert (sum across linked wallets). */
  userShares: bigint
  /** Earliest position timestamp the user has on this cert. */
  certifiedAt: string
  /** Context atom term_ids resolved via "in context of" nested triples
   *  (topic OR category atoms). */
  topicAtomIds: string[]
  /** Rolled-up topic slugs — a category context contributes its parent
   *  topic, so this drives all topic-keyed scoring/display unchanged. */
  topicSlugs: string[]
  /** Precise context slugs (topic slugs for topic tags, category slugs for
   *  category tags) — for granular display and the picker's applied set. */
  contextSlugs: string[]
}

/**
 * One context-addition event: the user attached a topic to one of their
 * cert triples via an `"in context of"` nested triple. `addedAt` is the
 * user's earliest position timestamp on that nested triple — i.e. the
 * moment the tag was first staked.
 */
export interface ContextAddition {
  /** Cert triple term_id this context was attached to. */
  certTermId: string
  /** The context triple's OWN support vault term_id — the vault a "like"
   *  stakes. Reputation reads the stakers (likers) here, per topic. */
  contextTermId: string
  /** The context triple's oppose vault term_id (a "dislike"). */
  contextCounterTermId: string
  /** Context atom term_id (the tag itself — a topic or category atom). */
  topicAtomId: string
  /** Rolled-up topic slug (parent topic for a category tag), or `""`. */
  topicSlug: string
  /** Precise context slug (topic or category), or `""` if unknown. */
  contextSlug: string
  /** ISO timestamp of the user's first share on the nested triple. */
  addedAt: string
  /** The tagged cert's object URL — carried from the `subject.term.triple`
   *  join so a context added to ANOTHER user's cert (not in the viewer's
   *  own `certs`) can still render a row. `""` when the indexer returns
   *  no url. */
  objectUrl: string
  /** The tagged cert's object label / domain. `""` when unknown. */
  objectLabel: string
}

export interface UserOnChainProfile {
  certs: UserCert[]
  /** Map<certTermId, topicAtomIds[]> for raw consumers. */
  topicContextsByTerm: Map<string, string[]>
  /** Context additions the user staked on, ordered newest-first. */
  contextAdditions: ContextAddition[]
}

const EMPTY_PROFILE: UserOnChainProfile = {
  certs: [],
  topicContextsByTerm: new Map(),
  contextAdditions: [],
}

export async function fetchUserOnChainProfile(
  addresses: readonly string[],
): Promise<UserOnChainProfile> {
  if (addresses.length === 0) return EMPTY_PROFILE

  // Pass both checksum and lowercase casings — the indexer is inconsistent
  // across deposit emitters. Same dual-case fix used by discovery and the
  // useOnChainIntentionGroups patch.
  const checksum = addresses.map((a) => getAddress(a))
  const lower = addresses.map((a) => a.toLowerCase())
  const userAddresses = Array.from(new Set([...checksum, ...lower]))

  // Step 1 — paginate all the user's cert triples.
  const rawTriples: RawCertTriple[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await useGetUserCertsAlltimeQuery.fetcher({
      userAddresses,
      predicateLabels: [...CERT_PREDICATE_LABELS],
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    })()
    const pageRows = data.triples ?? []
    rawTriples.push(...pageRows)
    if (pageRows.length < PAGE_SIZE) break
  }
  // Step 2 — resolve "in context of" nested triples for every cert, and
  // in parallel the subset the user actually staked on (with timestamps).
  //
  // GetUserContextAdditions is NOT gated on the user having their own certs:
  // the user can tag someone else's cert, and that addition should surface
  // in Last Activity even if rawTriples is empty. Run it unconditionally.
  const certTermIds = rawTriples
    .map((t) => t.term_id)
    .filter((x): x is string => !!x)

  const topicContextsByTerm = new Map<string, string[]>()
  const contextAdditions: ContextAddition[] = []

  // Fetch additions unconditionally — scoped only by the user's positions,
  // not by their own certs. Fetch cert topic links only if they have certs.
  const [linkData, additionData] = await Promise.all([
    certTermIds.length > 0
      ? useGetCertTopicLinksQuery.fetcher({
          certTermIds,
          topicAtomIds: CONTEXT_TERM_IDS,
          limit: TOPIC_LINKS_LIMIT,
        })()
      : Promise.resolve({ triples: [] }),
    useGetUserContextAdditionsQuery.fetcher({
      userAddresses,
      topicAtomIds: CONTEXT_TERM_IDS,
      limit: TOPIC_LINKS_LIMIT,
    })(),
  ])

  {

    for (const row of linkData.triples ?? []) {
      const certTermId = row.subject_id
      const topicAtomId = row.object_id
      if (!certTermId || !topicAtomId) continue
      const list = topicContextsByTerm.get(certTermId)
      if (list) list.push(topicAtomId)
      else topicContextsByTerm.set(certTermId, [topicAtomId])
    }

    for (const row of additionData.triples ?? []) {
      const certTermId = row.subject_id
      const topicAtomId = row.object_id
      const addedAt = row.positions?.[0]?.created_at ?? ''
      if (!certTermId || !topicAtomId || !addedAt) continue
      const node = resolveContextAtom(topicAtomId)
      const certObject = row.subject?.term?.triple?.object
      contextAdditions.push({
        certTermId,
        contextTermId: row.term_id ?? '',
        contextCounterTermId: row.counter_term_id ?? '',
        topicAtomId,
        topicSlug: node?.topicSlug ?? '',
        contextSlug: node?.slug ?? '',
        addedAt: String(addedAt),
        objectUrl: certObject?.value?.thing?.url ?? '',
        objectLabel: certObject?.label ?? '',
      })
    }
    contextAdditions.sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1))
  }

  // If the user has no certs of their own, return now — we still captured
  // any contextAdditions above (tags on others' certs).
  if (rawTriples.length === 0) {
    return { certs: [], topicContextsByTerm, contextAdditions }
  }

  // Normalise into UserCert.
  const certs: UserCert[] = rawTriples.map((t) => {
    const termId = t.term_id ?? ''
    const topicAtomIds = topicContextsByTerm.get(termId) ?? []
    // Roll category contexts up to their parent topic for `topicSlugs`
    // (drives scoring/donut/feed), while keeping the precise slug in
    // `contextSlugs` for granular display + the picker's applied set.
    const topicSet = new Set<string>()
    const contextSlugs: string[] = []
    for (const id of topicAtomIds) {
      const node = resolveContextAtom(id)
      if (!node) continue
      contextSlugs.push(node.slug)
      if (node.topicSlug) topicSet.add(node.topicSlug)
    }
    const topicSlugs = [...topicSet]
    let userShares = 0n
    let certifiedAt = ''
    for (const p of t.positions ?? []) {
      try {
        userShares += BigInt(p.shares ?? '0')
      } catch {
        // ignore malformed
      }
      const ts = p.created_at ?? ''
      if (ts && (!certifiedAt || ts < certifiedAt)) certifiedAt = ts
    }
    return {
      termId,
      counterTermId: t.counter_term_id ?? '',
      intention: t.predicate?.label ?? '',
      predicateTermId: t.predicate?.term_id ?? '',
      objectTermId: t.object?.term_id ?? '',
      objectLabel: t.object?.label ?? '',
      objectUrl: t.object?.value?.thing?.url ?? '',
      certifierCount: t.positions_aggregate?.aggregate?.count ?? 0,
      userShares,
      certifiedAt,
      topicAtomIds,
      topicSlugs,
      contextSlugs,
    }
  })

  return { certs, topicContextsByTerm, contextAdditions }
}

// ---------------------------------------------------------------------------
// Derived selectors
// ---------------------------------------------------------------------------

/**
 * Pioneer / Explorer / Contributor buckets, derived from a UserCert list.
 *
 *   - Pioneer:     1 certifier total  (the user is the only holder)
 *   - Explorer:    2-10 certifiers
 *   - Contributor: 11+ certifiers
 *
 * Dedupe is keyed by `objectTermId` (the URL atom) — a single page only
 * counts toward one bucket no matter how many intentions the user has
 * stacked on it. Order is preserved from the input (alltime newest-first
 * after the standard sort).
 */
export interface DiscoveryBuckets {
  pioneer: UserCert[]
  explorer: UserCert[]
  contributor: UserCert[]
}

export function computeDiscoveryBuckets(
  certs: readonly UserCert[],
): DiscoveryBuckets {
  const buckets: DiscoveryBuckets = {
    pioneer: [],
    explorer: [],
    contributor: [],
  }
  const seen = new Set<string>()
  for (const cert of certs) {
    if (!cert.objectTermId || seen.has(cert.objectTermId)) continue
    seen.add(cert.objectTermId)
    const n = cert.certifierCount
    if (n <= 1) buckets.pioneer.push(cert)
    else if (n <= 10) buckets.explorer.push(cert)
    else buckets.contributor.push(cert)
  }
  return buckets
}
