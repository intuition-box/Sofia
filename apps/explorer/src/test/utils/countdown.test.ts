import { describe, expect, it } from 'vitest'
import { countdown } from '@/utils/formatting'

const MIN = 60_000

describe('countdown', () => {
  it('days and hours when more than a day is left', () => {
    expect(countdown((3 * 1440 + 4 * 60 + 30) * MIN, 0)).toBe('3d 4h')
  })

  it('hours and minutes within the day', () => {
    expect(countdown((5 * 60 + 12) * MIN, 0)).toBe('5h 12m')
  })

  it('minutes at the end, never negative', () => {
    expect(countdown(12 * MIN, 0)).toBe('12m')
    expect(countdown(0, MIN)).toBe('0m')
  })
})
