// buildCircleMembers — the Members-tab join + expertise derivation. Pure, so
// tested with fixtures (no DB / no group-api).
import { describe, it, expect } from 'bun:test'
import { buildCircleMembers } from './circleMembers'

const profile = (wallet: string, handle: string) => ({
  wallet,
  handle,
  displayName: handle,
  avatarSeed: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
})

const tag = (tagId: string, label: string) => ({
  id: `bt-${tagId}-${Math.random()}`,
  bookmarkId: 'b',
  tagId,
  label,
  color: '#7bade0',
  level: 'category',
})

const bm = (authorWallet: string, tags: ReturnType<typeof tag>[]) => ({
  id: `bm-${Math.random()}`,
  normalizedUrl: 'https://x.example/' + Math.random(),
  url: 'https://x.example',
  title: 'x',
  context: '',
  circleId: 'c1',
  authorWallet,
  createdAt: new Date(),
  updatedAt: new Date(),
  tags,
})

describe('buildCircleMembers', () => {
  it('joins role + profile and derives top expertise (most-used tags first)', () => {
    const refs = [{ wallet: '0xAAA', role: 'OWNER' }]
    const profiles = [profile('0xaaa', 'alice')]
    const bookmarks = [
      bm('0xaaa', [tag('ai', 'AI'), tag('web', 'Web')]),
      bm('0xaaa', [tag('ai', 'AI')]),
      bm('0xaaa', [tag('ai', 'AI'), tag('web', 'Web')]),
    ]
    const [m] = buildCircleMembers(refs, profiles, bookmarks)

    expect(m.role).toBe('OWNER')
    expect(m.profile?.handle).toBe('alice')
    expect(m.shareCount).toBe(3)
    expect(m.expertise[0]).toMatchObject({ tagId: 'ai', label: 'AI', count: 3 })
    expect(m.expertise[1]).toMatchObject({ tagId: 'web', count: 2 })
  })

  it('matches wallets case-insensitively', () => {
    const [m] = buildCircleMembers(
      [{ wallet: '0xABCDEF', role: 'MEMBER' }],
      [profile('0xabcdef', 'bob')],
      [bm('0xABCdef', [tag('ai', 'AI')])],
    )
    expect(m.profile?.handle).toBe('bob')
    expect(m.shareCount).toBe(1)
  })

  it('member with no profile yet → profile null, empty expertise', () => {
    const [m] = buildCircleMembers([{ wallet: '0xnope', role: 'MEMBER' }], [], [])
    expect(m.profile).toBeNull()
    expect(m.shareCount).toBe(0)
    expect(m.expertise).toEqual([])
  })

  it('caps expertise to topExpertise', () => {
    const tags = ['a', 'b', 'c', 'd', 'e'].map((t) => tag(t, t.toUpperCase()))
    const [m] = buildCircleMembers(
      [{ wallet: '0xaaa', role: 'MEMBER' }],
      [profile('0xaaa', 'alice')],
      [bm('0xaaa', tags)],
      3,
    )
    expect(m.expertise).toHaveLength(3)
  })
})
