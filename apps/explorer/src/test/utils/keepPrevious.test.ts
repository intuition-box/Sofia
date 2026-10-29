import { describe, expect, it } from 'vitest'
import { keepPreviousIfSame } from '@/utils/keepPrevious'

describe('keepPreviousIfSame', () => {
  const keep = keepPreviousIfSame(1, '0xabc')

  it('keeps the previous data for the same owner', () => {
    expect(keep([1, 2], { queryKey: ['h', '0xabc', 'old'] })).toEqual([1, 2])
  })

  it('never shows another owner’s data', () => {
    expect(keep([1, 2], { queryKey: ['h', '0xdef', 'old'] })).toBeUndefined()
    expect(keep(undefined, undefined)).toBeUndefined()
  })
})
