import { describe, expect, it } from 'vitest'
import { formatDuration } from './formatDuration'

describe('formatDuration', () => {
  it.each([
    [0, '0s'],
    [59, '59s'],
    [60, '1m'],
    [120, '2m'],
    [3599, '59m'],
    [3600, '1h'],
    [86_399, '23h'],
    [86_400, '1d'],
    [172_800, '2d'],
  ])('%d → %s', (input, expected) => {
    expect(formatDuration(input)).toBe(expected)
  })
})
