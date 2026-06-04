import { describe, it, expect } from 'vitest'
import { computeChipsShown } from './chipOverflow'

describe('computeChipsShown', () => {
  it('shows nothing for an empty set', () => {
    expect(computeChipsShown([])).toBe(0)
  })

  it('shows every chip when they all fit on one line', () => {
    expect(computeChipsShown([0, 0, 0])).toBe(3)
    expect(computeChipsShown([4, 4, 4, 4])).toBe(4)
  })

  it('reserves one slot for the +N badge when a chip wraps', () => {
    // chips 0,1 on line 0; chip 2 wraps to line 1 → firstLine=2 → show 2-1=1
    expect(computeChipsShown([0, 0, 18, 18])).toBe(1)
  })

  it('never drops below one visible chip even when only one fits', () => {
    // only chip 0 fits → firstLine=1 → Math.max(1, 1-1)=1
    expect(computeChipsShown([0, 18, 18])).toBe(1)
  })

  it('keeps the full set when overflow starts exactly past the last chip', () => {
    // all share the first line → firstLine stays = total → show all
    expect(computeChipsShown([0, 0, 0, 0, 0])).toBe(5)
  })

  it('tolerates sub-pixel jitter on the first line (≤1px is same line)', () => {
    // 0.5px difference must not be read as a wrap
    expect(computeChipsShown([0, 0.5, 1])).toBe(3)
  })

  it('detects the first wrap and reserves a slot regardless of later rows', () => {
    // 6 chips: 0,1,2 on line 0; 3,4,5 on line 1 → firstLine=3 → show 3-1=2
    expect(computeChipsShown([0, 0, 0, 20, 20, 20])).toBe(2)
  })

  it('returns 1 for a single chip', () => {
    expect(computeChipsShown([0])).toBe(1)
  })
})
