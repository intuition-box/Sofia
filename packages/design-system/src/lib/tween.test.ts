import { describe, expect, it } from 'vitest'
import { easeOutCubic, tweenValue } from './tween'

describe('tweenValue', () => {
  it('starts at from, lands exactly on to', () => {
    expect(tweenValue(10, 20, 0, 600)).toBe(10)
    expect(tweenValue(10, 20, 600, 600)).toBe(20)
    expect(tweenValue(10, 20, 900, 600)).toBe(20)
  })

  it('counts down as well as up, past the halfway mark at mid-run', () => {
    expect(tweenValue(10, 20, 300, 600)).toBeGreaterThan(15)
    expect(tweenValue(20, 10, 300, 600)).toBeLessThan(15)
  })

  it('jumps when there is no duration', () => {
    expect(tweenValue(1, 5, 0, 0)).toBe(5)
  })

  it('eases within [0, 1]', () => {
    expect(easeOutCubic(-1)).toBe(0)
    expect(easeOutCubic(2)).toBe(1)
  })
})
