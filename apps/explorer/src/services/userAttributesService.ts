/**
 * userAttributesService — reads a user's on-chain skill/tool endorsements
 * from Intuition.
 *
 * An endorsement is a triple `[user account atom] → [is_skilled_in | uses] →
 * [skill/tool atom]`, minted by the Atlas community platform. We resolve the
 * user's account atom, pull every triple it's the subject of under those two
 * predicates, then canonicalise the object label against the shared Atlas
 * taxonomy (`@0xsofia/taxonomy`). The "uses" predicate is a generic ecosystem
 * atom, so anything that doesn't map to a known tool/skill is dropped.
 *
 * `endorserCount` = open positions on the endorsement triple = how many people
 * have backed it — the "real usage" signal.
 */
import { getAddress } from 'viem'
import { GRAPHQL_URL } from '@/config'
import {
  ATTESTATION_TYPES,
  getAttributeByLabel,
  type AttributeCategory,
} from '@0xsofia/taxonomy'

const SKILL_PREDICATE_ID = ATTESTATION_TYPES.SKILL_ENDORSE.termId
const TOOL_PREDICATE_ID = ATTESTATION_TYPES.TOOL_ENDORSE.termId

// The endorsement subject is the user's Account atom. We resolve it by the
// atom's `data` field (which stores the wallet address) + `type: "Account"` —
// the SAME lookup the write path uses (GetAccountAtomByWallet). NOTE: do NOT
// filter by `wallet_id`: the indexer sets that to the atom's minter, which is
// usually a different address than the account holder, so it matches nothing.
// We pass both checksummed and lowercased forms since `data` casing varies.
const GET_USER_ATTRIBUTES = `
  query UserAttributes($addresses: [String!]!, $predicateIds: [String!]!) {
    atoms(
      where: {
        _and: [{ data: { _in: $addresses } }, { type: { _eq: "Account" } }]
      }
    ) {
      as_subject_triples(
        where: { predicate_id: { _in: $predicateIds } }
        limit: 300
      ) {
        term_id
        object {
          label
        }
        term {
          vaults(where: { curve_id: { _eq: "1" } }) {
            position_count
          }
        }
      }
    }
  }
`

export interface UserAttribute {
  /** Taxonomy attribute id (e.g. "engineering", "figma"). */
  id: string
  /** Canonical display label. */
  label: string
  category: AttributeCategory
  /** Open positions backing the endorsement — the "real usage" signal. */
  endorserCount: number
  /** The endorsement triple's term_id — the vault to stake on to endorse. */
  termId: string
}

export interface UserAttributes {
  skills: UserAttribute[]
  tools: UserAttribute[]
}

interface RawTriple {
  term_id?: string | null
  object?: { label?: string | null } | null
  term?: { vaults?: { position_count?: number | null }[] | null } | null
}

interface RawAtom {
  as_subject_triples?: RawTriple[] | null
}

export async function fetchUserAttributes(
  address: string | string[],
): Promise<UserAttributes> {
  // The Account atom's `data` holds the address; match both checksummed and
  // lowercased forms (casing varies in the index). Drop malformed addresses,
  // bail only when nothing valid remains.
  const raw = Array.isArray(address) ? address : [address]
  const variants = new Set<string>()
  for (const a of raw) {
    try {
      const checksummed = getAddress(a)
      variants.add(checksummed)
      variants.add(checksummed.toLowerCase())
    } catch {
      // malformed address — skip
    }
  }
  if (variants.size === 0) return { skills: [], tools: [] }

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: GET_USER_ATTRIBUTES,
      variables: {
        addresses: [...variants],
        predicateIds: [SKILL_PREDICATE_ID, TOOL_PREDICATE_ID],
      },
    }),
  })
  const json = await res.json()
  const atoms: RawAtom[] = json?.data?.atoms ?? []
  const triples: RawTriple[] = atoms.flatMap(
    (a) => a?.as_subject_triples ?? [],
  )


  // Dedupe by attribute id; an attribute endorsed twice keeps the higher count.
  const byId = new Map<string, UserAttribute>()
  for (const triple of triples) {
    const label = triple?.object?.label
    if (!label) continue
    const attr = getAttributeByLabel(label)
    if (!attr) continue // not a recognised skill/tool — drop generic "uses".
    const count = Number(triple?.term?.vaults?.[0]?.position_count ?? 0)
    const termId = triple?.term_id ?? ''
    const existing = byId.get(attr.id)
    if (existing) {
      existing.endorserCount = Math.max(existing.endorserCount, count)
      if (!existing.termId && termId) existing.termId = termId
    } else {
      byId.set(attr.id, {
        id: attr.id,
        label: attr.label,
        category: attr.category,
        endorserCount: count,
        termId,
      })
    }
  }

  const sort = (a: UserAttribute, b: UserAttribute) =>
    b.endorserCount - a.endorserCount || a.label.localeCompare(b.label)
  const all = [...byId.values()]
  return {
    skills: all.filter((a) => a.category === 'skill').sort(sort),
    tools: all.filter((a) => a.category === 'tool').sort(sort),
  }
}
