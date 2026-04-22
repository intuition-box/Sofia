import { describe, expect, it } from 'vitest'
import {
  INTENTION_CONFIG,
  CERTIFICATION_COLORS,
  INTENTION_COLORS_BY_LABEL,
  displayLabelToIntentionType,
  getIntentionBadge,
  getIntentionColor,
  getSideColor,
  intentionBadgeStyle,
  type IntentionType,
} from './intentions'

describe('INTENTION_CONFIG shape', () => {
  const canonical: IntentionType[] = [
    'trusted',
    'distrusted',
    'work',
    'learning',
    'fun',
    'inspiration',
    'buying',
    'music',
  ]

  it('covers exactly the 8 canonical types', () => {
    expect(Object.keys(INTENTION_CONFIG).sort()).toEqual([...canonical].sort())
  })

  it('vivid proto palette is the source of truth', () => {
    expect(INTENTION_CONFIG.trusted.color).toBe('#22C55E')
    expect(INTENTION_CONFIG.work.color).toBe('#3B82F6')
    expect(INTENTION_CONFIG.learning.color).toBe('#06B6D4')
    expect(INTENTION_CONFIG.music.color).toBe('#FF5722')
  })

  it('derives CERTIFICATION_COLORS from INTENTION_CONFIG', () => {
    for (const type of canonical) {
      expect(CERTIFICATION_COLORS[type]).toBe(INTENTION_CONFIG[type].color)
    }
  })
})

describe('displayLabelToIntentionType', () => {
  it('maps each canonical label back to its type', () => {
    for (const [type, cfg] of Object.entries(INTENTION_CONFIG)) {
      expect(displayLabelToIntentionType(cfg.label)).toBe(type)
    }
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(displayLabelToIntentionType('  WORK  ')).toBe('work')
    expect(displayLabelToIntentionType('learning')).toBe('learning')
    expect(displayLabelToIntentionType('Trusted')).toBe('trusted')
  })

  it('returns null for unknown labels (including quest: prefixes)', () => {
    expect(displayLabelToIntentionType('quest:first-trust')).toBeNull()
    expect(displayLabelToIntentionType('')).toBeNull()
    expect(displayLabelToIntentionType('something else')).toBeNull()
  })
})

describe('getIntentionBadge', () => {
  it('accepts an IntentionType directly', () => {
    expect(getIntentionBadge('work')).toEqual({ label: 'Work', color: '#3B82F6' })
  })

  it('strips for_ prefix from IntentionPurpose', () => {
    expect(getIntentionBadge('for_learning')).toEqual({
      label: 'Learning',
      color: '#06B6D4',
    })
  })

  it('returns null for unknown / empty input', () => {
    expect(getIntentionBadge(undefined)).toBeNull()
    expect(getIntentionBadge('')).toBeNull()
    expect(getIntentionBadge('nonexistent')).toBeNull()
  })
})

describe('color helpers', () => {
  it('getIntentionColor falls back on an unknown type', () => {
    expect(getIntentionColor('work')).toBe('#3B82F6')
    expect(getIntentionColor('nonexistent')).toBe('#888888')
  })

  it('getSideColor maps support/oppose to trusted/distrusted', () => {
    expect(getSideColor('support')).toBe(INTENTION_CONFIG.trusted.color)
    expect(getSideColor('oppose')).toBe(INTENTION_CONFIG.distrusted.color)
  })

  it('intentionBadgeStyle builds tint + border style', () => {
    const s = intentionBadgeStyle('#112233')
    expect(s.backgroundColor).toBe('#11223320')
    expect(s.border).toBe('1px solid #11223340')
  })
})

describe('INTENTION_COLORS_BY_LABEL', () => {
  it('includes canonical labels + extras', () => {
    expect(INTENTION_COLORS_BY_LABEL.Work).toBe('#3B82F6')
    expect(INTENTION_COLORS_BY_LABEL.Attending).toBe('#6DC4A8')
    expect(INTENTION_COLORS_BY_LABEL.Valued).toBe('#E0A06A')
    expect(INTENTION_COLORS_BY_LABEL['is following']).toBe('#6DC4A8')
  })
})
