import { describe, expect, test } from 'vitest'
import { localTaxonomyHints } from './taxonomyHints'

describe('localTaxonomyHints', () => {
  test('returns taxonomy tag hints matching the query', () => {
    const hints = localTaxonomyHints('web')
    expect(hints.length).toBeGreaterThan(0)
    expect(hints.every((h) => h.type === 'tag')).toBe(true)
    expect(hints.some((h) => /web/i.test(h.label))).toBe(true)
  })

  test('empty / blank query → no hints', () => {
    expect(localTaxonomyHints('')).toHaveLength(0)
    expect(localTaxonomyHints('   ')).toHaveLength(0)
  })

  test('respects the limit', () => {
    expect(localTaxonomyHints('a', 3).length).toBeLessThanOrEqual(3)
  })

  test('each hint carries a value (slug) and a color', () => {
    const [first] = localTaxonomyHints('design')
    expect(first?.value).toBeTruthy()
    expect(first?.color).toBeTruthy()
  })
})
