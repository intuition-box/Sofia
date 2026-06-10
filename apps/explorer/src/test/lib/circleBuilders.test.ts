import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { buildTrustCircle, buildGroupCircle } from '@/lib/circleBuilders'
import type { TrustCircleAccount } from '@/services/trustCircleService'
import type { GroupEntry, GroupMembership } from '@/services/groupsService'

// ── Fixtures ──
function member(opts: {
  termId: string
  label?: string
  wallet?: string | null
}): TrustCircleAccount {
  return {
    id: opts.termId,
    termId: opts.termId,
    tripleId: `${opts.termId}-triple`,
    label: opts.label ?? opts.termId,
    image: null,
    walletAddress: opts.wallet === null ? undefined : opts.wallet,
    trustAmount: 1,
    createdAt: 0,
  }
}

function membership(opts: {
  termId: string
  label?: string
  wallet?: string | null
}): GroupMembership {
  return {
    tripleTermId: `${opts.termId}-mtriple`,
    member: {
      termId: opts.termId,
      label: opts.label ?? opts.termId,
      image: null,
      description: '',
      walletAddress: opts.wallet === undefined ? null : opts.wallet,
    },
    createdAt: '2026-01-01T00:00:00Z',
  }
}

function group(opts: {
  termId?: string
  label?: string
  description?: string
  createdAt?: string
  memberships: GroupMembership[]
}): GroupEntry {
  return {
    termId: opts.termId ?? 'g1',
    label: opts.label ?? 'A Group',
    image: null,
    description: opts.description ?? '',
    url: '',
    memberCount: opts.memberships.length,
    createdAt: opts.createdAt ?? '',
    memberships: opts.memberships,
  }
}

describe('buildTrustCircle', () => {
  it('produces a trust-kind, always-joined circle with sensible defaults', () => {
    const circle = buildTrustCircle([], [])
    expect(circle.id).toBe('trust')
    expect(circle.kind).toBe('trust')
    expect(circle.isMember).toBe(true)
    expect(circle.name).toBe('Trust Circle')
    expect(circle.joinAction).toBeUndefined()
  })

  it('unions linked wallets and member wallets into a lowercased address set', () => {
    const circle = buildTrustCircle(
      ['0xABCDEF0000000000000000000000000000000001'],
      [
        member({
          termId: 'm1',
          wallet: '0xBEEF000000000000000000000000000000000002',
        }),
      ],
    )
    expect(circle.addresses).toEqual([
      '0xabcdef0000000000000000000000000000000001',
      '0xbeef000000000000000000000000000000000002',
    ])
  })

  it('dedupes when a linked wallet is also a trusted member', () => {
    const shared = '0xAAAA000000000000000000000000000000000003'
    const circle = buildTrustCircle(
      [shared],
      [member({ termId: 'm1', wallet: shared })],
    )
    expect(circle.addresses).toEqual([shared.toLowerCase()])
  })

  it('skips members without a wallet address', () => {
    const circle = buildTrustCircle(
      [],
      [member({ termId: 'm1', wallet: null })],
    )
    expect(circle.addresses).toEqual([])
    // The member is still kept in the roster even without a wallet.
    expect(circle.members).toHaveLength(1)
  })

  it('honours explicit name/description/color overrides', () => {
    const circle = buildTrustCircle([], [], {
      name: 'My Crew',
      description: 'custom',
      color: '#123456',
    })
    expect(circle.name).toBe('My Crew')
    expect(circle.description).toBe('custom')
    expect(circle.color).toBe('#123456')
  })
})

describe('buildGroupCircle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-06T00:00:00Z')) // 5 days after fixtures
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('maps memberships to roster + lowercased deduped addresses', () => {
    const circle = buildGroupCircle(
      group({
        memberships: [
          membership({
            termId: 'a',
            wallet: '0xAAA0000000000000000000000000000000000001',
          }),
          membership({
            termId: 'b',
            wallet: '0xBBB0000000000000000000000000000000000002',
          }),
        ],
      }),
      [],
    )
    expect(circle.kind).toBe('group')
    expect(circle.members.map((m) => m.termId)).toEqual(['a', 'b'])
    expect(circle.addresses).toEqual([
      '0xaaa0000000000000000000000000000000000001',
      '0xbbb0000000000000000000000000000000000002',
    ])
  })

  it('dedupes a member claimed twice so the feed query is not bloated', () => {
    const wallet = '0xCCC0000000000000000000000000000000000003'
    const circle = buildGroupCircle(
      group({
        memberships: [
          membership({ termId: 'a', wallet }),
          membership({ termId: 'a-dup', wallet }),
        ],
      }),
      [],
    )
    expect(circle.addresses).toEqual([wallet.toLowerCase()])
  })

  it('flags isMember true when a linked wallet matches a member (case-insensitive)', () => {
    const wallet = '0xDDD0000000000000000000000000000000000004'
    const circle = buildGroupCircle(
      group({ memberships: [membership({ termId: 'a', wallet })] }),
      [wallet.toUpperCase()], // linked wallet differs only by case
    )
    expect(circle.isMember).toBe(true)
    expect(circle.joinAction).toBeUndefined()
  })

  it('flags isMember false and emits a joinAction when no wallet matches', () => {
    const circle = buildGroupCircle(
      group({
        termId: 'group-xyz',
        memberships: [
          membership({
            termId: 'a',
            wallet: '0xEEE0000000000000000000000000000000000005',
          }),
        ],
      }),
      ['0xFFF0000000000000000000000000000000000006'],
    )
    expect(circle.isMember).toBe(false)
    expect(circle.joinAction).toEqual({ atomTermId: 'group-xyz' })
  })

  it('defaults trustAmount and createdAt to neutral values per member', () => {
    const circle = buildGroupCircle(
      group({ memberships: [membership({ termId: 'a', wallet: '0xabc' })] }),
      [],
    )
    expect(circle.members[0].trustAmount).toBe(0)
    expect(circle.members[0].createdAt).toBe(0)
  })

  it('takes the first topic color, falling back to the group default', () => {
    const memberships = [membership({ termId: 'a', wallet: '0xabc' })]
    const withTopic = buildGroupCircle(
      group({ memberships }),
      [],
      [{ id: 't', label: 'Tech', color: '#abcdef' }],
    )
    const noTopic = buildGroupCircle(group({ memberships }), [])
    expect(withTopic.color).toBe('#abcdef')
    expect(noTopic.color).toBe('var(--ds-accent, #e87c7c)')
  })

  it('renders a relative createdAgo from a timestamp, empty when absent', () => {
    const memberships = [membership({ termId: 'a', wallet: '0xabc' })]
    const dated = buildGroupCircle(
      group({ memberships, createdAt: '2026-01-01T00:00:00Z' }),
      [],
    )
    const undated = buildGroupCircle(group({ memberships, createdAt: '' }), [])
    expect(dated.createdAgo).toBe('5d ago') // clock pinned 5 days later
    expect(undated.createdAgo).toBe('')
  })
})
