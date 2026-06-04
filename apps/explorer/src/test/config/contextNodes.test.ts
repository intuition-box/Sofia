import { describe, it, expect } from 'vitest'
import {
  resolveContextAtom,
  contextAtomIdForSlug,
  categoryPills,
} from '@/config/contextNodes'
import { TOPIC_ATOM_IDS, CATEGORY_ATOM_IDS } from '@/config/atomIds'
import { CATEGORY_TO_TOPIC, CATEGORY_BY_ID, TOPIC_BY_ID } from '@/config/taxonomy'

// 'defi' is a category under the 'web3-crypto' topic; 'web-development' under
// 'tech-dev'. These anchor the rollup assertions.
const WEB3_ATOM = TOPIC_ATOM_IDS['web3-crypto']
const DEFI_ATOM = CATEGORY_ATOM_IDS['defi']

describe('resolveContextAtom', () => {
  it('resolves a topic atom to a topic node (slug === topicSlug)', () => {
    expect(resolveContextAtom(WEB3_ATOM)).toEqual({
      slug: 'web3-crypto',
      level: 'topic',
      topicSlug: 'web3-crypto',
    })
  })

  it('resolves a category atom and rolls it up to its parent topic', () => {
    expect(resolveContextAtom(DEFI_ATOM)).toEqual({
      slug: 'defi',
      level: 'category',
      topicSlug: 'web3-crypto',
    })
  })

  it('returns null for an unknown atom', () => {
    expect(resolveContextAtom('0xdeadbeef')).toBeNull()
  })
})

describe('CATEGORY_TO_TOPIC rollup map', () => {
  it('maps each category to its parent topic', () => {
    expect(CATEGORY_TO_TOPIC['defi']).toBe('web3-crypto')
    expect(CATEGORY_TO_TOPIC['web-development']).toBe('tech-dev')
  })
})

describe('contextAtomIdForSlug', () => {
  it('resolves a topic slug to its topic atom', () => {
    expect(contextAtomIdForSlug('web3-crypto')).toBe(WEB3_ATOM)
  })

  it('resolves a category slug to its category atom', () => {
    expect(contextAtomIdForSlug('defi')).toBe(DEFI_ATOM)
  })

  it('returns undefined for an unknown slug', () => {
    expect(contextAtomIdForSlug('not-a-real-slug')).toBeUndefined()
  })
})

describe('categoryPills', () => {
  it('builds pills for category slugs only, with parent topic color + glyph', () => {
    const pills = categoryPills(['web3-crypto', 'defi', 'unknown-slug'])
    expect(pills).toHaveLength(1)
    expect(pills[0]).toEqual({
      id: 'defi',
      label: CATEGORY_BY_ID.get('defi')!.label,
      color: TOPIC_BY_ID.get('web3-crypto')!.color,
      glyphTopicId: 'web3-crypto',
    })
  })

  it('returns an empty array when no slug is a category', () => {
    expect(categoryPills(['web3-crypto', 'tech-dev'])).toEqual([])
  })
})
