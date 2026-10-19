// Per-candidate on-chain profile fetch — the reputation-scoring inputs.
//
// A trimmed backend port of the explorer's
// apps/explorer/src/services/userOnChainProfileService.ts: it pulls only the
// two things the scoring compute needs — the account's cert triples (with their
// rolled-up topic slugs + own timestamp) and the `in context of` additions the
// account staked. Same three generated queries the explorer uses, so the data
// matches exactly.
import { getAddress } from 'viem'
import {
  useGetUserCertsAlltimeQuery,
  useGetCertTopicLinksQuery,
  useGetUserContextAdditionsQuery,
} from '@0xsofia/graphql'
import {
  CONTEXT_TERM_IDS,
  resolveContextAtom,
  TOPIC_TERM_IDS,
  ATOM_ID_TO_TOPIC,
} from '@0xsofia/taxonomy'
import { env } from './env'
import { ensureGraphqlConfigured, CERT_PREDICATE_LABELS } from './graphql'

const PAGE_SIZE = 200
const MAX_PAGES = 100 // 20 000 certs cap — far past any real account
const CONTEXT_LIMIT = 50_000

/** Minimal cert shape consumed by `buildReputationClaims` + cert counting. */
export interface ProfileCert {
  termId: string
  /** Predicate label, e.g. "visits for work" / "trusts" / "distrust" — drives
   *  the general vs trust/distrust vs topic cert-count split. */
  intention: string
  /** The account's earliest position timestamp on this cert (ISO). */
  certifiedAt: string
  /** Rolled-up topic slugs (category tags roll up to their parent topic). */
  topicSlugs: string[]
}

/** Minimal context-addition shape consumed by `buildReputationClaims`. */
export interface ProfileContextAddition {
  contextTermId: string
  addedAt: string
  topicSlug: string
}

export interface CandidateProfile {
  certs: ProfileCert[]
  contextAdditions: ProfileContextAddition[]
  /** Topic slugs the account staked a raw topic atom on ("interests"). */
  ownedTopics: string[]
}

const EMPTY: CandidateProfile = {
  certs: [],
  contextAdditions: [],
  ownedTopics: [],
}

const OWNED_TOPICS_QUERY = `
  query OwnedTopics($accounts: [String!]!, $topicIds: [String!]!) {
    positions(
      where: {
        account_id: { _in: $accounts }
        term_id: { _in: $topicIds }
        shares: { _gt: "0" }
      }
    ) {
      term_id
    }
  }
`

/** Topic slugs the account holds a position on among the raw topic atoms —
 *  the indexer equivalent of the explorer's `useAddressInterests` on-chain
 *  read. */
async function fetchOwnedTopics(userAddresses: string[]): Promise<string[]> {
  const res = await fetch(env.indexerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: OWNED_TOPICS_QUERY,
      variables: { accounts: userAddresses, topicIds: TOPIC_TERM_IDS },
    }),
  })
  if (!res.ok) return []
  const json = (await res.json()) as {
    data?: { positions?: { term_id?: string | null }[] }
  }
  const slugs = new Set<string>()
  for (const p of json.data?.positions ?? []) {
    const slug = p.term_id ? ATOM_ID_TO_TOPIC.get(p.term_id) : undefined
    if (slug) slugs.add(slug)
  }
  return [...slugs]
}

/**
 * Fetch one account's reputation inputs. `address` is a single wallet; we query
 * both its checksummed and lowercased casings because the indexer stores
 * account_ids inconsistently across deposit emitters (same fix the explorer
 * applies).
 */
export async function fetchCandidateProfile(
  address: string,
): Promise<CandidateProfile> {
  ensureGraphqlConfigured()

  const userAddresses = Array.from(
    new Set([getAddress(address), address.toLowerCase()]),
  )

  // Step 1 — paginate the account's cert triples.
  const rawTriples: {
    term_id?: string | null
    predicate?: { label?: string | null } | null
    positions?: { created_at?: string | null }[] | null
  }[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await useGetUserCertsAlltimeQuery.fetcher({
      userAddresses,
      predicateLabels: [...CERT_PREDICATE_LABELS],
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    })()
    const rows = data.triples ?? []
    rawTriples.push(...rows)
    if (rows.length < PAGE_SIZE) break
  }

  const certTermIds = rawTriples
    .map((t) => t.term_id)
    .filter((x): x is string => !!x)

  // Step 2 — topic links for the account's certs, the additions it staked,
  // and its raw topic-atom "interests" — all in parallel.
  const [linkData, additionData, ownedTopics] = await Promise.all([
    certTermIds.length > 0
      ? useGetCertTopicLinksQuery.fetcher({
          certTermIds,
          topicAtomIds: CONTEXT_TERM_IDS,
          limit: CONTEXT_LIMIT,
        })()
      : Promise.resolve({ triples: [] }),
    useGetUserContextAdditionsQuery.fetcher({
      userAddresses,
      topicAtomIds: CONTEXT_TERM_IDS,
      limit: CONTEXT_LIMIT,
    })(),
    fetchOwnedTopics(userAddresses),
  ])

  if (
    rawTriples.length === 0 &&
    (additionData.triples ?? []).length === 0 &&
    ownedTopics.length === 0
  ) {
    return EMPTY
  }

  // certTermId → rolled-up topic slugs, from the "in context of" links.
  const topicSlugsByCert = new Map<string, Set<string>>()
  for (const row of linkData.triples ?? []) {
    const certTermId = row.subject_id
    const node = resolveContextAtom(row.object_id ?? '')
    if (!certTermId || !node?.topicSlug) continue
    const set = topicSlugsByCert.get(certTermId) ?? new Set<string>()
    set.add(node.topicSlug)
    topicSlugsByCert.set(certTermId, set)
  }

  const certs: ProfileCert[] = rawTriples.map((t) => {
    const termId = t.term_id ?? ''
    let certifiedAt = ''
    for (const p of t.positions ?? []) {
      const ts = p.created_at ?? ''
      if (ts && (!certifiedAt || ts < certifiedAt)) certifiedAt = ts
    }
    return {
      termId,
      intention: t.predicate?.label ?? '',
      certifiedAt,
      topicSlugs: [...(topicSlugsByCert.get(termId) ?? [])],
    }
  })

  const contextAdditions: ProfileContextAddition[] = []
  for (const row of additionData.triples ?? []) {
    const node = resolveContextAtom(row.object_id ?? '')
    const addedAt = row.positions?.[0]?.created_at ?? ''
    if (!row.term_id || !node?.topicSlug || !addedAt) continue
    contextAdditions.push({
      contextTermId: row.term_id,
      addedAt: String(addedAt),
      topicSlug: node.topicSlug,
    })
  }

  return { certs, contextAdditions, ownedTopics }
}
