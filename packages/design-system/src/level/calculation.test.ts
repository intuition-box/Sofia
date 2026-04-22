import { describe, expect, it } from 'vitest'
import { calculateLevel, calculateLevelProgress, LEVEL_THRESHOLDS } from './calculation'

describe('calculateLevel', () => {
  it('returns level 1 for zero certs', () => {
    expect(calculateLevel(0)).toBe(1)
  })

  it('crosses each threshold exactly', () => {
    LEVEL_THRESHOLDS.forEach((threshold, i) => {
      expect(calculateLevel(threshold)).toBe(i + 1)
    })
  })

  it('stays just below a threshold', () => {
    expect(calculateLevel(2)).toBe(1) // threshold for level 2 is 3
    expect(calculateLevel(6)).toBe(2) // threshold for level 3 is 7
  })

  it('caps at the max level for very large counts', () => {
    expect(calculateLevel(10_000)).toBe(LEVEL_THRESHOLDS.length)
  })

  it('handles negative counts by returning level 1', () => {
    expect(calculateLevel(-5)).toBe(1)
  })
})

describe('calculateLevelProgress', () => {
  it('reports zero progress at a level boundary', () => {
    const p = calculateLevelProgress(3) // exactly the threshold for level 2
    expect(p.level).toBe(2)
    expect(p.currentThreshold).toBe(3)
    expect(p.nextThreshold).toBe(7)
    expect(p.progressPercent).toBe(0)
    expect(p.xpToNextLevel).toBe(4)
  })

  it('reports 100% when stuck at the last threshold', () => {
    const max = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]!
    const p = calculateLevelProgress(max)
    expect(p.level).toBe(LEVEL_THRESHOLDS.length)
    expect(p.xpToNextLevel).toBe(0)
  })

  it('respects a user-provided baseLevel override', () => {
    // Even though count=12 would be level 4, pretend the user confirmed
    // only level 3 on-chain.
    const p = calculateLevelProgress(12, 3)
    expect(p.level).toBe(3)
    expect(p.currentThreshold).toBe(7)
    expect(p.nextThreshold).toBe(12)
  })
})
