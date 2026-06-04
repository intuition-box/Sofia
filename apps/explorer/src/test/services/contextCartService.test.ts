import { describe, it, expect } from 'vitest'
import {
  buildContextCartItem,
  buildContextCartItems,
  contextCartId,
} from '@/services/contextCartService'
import {
  TOPIC_ATOM_IDS,
  CATEGORY_ATOM_IDS,
  IN_CONTEXT_OF_PREDICATE_ID,
} from '@/config/atomIds'

const CERT = '0xcert'
const base = {
  certTermId: CERT,
  certTitle: 'Example',
  certFavicon: 'fav.png',
}

describe('buildContextCartItem', () => {
  it('mints a topic context triple (object = topic atom)', () => {
    const item = buildContextCartItem({
      ...base,
      topicSlug: 'web3-crypto',
      topicLabel: 'Web3',
      topicColor: '#6dd4a0',
    })
    expect(item).toMatchObject({
      id: contextCartId(CERT, 'web3-crypto'),
      kind: 'create-triple',
      side: 'support',
      subjectId: CERT,
      predicateId: IN_CONTEXT_OF_PREDICATE_ID,
      objectId: TOPIC_ATOM_IDS['web3-crypto'],
    })
  })

  it('mints a category context triple (object = category atom)', () => {
    const item = buildContextCartItem({
      ...base,
      topicSlug: 'defi',
      topicLabel: 'DeFi',
      topicColor: '#6dd4a0',
    })
    expect(item?.objectId).toBe(CATEGORY_ATOM_IDS['defi'])
    expect(item?.id).toBe(contextCartId(CERT, 'defi'))
  })

  it('returns null for an unknown slug', () => {
    expect(
      buildContextCartItem({
        ...base,
        topicSlug: 'not-a-real-slug',
        topicLabel: 'Nope',
        topicColor: '#000',
      }),
    ).toBeNull()
  })

  it('returns null when the cert term id is missing', () => {
    expect(
      buildContextCartItem({
        certTermId: '',
        certTitle: 'x',
        topicSlug: 'web3-crypto',
        topicLabel: 'Web3',
        topicColor: '#6dd4a0',
      }),
    ).toBeNull()
  })
})

describe('buildContextCartItems', () => {
  it('builds one item per known slug and drops unknown ones', () => {
    const items = buildContextCartItems(CERT, 'Example', undefined, [
      { slug: 'web3-crypto', label: 'Web3', color: '#6dd4a0' },
      { slug: 'defi', label: 'DeFi', color: '#6dd4a0' },
      { slug: 'ghost-slug', label: 'Ghost', color: '#000' },
    ])
    expect(items).toHaveLength(2)
    expect(items.map((i) => i.objectId)).toEqual([
      TOPIC_ATOM_IDS['web3-crypto'],
      CATEGORY_ATOM_IDS['defi'],
    ])
  })
})
