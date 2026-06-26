// buildMemberAttributes — group member skills/tools with endorsement counts.
import { describe, it, expect } from 'bun:test'
import { buildMemberAttributes } from './circleAttributes'

const attr = (id: string, kind: 'SKILL' | 'TOOL', name: string) => ({
  id,
  circleId: 'c1',
  kind,
  name,
  color: '#fff',
  createdAt: new Date(),
})

const row = (
  id: string,
  wallet: string,
  a: ReturnType<typeof attr>,
  endorsers: string[],
) => ({
  id,
  circleId: 'c1',
  wallet,
  attributeId: a.id,
  attribute: a,
  createdAt: new Date(),
  endorsements: endorsers.map((endorserWallet) => ({ endorserWallet })),
})

describe('buildMemberAttributes', () => {
  it('splits skills/tools per member with counts + endorsedByMe', () => {
    const rows = [
      row('ma1', '0xAlice', attr('a1', 'SKILL', 'ZK'), ['0xbob', '0xCAL']),
      row('ma2', '0xalice', attr('a2', 'TOOL', 'Figma'), ['0xbob']),
    ]
    const map = buildMemberAttributes(rows, '0xcal')
    const alice = map.get('0xalice')!
    expect(alice.skills).toHaveLength(1)
    expect(alice.tools).toHaveLength(1)
    expect(alice.skills[0]).toMatchObject({ name: 'ZK', count: 2, endorsedByMe: true })
    expect(alice.tools[0]).toMatchObject({ name: 'Figma', count: 1, endorsedByMe: false })
  })

  it('sorts by endorsement count desc within a kind', () => {
    const rows = [
      row('m1', '0xa', attr('s1', 'SKILL', 'A'), ['0x1']),
      row('m2', '0xa', attr('s2', 'SKILL', 'B'), ['0x1', '0x2', '0x3']),
    ]
    const { skills } = buildMemberAttributes(rows, '')!.get('0xa')!
    expect(skills.map((s) => s.name)).toEqual(['B', 'A'])
  })

  it('guest (empty caller) → endorsedByMe always false', () => {
    const rows = [row('m1', '0xa', attr('s1', 'SKILL', 'A'), ['0x1'])]
    expect(buildMemberAttributes(rows, '').get('0xa')!.skills[0].endorsedByMe).toBe(false)
  })
})
