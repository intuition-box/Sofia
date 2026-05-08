/**
 * Shared account-search primitives for Intuition.
 *
 * `searchAccounts` is a plain async function — apps wrap it in their own
 * React state if needed. Uses the same `fetcher` transport as every other
 * generated query in this package, so it picks up `configureClient`'s
 * apiUrl exactly the same way.
 */
import { fetcher } from '../client'

export interface AccountAtom {
  /** Atom term id — same value as `id` for Account atoms. */
  id: string
  /** Display label (handle/ENS/email/etc., resolved by the indexer). */
  label: string
  /** Term id used for vault lookups. */
  termId: string
  /** Atom subtype string (e.g. "Account"). */
  atomType: string
  /** Wallet address backing this Account atom (checksummed). */
  data?: string
  /** Avatar URL (ENS/social). */
  image?: string
  /** ISO timestamp. */
  createdAt: string
  /** Atom creator address. */
  creatorId: string
  /** IPFS URI used by triple-creation flows (mirrors `data` for Accounts). */
  ipfsUri?: string
}

interface RawAtom {
  term_id: string
  label?: string
  type?: string
  created_at?: string
  creator_id?: string
  data?: string
  image?: string
}

// Match label OR wallet `data` field — covers both ENS/handle searches and
// raw 0x… address pasting.
const SEARCH_QUERY = `
  query SearchAccountAtoms($searchTerm: String!) {
    atoms(
      where: {
        _and: [
          { type: { _eq: "Account" } }
          {
            _or: [
              { label: { _ilike: $searchTerm } }
              { data: { _ilike: $searchTerm } }
            ]
          }
        ]
      }
      limit: 20
    ) {
      term_id
      label
      type
      created_at
      creator_id
      data
      image
    }
  }
`

const mapAtom = (atom: RawAtom): AccountAtom => ({
  id: atom.term_id,
  label: atom.label || 'Unknown',
  termId: atom.term_id,
  atomType: atom.type || 'Account',
  createdAt: atom.created_at || '',
  creatorId: atom.creator_id || '',
  data: atom.data,
  image: atom.image,
  ipfsUri: atom.data,
})

/**
 * One-shot search: query the indexer for Account atoms whose label matches
 * `query` (case-insensitive substring). Returns up to 20 matches.
 *
 * Standalone callable so non-React code (services, hooks composing it) can
 * reuse the same wire shape.
 */
export async function searchAccounts(query: string): Promise<AccountAtom[]> {
  const trimmed = query.trim()
  if (!trimmed) return []
  try {
    const run = fetcher<{ atoms: RawAtom[] }, { searchTerm: string }>(
      SEARCH_QUERY,
      { searchTerm: `%${trimmed}%` },
    )
    const data = await run()
    return (data?.atoms || []).map(mapAtom)
  } catch {
    return []
  }
}
