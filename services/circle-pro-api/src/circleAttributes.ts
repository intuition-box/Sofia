// Group a circle's member-attributes (skills + tools) by member, with the
// endorsement count and whether the caller endorsed each. Pure — unit-tested.
import type { Attribute, MemberAttribute } from '@prisma/client'

export interface MemberAttr {
  /** Id of the (member, attribute) row — the endorse target. */
  memberAttributeId: string
  attributeId: string
  name: string
  color: string | null
  kind: 'SKILL' | 'TOOL'
  /** Endorsement count. */
  count: number
  endorsedByMe: boolean
}

export interface MemberAttrs {
  skills: MemberAttr[]
  tools: MemberAttr[]
}

type Row = MemberAttribute & {
  attribute: Attribute
  endorsements: { endorserWallet: string }[]
}

/** wallet → { skills, tools } (each most-endorsed first). `callerWallet` drives
 *  `endorsedByMe` (pass '' for a guest). */
export function buildMemberAttributes(rows: Row[], callerWallet: string): Map<string, MemberAttrs> {
  const caller = callerWallet.toLowerCase()
  const byWallet = new Map<string, MemberAttrs>()

  for (const r of rows) {
    const w = r.wallet.toLowerCase()
    const bucket = byWallet.get(w) ?? { skills: [], tools: [] }
    const attr: MemberAttr = {
      memberAttributeId: r.id,
      attributeId: r.attributeId,
      name: r.attribute.name,
      color: r.attribute.color,
      kind: r.attribute.kind,
      count: r.endorsements.length,
      endorsedByMe: r.endorsements.some((e) => e.endorserWallet.toLowerCase() === caller),
    }
    ;(attr.kind === 'TOOL' ? bucket.tools : bucket.skills).push(attr)
    byWallet.set(w, bucket)
  }

  for (const b of byWallet.values()) {
    b.skills.sort((a, x) => x.count - a.count)
    b.tools.sort((a, x) => x.count - a.count)
  }
  return byWallet
}
