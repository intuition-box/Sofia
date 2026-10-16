import { describe, it, expect } from 'vitest'
import { sharesForPercent } from '@/services/redeemService'

describe('sharesForPercent', () => {
  it('returns every share for a full exit', () => {
    expect(sharesForPercent(1001n, 100)).toBe(1001n)
  })
  it('rounds partial exits down', () => {
    expect(sharesForPercent(1001n, 50)).toBe(500n)
    expect(sharesForPercent(1001n, 25)).toBe(250n)
  })
})
