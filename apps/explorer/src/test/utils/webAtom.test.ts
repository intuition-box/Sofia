import { describe, it, expect } from 'vitest'
import {
  normalizePageUrl,
  resolveWebKey,
  urlVariants,
  webAtomUrl,
} from '@/utils/webAtom'
import { PLATFORM_ATOM_IDS } from '@/config/atomIds'

describe('normalizePageUrl', () => {
  it('drops protocol, www, trailing slash and tracking params', () => {
    expect(normalizePageUrl('https://www.YouTube.com/')).toBe('youtube.com')
    expect(normalizePageUrl('http://youtube.com')).toBe('youtube.com')
    expect(
      normalizePageUrl(
        'https://www.youtube.com/watch?v=abc&si=xyz&utm_source=x',
      ),
    ).toBe('youtube.com/watch?v=abc')
    expect(normalizePageUrl('https://example.com/a/b/')).toBe('example.com/a/b')
  })

  it('keeps the hash (SPA routes) and rejects non-http values', () => {
    expect(normalizePageUrl('https://app.example/#/markets/1')).toBe(
      'app.example/#/markets/1',
    )
    expect(normalizePageUrl('null')).toBe('')
    expect(normalizePageUrl('ipfs://cid')).toBe('')
  })
})

describe('resolveWebKey', () => {
  it('uses value.thing.url, then an URL label (old atoms)', () => {
    expect(
      resolveWebKey({
        label: 'Post',
        value: { thing: { url: 'https://www.example.com/post/' } },
      }),
    ).toBe('example.com/post')
    expect(
      resolveWebKey({ label: 'https://example.com/post', value: null }),
    ).toBe('example.com/post')
  })

  it('treats the "null" url string as missing', () => {
    expect(
      resolveWebKey({ label: 'Developers', value: { thing: { url: 'null' } } }),
    ).toBeNull()
  })

  it('resolves a Sofia platform atom by term_id, whatever its URL', () => {
    expect(
      resolveWebKey({
        term_id: PLATFORM_ATOM_IDS.notion,
        label: 'Notion',
        value: { thing: { url: 'https://www.notion.com' } },
      }),
    ).toBe('notion.so')
  })

  it('matches exact platform labels only when the atom has no URL', () => {
    expect(resolveWebKey({ label: 'YouTube', value: null })).toBe('youtube.com')
    expect(resolveWebKey({ label: 'youtube.com', value: null })).toBe(
      'youtube.com',
    )
    // Same label, URL elsewhere → that URL, not the platform.
    expect(
      resolveWebKey({
        label: 'YouTube',
        value: { thing: { url: 'https://en.wikipedia.org/wiki/YouTube' } },
      }),
    ).toBe('en.wikipedia.org/wiki/youtube')
    expect(resolveWebKey({ label: 'YouTube fans', value: null })).toBeNull()
  })
})

describe('webAtomUrl / urlVariants', () => {
  it('returns the http URL an atom stores', () => {
    expect(webAtomUrl({ label: 'x', value: { thing: { url: 'null' } } })).toBe(
      '',
    )
    expect(webAtomUrl({ label: 'https://a.b', value: null })).toBe(
      'https://a.b',
    )
  })

  it('lists exact protocol / www / slash variants', () => {
    const v = urlVariants('youtube.com')
    expect(v).toHaveLength(8)
    expect(v).toContain('https://www.youtube.com/')
    expect(v).toContain('http://youtube.com')
    expect(urlVariants('platform:google')).toEqual([])
  })
})
