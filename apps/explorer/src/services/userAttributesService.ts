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

// The endorsement subject is the user's account atom, looked up by `wallet_id`
// (stored EIP-55 checksummed — a lowercased address matches nothing).
const GET_USER_ATTRIBUTES = `
  query UserAttributes($address: String!, $predicateIds: [String!]!) {
    atoms(where: { wallet_id: { _eq: $address } }) {
      as_subject_triples(
        where: { predicate_id: { _in: $predicateIds } }
        limit: 300
      ) {
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
}

export interface UserAttributes {
  skills: UserAttribute[]
  tools: UserAttribute[]
}

interface RawTriple {
  object?: { label?: string | null } | null
  term?: { vaults?: { position_count?: number | null }[] | null } | null
}

interface RawAtom {
  as_subject_triples?: RawTriple[] | null
}

export async function fetchUserAttributes(
  address: string,
): Promise<UserAttributes> {
  // wallet_id is checksummed on-chain; bail on a malformed address.
  let checksummed: string
  try {
    checksummed = getAddress(address)
  } catch {
    return { skills: [], tools: [] }
  }

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: GET_USER_ATTRIBUTES,
      variables: {
        address: checksummed,
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
    const existing = byId.get(attr.id)
    if (existing) {
      existing.endorserCount = Math.max(existing.endorserCount, count)
    } else {
      byId.set(attr.id, {
        id: attr.id,
        label: attr.label,
        category: attr.category,
        endorserCount: count,
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
