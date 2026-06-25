import { describe, expect, test } from 'bun:test'
import { bookmarkKey } from './bookmarkKey'

// bookmarkKey === normalizeUrl (@0xsofia/url-key). THE invariant: the same
// canonical key on the app, the backend and the extension — must not drift.
describe('bookmarkKey (normalizeUrl)', () => {
  test('forces https, lowercases host, drops www, hash and trailing slash', () => {
    expect(bookmarkKey('http://www.Example.com/Path/#section')).toBe('https://example.com/Path')
  })

  test('strips tracking params, keeps real ones', () => {
    expect(bookmarkKey('https://example.com/a?utm_source=x&id=5&fbclid=z')).toBe(
      'https://example.com/a?id=5',
    )
  })

  test('adds the protocol when missing', () => {
    expect(bookmarkKey('example.com/x')).toBe('https://example.com/x')
  })

  test('a bare host has no trailing slash', () => {
    expect(bookmarkKey('https://example.com/')).toBe('https://example.com')
  })

  test('is idempotent (key of a key is the key)', () => {
    const once = bookmarkKey('http://www.Foo.com/Bar/?utm_medium=m#x')
    expect(bookmarkKey(once)).toBe(once)
  })

  test('preserves path case (only the host is lowercased)', () => {
    expect(bookmarkKey('https://example.com/CaseSensitive/Path')).toBe(
      'https://example.com/CaseSensitive/Path',
    )
  })
})
