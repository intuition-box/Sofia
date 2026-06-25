// buildActivity — merge shares + comments into one newest-first feed. Pure.
import { describe, it, expect } from 'bun:test'
import { buildActivity } from './circleActivity'

const prof = (wallet: string, handle: string) => ({
  wallet,
  handle,
  displayName: handle,
  avatarSeed: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
})

const bookmark = (id: string, at: string, author: ReturnType<typeof prof>) => ({
  id,
  normalizedUrl: `https://x/${id}`,
  url: `https://x/${id}`,
  title: `t-${id}`,
  context: '',
  circleId: 'c1',
  authorWallet: author.wallet,
  createdAt: new Date(at),
  updatedAt: new Date(at),
  author,
})

const comment = (id: string, at: string, author: ReturnType<typeof prof>) => ({
  id,
  bookmarkKey: `https://x/${id}`,
  circleId: 'c1',
  authorWallet: author.wallet,
  text: `c-${id}`,
  editedAt: null,
  deletedAt: null,
  createdAt: new Date(at),
  author,
})

describe('buildActivity', () => {
  it('merges shares + comments newest-first with correct shape', () => {
    const a = prof('0xa', 'alice')
    const b = prof('0xb', 'bob')
    const items = buildActivity(
      [bookmark('s1', '2026-01-01', a), bookmark('s2', '2026-01-03', b)],
      [comment('c1', '2026-01-02', a)],
    )
    expect(items.map((i) => i.id)).toEqual(['s2', 'c1', 's1']) // 03, 02, 01
    expect(items[0]).toMatchObject({ kind: 'share', title: 't-s2', author: { handle: 'bob' } })
    expect(items[1]).toMatchObject({ kind: 'comment', text: 'c-c1', bookmarkKey: 'https://x/c1' })
  })

  it('handles empty sources', () => {
    expect(buildActivity([], [])).toEqual([])
  })
})
