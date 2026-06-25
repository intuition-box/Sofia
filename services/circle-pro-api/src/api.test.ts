// Endpoint tests — profiles, bookmarks, search. Drive the Hono app in-process
// via app.request (no socket), authenticated with the dev backdoor. Needs the
// dev Postgres up + .env (DEV_SEED_TOKEN, DATABASE_URL), loaded by bun test.
import { describe, expect, test } from 'bun:test'
import { app } from './app'

const DEV = 'dev-local-secret'
const wallet = () =>
  ('0x' + crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')).slice(0, 42).toLowerCase()
const handle = () => 'h' + crypto.randomUUID().replace(/-/g, '').slice(0, 12)

const H = (w: string) => ({ 'x-dev-token': DEV, 'x-dev-wallet': w, 'content-type': 'application/json' })
const post = (p: string, w: string, b: unknown) =>
  app.request(p, { method: 'POST', headers: H(w), body: JSON.stringify(b) })
const del = (p: string, w: string) => app.request(p, { method: 'DELETE', headers: H(w) })
const get = (p: string, w?: string) =>
  app.request(p, { headers: w ? { 'x-dev-token': DEV, 'x-dev-wallet': w } : {} })

const makeProfile = (w: string) => post('/me/profile', w, { handle: handle() })

describe('profiles', () => {
  test('no profile → 404 PROFILE_REQUIRED', async () => {
    const r = await get('/me/profile', wallet())
    expect(r.status).toBe(404)
    expect((await r.json()).code).toBe('PROFILE_REQUIRED')
  })

  test('create → 201, re-create same wallet → 409', async () => {
    const w = wallet()
    expect((await post('/me/profile', w, { handle: handle() })).status).toBe(201)
    expect((await post('/me/profile', w, { handle: handle() })).status).toBe(409)
  })

  test('duplicate handle (other wallet) → 409', async () => {
    const h = handle()
    expect((await post('/me/profile', wallet(), { handle: h })).status).toBe(201)
    expect((await post('/me/profile', wallet(), { handle: h })).status).toBe(409)
  })

  test('invalid handle → 400', async () => {
    expect((await post('/me/profile', wallet(), { handle: 'a' })).status).toBe(400)
    expect((await post('/me/profile', wallet(), { handle: 'Has Spaces' })).status).toBe(400)
  })

  test('availability flips after creation', async () => {
    const caller = wallet() // /profiles/check sits behind auth
    const h = handle()
    expect((await get(`/profiles/check?handle=${h}`, caller).then((r) => r.json())).available).toBe(true)
    await post('/me/profile', wallet(), { handle: h })
    expect((await get(`/profiles/check?handle=${h}`, caller).then((r) => r.json())).available).toBe(false)
  })
})

describe('bookmarks', () => {
  test('profile gate — POST without a profile → 409', async () => {
    const r = await post('/bookmarks', wallet(), { url: 'https://x.com/a', title: 'A' })
    expect(r.status).toBe(409)
  })

  test('normalises server-side (ignores the client normalizedUrl)', async () => {
    const w = wallet()
    await makeProfile(w)
    const r = await post('/bookmarks', w, {
      url: 'https://www.Example.com/Path/?utm_source=spam#frag',
      normalizedUrl: 'https://lies.example/injected', // must be ignored
      title: 'Example',
      tags: [{ id: 'web-development', label: 'Web Development', color: '#7bade0', level: 'category' }],
    })
    expect(r.status).toBe(201)
    const b = (await r.json()).bookmark
    expect(b.normalizedUrl).toBe('https://example.com/Path') // www/utm/hash/slash stripped
    expect(b.tags).toHaveLength(1)
    expect(b.tags[0].id).toBe('web-development')
  })

  test('re-sharing the same URL upserts (no duplicate)', async () => {
    const w = wallet()
    await makeProfile(w)
    const url = 'https://dedup.example.com/x'
    await post('/bookmarks', w, { url, title: 'first' })
    await post('/bookmarks', w, { url, title: 'second' })
    const { bookmarks } = await get('/bookmarks?mine=1', w).then((r) => r.json())
    const mine = bookmarks.filter((b: any) => b.normalizedUrl === 'https://dedup.example.com/x')
    expect(mine).toHaveLength(1)
    expect(mine[0].title).toBe('second')
  })

  test('delete is owner-only', async () => {
    const owner = wallet()
    const other = wallet()
    await makeProfile(owner)
    const created = await post('/bookmarks', owner, { url: 'https://del.example.com/y', title: 'Y' }).then((r) => r.json())
    const id = created.bookmark.id
    expect((await del(`/bookmarks/${id}`, other)).status).toBe(403)
    expect((await del(`/bookmarks/${id}`, owner)).status).toBe(200)
  })

  test('sharers — real "who shared this URL" in the circle (deduped)', async () => {
    const a = wallet()
    const b = wallet()
    await makeProfile(a)
    await makeProfile(b)
    const marker = 'shr' + crypto.randomUUID().replace(/-/g, '').slice(0, 8)
    const url = `https://sharers.example.com/${marker}`
    await post('/bookmarks', a, { url, title: 'A shared' })
    await post('/bookmarks', b, { url, title: 'B shared' })
    // Re-share by A must NOT duplicate A in the sharer list.
    await post('/bookmarks', a, { url, title: 'A again' })

    const { sharers } = await post('/bookmarks/sharers', a, { normalizedUrls: [url] }).then((r) => r.json())
    const list = sharers[url]
    expect(list).toBeDefined()
    expect(list.map((p: any) => p.wallet).sort()).toEqual([a, b].sort())
  })

  test('sharers — empty keys → empty map', async () => {
    const { sharers } = await post('/bookmarks/sharers', wallet(), { normalizedUrls: [] }).then((r) => r.json())
    expect(sharers).toEqual({})
  })
})

describe('search', () => {
  test('finds a bookmark by a title word, and tokenises multi-word queries', async () => {
    const w = wallet()
    await makeProfile(w)
    const marker = 'zqx' + crypto.randomUUID().replace(/-/g, '').slice(0, 6) // unique word
    await post('/bookmarks', w, {
      url: `https://search.example.com/${marker}`,
      title: `${marker} pipeline doc`,
      tags: [{ id: 'devops', label: 'DevOps', color: '#7bade0', level: 'category' }],
    })

    const single = await get(`/search?q=${marker}`).then((r) => r.json())
    expect(single.bookmarks.some((b: any) => b.title.includes(marker))).toBe(true)

    // Multi-word ("marker  totallyabsentword") must still match via the marker token.
    const multi = await get(`/search?q=${marker}%20totallyabsentword`).then((r) => r.json())
    expect(multi.bookmarks.some((b: any) => b.title.includes(marker))).toBe(true)
  })

  test('q shorter than 2 returns empty', async () => {
    const r = await get('/search?q=a').then((res) => res.json())
    expect(r.bookmarks).toHaveLength(0)
    expect(r.people).toHaveLength(0)
  })

  test('hints surface a real tag label', async () => {
    const w = wallet()
    await makeProfile(w)
    await post('/bookmarks', w, {
      url: 'https://hints.example.com/z',
      title: 'hint source',
      tags: [{ id: 'web-development', label: 'Web Development', color: '#7bade0', level: 'category' }],
    })
    const { hints } = await get('/search/hints?q=web%20dev').then((r) => r.json())
    // (tag label "Web Development" contains "web dev" case-insensitively)
    expect(hints.some((h: any) => h.type === 'tag' && /web development/i.test(h.label))).toBe(true)
  })
})
