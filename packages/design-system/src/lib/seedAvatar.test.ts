import { describe, expect, it } from 'vitest'
import { seedAvatarDataUri, seedAvatarSvg } from './seedAvatar'

describe('seedAvatar', () => {
  it('is deterministic for a seed', () => {
    expect(seedAvatarSvg('0xabc')).toBe(seedAvatarSvg('0xabc'))
  })

  it('differs between seeds', () => {
    expect(seedAvatarSvg('0xabc')).not.toBe(seedAvatarSvg('0xabd'))
  })

  it('falls back on an empty seed and yields an svg data URI', () => {
    expect(seedAvatarSvg('')).toBe(seedAvatarSvg('unknown'))
    expect(seedAvatarDataUri('0xabc')).toMatch(
      /^data:image\/svg\+xml;utf8,%3Csvg/,
    )
  })
})
