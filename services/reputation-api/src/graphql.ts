// GraphQL bootstrap + candidate enumeration.
//
// The generated `@0xsofia/graphql` fetchers read a module-global endpoint set
// once via `configureClient` — we point it at the Intuition indexer at boot so
// the per-candidate profile fetch (profile.ts) can reuse the exact same queries
// the explorer uses. Candidate enumeration itself is a raw query (mirrors
// group-api's src/indexer.ts): a backend-only sweep the codegen consumers never
// need.
import { configureClient } from '@0xsofia/graphql'
import { env } from './env'

let booted = false

/** Point the shared GraphQL client at the indexer. Idempotent. */
export function ensureGraphqlConfigured(): void {
  if (booted) return
  configureClient({ apiUrl: env.indexerUrl })
  booted = true
}

// Predicate labels Sofia treats as "certifications" — mirrors
// userOnChainProfileService.CERT_PREDICATE_LABELS, including the legacy
// trailing-space variant that still appears on old on-chain data.
export const CERT_PREDICATE_LABELS = [
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

const ENUM_PAGE_SIZE = 500
const ENUM_MAX_PAGES = 200 // 100k cert triples cap — far past the alpha set

const CERT_AUTHORS_QUERY = `
  query CertAuthors($labels: [String!]!, $limit: Int!, $offset: Int!) {
    triples(
      where: { predicate: { label: { _in: $labels } } }
      limit: $limit
      offset: $offset
      order_by: { term_id: asc }
    ) {
      positions(where: { shares: { _gt: "0" } }) {
        account_id
      }
    }
  }
`

type CertAuthorsRow = { positions?: { account_id?: string | null }[] }

/**
 * Every account that holds a position on at least one certification triple —
 * the candidate set for the leaderboard (these are the only accounts with a
 * non-zero derived reputation). Returns lowercased addresses, deduped.
 *
 * Pages over all cert triples and unions their stakers. At alpha scale this is
 * a few hundred accounts; the ENUM_MAX_PAGES cap is a runaway backstop.
 */
export async function enumerateCandidates(): Promise<string[]> {
  ensureGraphqlConfigured()
  const out = new Set<string>()

  for (let page = 0; page < ENUM_MAX_PAGES; page++) {
    const res = await fetch(env.indexerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: CERT_AUTHORS_QUERY,
        variables: {
          labels: [...CERT_PREDICATE_LABELS],
          limit: ENUM_PAGE_SIZE,
          offset: page * ENUM_PAGE_SIZE,
        },
      }),
    })
    if (!res.ok) throw new Error(`enumerateCandidates: HTTP ${res.status}`)
    const json = (await res.json()) as { data?: { triples?: CertAuthorsRow[] } }
    const rows = json.data?.triples ?? []
    for (const row of rows) {
      for (const p of row.positions ?? []) {
        if (p.account_id) out.add(p.account_id.toLowerCase())
      }
    }
    if (rows.length < ENUM_PAGE_SIZE) break
  }

  return [...out]
}
