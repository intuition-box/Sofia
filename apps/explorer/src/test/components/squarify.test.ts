import { describe, it, expect } from 'vitest'

import { squarify, type SquarifyItem } from '@/components/circles/squarify'

interface Topic extends SquarifyItem {
  slug: string
}

const TOPICS: Topic[] = [
  { slug: 'a', value: 6 },
  { slug: 'b', value: 6 },
  { slug: 'c', value: 4 },
  { slug: 'd', value: 3 },
  { slug: 'e', value: 2 },
  { slug: 'f', value: 1 },
]

const W = 1040
const H = 388

describe('squarify', () => {
  it('emits exactly one cell per input item, preserving fields', () => {
    const cells = squarify(TOPICS, 0, 0, W, H)
    expect(cells).toHaveLength(TOPICS.length)
    // Every input slug is present exactly once.
    const slugs = cells.map((c) => c.slug).sort()
    expect(slugs).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
    // Original `value` field carried through; internal `area` stripped.
    for (const c of cells) {
      expect(typeof c.value).toBe('number')
      expect('area' in c).toBe(false)
    }
  })

  it('cell areas sum to the box area (W*H) within float tolerance', () => {
    const cells = squarify(TOPICS, 0, 0, W, H)
    const totalArea = cells.reduce((s, c) => s + c.w * c.h, 0)
    expect(totalArea).toBeCloseTo(W * H, 4)
  })

  it('sizes each cell proportionally to its value', () => {
    const cells = squarify(TOPICS, 0, 0, W, H)
    const totalValue = TOPICS.reduce((s, t) => s + t.value, 0)
    const scale = (W * H) / totalValue
    for (const c of cells) {
      expect(c.w * c.h).toBeCloseTo(c.value * scale, 2)
    }
  })

  it('keeps every cell inside the box bounds', () => {
    const X = 12
    const Y = 20
    const cells = squarify(TOPICS, X, Y, W, H)
    for (const c of cells) {
      expect(c.x).toBeGreaterThanOrEqual(X - 1e-6)
      expect(c.y).toBeGreaterThanOrEqual(Y - 1e-6)
      expect(c.x + c.w).toBeLessThanOrEqual(X + W + 1e-6)
      expect(c.y + c.h).toBeLessThanOrEqual(Y + H + 1e-6)
      expect(c.w).toBeGreaterThan(0)
      expect(c.h).toBeGreaterThan(0)
    }
  })

  it('produces non-overlapping cells (pairwise area-intersection is zero)', () => {
    const cells = squarify(TOPICS, 0, 0, W, H)
    const overlap = (
      a: (typeof cells)[number],
      b: (typeof cells)[number],
    ): number => {
      const ox = Math.max(
        0,
        Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x),
      )
      const oy = Math.max(
        0,
        Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y),
      )
      return ox * oy
    }
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        expect(overlap(cells[i], cells[j])).toBeCloseTo(0, 3)
      }
    }
  })

  it('returns an empty layout for degenerate input', () => {
    expect(squarify([], 0, 0, W, H)).toEqual([])
    expect(squarify(TOPICS, 0, 0, 0, H)).toEqual([])
    expect(squarify(TOPICS, 0, 0, W, 0)).toEqual([])
    expect(squarify([{ value: 0 }], 0, 0, W, H)).toEqual([])
  })

  it('lays out a single item as the whole box', () => {
    const cells = squarify([{ slug: 'solo', value: 5 }], 0, 0, W, H)
    expect(cells).toHaveLength(1)
    expect(cells[0].w).toBeCloseTo(W, 6)
    expect(cells[0].h).toBeCloseTo(H, 6)
  })
})
