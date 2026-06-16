import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMemberActivity } from '@/hooks/useMemberActivity'
import type { CircleItem } from '@/services/circleService'
import type { TrustCircleAccount } from '@/services/trustCircleService'

// ── Fixtures ──────────────────────────────────────────────────────
// useMemberActivity is a pure transform over (feedItems, members) — no
// network/hooks to mock. We only populate the fields the hook reads:
// CircleItem.certifierAddress + timestamp, and the member identity fields.

function member(
  overrides: Partial<TrustCircleAccount> & { termId: string; label: string },
): TrustCircleAccount {
  return {
    id: overrides.termId,
    tripleId: overrides.termId,
    image: null,
    walletAddress: undefined,
    trustAmount: 0,
    createdAt: 0,
    ...overrides,
  }
}

function item(certifierAddress: string, timestamp: string): CircleItem {
  return {
    id: `${certifierAddress}-${timestamp}`,
    title: 't',
    url: 'https://x.test',
    domain: 'x.test',
    favicon: '',
    certifier: 'c',
    certifierAddress,
    intentions: [],
    timestamp,
    intentionVaults: {},
    topicContexts: [],
    categorySlugs: [],
  } as unknown as CircleItem
}

const NOW = new Date().toISOString()
const OLD = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60d ago

describe('useMemberActivity', () => {
  it('counts signals per member by certifier wallet (case-insensitive)', () => {
    const members = [
      member({ termId: 'a', label: 'alice', walletAddress: '0xAAA' }),
      member({ termId: 'b', label: 'bob', walletAddress: '0xBBB' }),
    ]
    const items = [item('0xaaa', NOW), item('0xAAA', NOW), item('0xbbb', NOW)]
    const { result } = renderHook(() => useMemberActivity(items, members))
    expect(result.current.signalsByTermId.get('a')).toBe(2)
    expect(result.current.signalsByTermId.get('b')).toBe(1)
  })

  it('reports zero signals for members with no matching feed activity', () => {
    const members = [
      member({ termId: 'a', label: 'alice', walletAddress: '0xAAA' }),
      member({ termId: 'c', label: 'carol', walletAddress: undefined }),
    ]
    const { result } = renderHook(() =>
      useMemberActivity([item('0xzzz', NOW)], members),
    )
    expect(result.current.signalsByTermId.get('a')).toBe(0)
    expect(result.current.signalsForMember(members[1])).toBe(0)
  })

  it('marks a member active only when they have a signal in the last 30 days', () => {
    const members = [
      member({ termId: 'recent', label: 'recent', walletAddress: '0xR' }),
      member({ termId: 'stale', label: 'stale', walletAddress: '0xS' }),
    ]
    const items = [item('0xr', NOW), item('0xs', OLD)]
    const { result } = renderHook(() => useMemberActivity(items, members))
    expect(result.current.isActive(members[0])).toBe(true)
    expect(result.current.isActive(members[1])).toBe(false)
  })

  it('ranks members by signal count desc, then label asc', () => {
    const members = [
      member({ termId: 'low', label: 'zed', walletAddress: '0x1' }),
      member({ termId: 'high', label: 'amy', walletAddress: '0x2' }),
      member({ termId: 'tieB', label: 'bea', walletAddress: '0x3' }),
      member({ termId: 'tieA', label: 'ada', walletAddress: '0x4' }),
    ]
    const items = [
      item('0x2', NOW),
      item('0x2', NOW),
      item('0x2', NOW), // amy: 3
      item('0x1', NOW), // zed: 1
      item('0x3', NOW), // bea: 1
      item('0x4', NOW), // ada: 1
    ]
    const { result } = renderHook(() => useMemberActivity(items, members))
    const order = result.current.ranked.map((m) => m.label)
    // amy(3) first; the three 1-count members break ties alphabetically.
    expect(order).toEqual(['amy', 'ada', 'bea', 'zed'])
  })
})
