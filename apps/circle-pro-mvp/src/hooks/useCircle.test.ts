// resolveCircleId — the active-workspace resolution: stored pick if still a
// member, else first real circle, else the default fallback.
import { describe, it, expect } from 'bun:test'
import { resolveCircleId } from './useCircle'

const circles = [
  { groupTermId: '0xaaa', role: 'OWNER' },
  { groupTermId: '0xbbb', role: 'MEMBER' },
]

describe('resolveCircleId', () => {
  it('keeps the stored pick when still a member', () => {
    expect(resolveCircleId(circles, '0xbbb', 'fallback')).toBe('0xbbb')
  })

  it('falls to the first real circle when the stored pick is gone', () => {
    expect(resolveCircleId(circles, '0xZZZ', 'fallback')).toBe('0xaaa')
  })

  it('falls to the first real circle when nothing is stored', () => {
    expect(resolveCircleId(circles, null, 'fallback')).toBe('0xaaa')
  })

  it('uses the fallback when the caller belongs to no circle', () => {
    expect(resolveCircleId([], '0xaaa', 'fallback')).toBe('fallback')
    expect(resolveCircleId([], null, 'fallback')).toBe('fallback')
  })
})
