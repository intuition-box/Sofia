// Integration tests for the interaction endpoints — comments, departments,
// activity, attributes (skills/tools + endorse). Drive the Hono app in-process
// with the dev backdoor. Needs the dev Postgres + .env. Member-gated writes are
// a no-op here (MEMBERSHIP_ENFORCED unset), and member listing/enrichment that
// needs group-api is covered by the pure unit tests (circleMembers/Attributes).
import { describe, expect, test } from 'bun:test'
import { app } from './app'

const DEV = 'dev-local-secret'
const rnd = () => crypto.randomUUID().replace(/-/g, '')
const wallet = () => ('0x' + rnd() + rnd()).slice(0, 42).toLowerCase()
const handle = () => 'h' + rnd().slice(0, 12)
const cid = () => 'circ' + rnd().slice(0, 10)
const key = () => 'https://k.example.com/' + rnd().slice(0, 10)

const H = (w: string) => ({ 'x-dev-token': DEV, 'x-dev-wallet': w, 'content-type': 'application/json' })
const post = (p: string, w: string, b: unknown) =>
  app.request(p, { method: 'POST', headers: H(w), body: JSON.stringify(b) })
const patch = (p: string, w: string, b: unknown) =>
  app.request(p, { method: 'PATCH', headers: H(w), body: JSON.stringify(b) })
const del = (p: string, w: string) => app.request(p, { method: 'DELETE', headers: H(w) })
const get = (p: string, w?: string) =>
  app.request(p, { headers: w ? { 'x-dev-token': DEV, 'x-dev-wallet': w } : {} })
const makeProfile = (w: string) => post('/me/profile', w, { handle: handle() })
const enc = encodeURIComponent

describe('comments', () => {
  test('post requires a profile (409)', async () => {
    const r = await post(`/bookmarks/${enc(key())}/comments`, wallet(), { text: 'hi' })
    expect(r.status).toBe(409)
  })

  test('post → appears in the thread; edit flags edited; delete soft-deletes', async () => {
    const w = wallet()
    await makeProfile(w)
    const k = key()
    const created = await post(`/bookmarks/${enc(k)}/comments`, w, { text: 'first' }).then((r) => r.json())
    expect(created.comment.text).toBe('first')
    const id = created.comment.id

    const thread = await get(`/bookmarks/${enc(k)}/comments`).then((r) => r.json())
    expect(thread.comments.some((c: any) => c.id === id)).toBe(true)

    const edited = await patch(`/comments/${id}`, w, { text: 'second' }).then((r) => r.json())
    expect(edited.comment.text).toBe('second')
    expect(edited.comment.edited).toBe(true)

    const removed = await del(`/comments/${id}`, w).then((r) => r.json())
    expect(removed.comment.deleted).toBe(true)
    expect(removed.comment.text).toBeNull()
  })

  test('edit is author-only (403)', async () => {
    const w = wallet()
    const other = wallet()
    await makeProfile(w)
    await makeProfile(other)
    const id = (await post(`/bookmarks/${enc(key())}/comments`, w, { text: 'x' }).then((r) => r.json())).comment.id
    expect((await patch(`/comments/${id}`, other, { text: 'y' })).status).toBe(403)
  })

  test('like / unlike toggles the count + likedByMe', async () => {
    const author = wallet()
    const liker = wallet()
    await makeProfile(author)
    await makeProfile(liker)
    const id = (await post(`/bookmarks/${enc(key())}/comments`, author, { text: 'x' }).then((r) => r.json())).comment.id

    const liked = await post(`/comments/${id}/like`, liker, {}).then((r) => r.json())
    expect(liked.comment.likeCount).toBe(1)
    expect(liked.comment.likedByMe).toBe(true)

    const unliked = await del(`/comments/${id}/like`, liker).then((r) => r.json())
    expect(unliked.comment.likeCount).toBe(0)
    expect(unliked.comment.likedByMe).toBe(false)
  })
})

describe('departments', () => {
  test('create + list round-trip; duplicate → 409; empty name → 400', async () => {
    const w = wallet()
    const circleId = cid()
    const name = 'Eng' + rnd().slice(0, 6)
    const created = await post(`/circles/${circleId}/departments`, w, { name, color: '#3b82f6' }).then((r) => r.json())
    expect(created.department).toMatchObject({ name, color: '#3b82f6', circleId })

    const { departments } = await get(`/circles/${circleId}/departments`).then((r) => r.json())
    expect(departments.some((d: any) => d.name === name)).toBe(true)

    expect((await post(`/circles/${circleId}/departments`, w, { name })).status).toBe(409)
    expect((await post(`/circles/${circleId}/departments`, w, { name: '   ' })).status).toBe(400)
  })
})

describe('skills (collaborative containers)', () => {
  test('create → add URL (auto-voted) → vote toggle → add tool', async () => {
    const w = wallet()
    const circleId = cid()
    const s = await post(`/circles/${circleId}/skills`, w, { name: 'ZK proving' }).then((r) => r.json())
    expect(s.skill.name).toBe('ZK proving')
    const skillId = s.skill.id

    const { skills } = await get(`/circles/${circleId}/skills`).then((r) => r.json())
    expect(skills.some((x: any) => x.id === skillId)).toBe(true)

    // Add a URL — the adder auto-votes it.
    const u = await post(`/skills/${skillId}/urls`, w, { url: 'https://zk.example/a', title: 'ZK paper' }).then((r) => r.json())
    const urlId = u.url.id
    let detail = await get(`/skills/${skillId}`, w).then((r) => r.json())
    expect(detail.skill.urls[0]).toMatchObject({ voteCount: 1, votedByMe: true, title: 'ZK paper' })

    // Another member votes → 2; un-votes → 1.
    const voter = wallet()
    await post(`/skills/${skillId}/urls/${urlId}/vote`, voter, {})
    detail = await get(`/skills/${skillId}`).then((r) => r.json())
    expect(detail.skill.urls[0].voteCount).toBe(2)
    await post(`/skills/${skillId}/urls/${urlId}/vote`, voter, {})
    detail = await get(`/skills/${skillId}`).then((r) => r.json())
    expect(detail.skill.urls[0].voteCount).toBe(1)

    // Add a tool.
    await post(`/skills/${skillId}/tools`, w, { name: 'Foundry' })
    detail = await get(`/skills/${skillId}`).then((r) => r.json())
    expect(detail.skill.tools.some((t: any) => t.name === 'Foundry')).toBe(true)
  })

  test('validation: empty skill name → 400; url on unknown skill → 404', async () => {
    const w = wallet()
    const circleId = cid()
    expect((await post(`/circles/${circleId}/skills`, w, { name: '' })).status).toBe(400)
    expect((await post(`/skills/does-not-exist/urls`, w, { url: 'https://x' })).status).toBe(404)
  })
})

describe('activity', () => {
  test('merges shares + comments for the circle (newest first)', async () => {
    const w = wallet()
    await makeProfile(w)
    const circleId = cid()
    await post('/bookmarks', w, { url: `https://act.example/${circleId}`, title: 'shared one', circleId })
    await post(`/bookmarks/${enc(key())}/comments`, w, { text: 'commented one', circleId })

    const { items } = await get(`/circles/${circleId}/activity`).then((r) => r.json())
    expect(items.some((i: any) => i.kind === 'share' && i.title === 'shared one')).toBe(true)
    expect(items.some((i: any) => i.kind === 'comment' && i.text === 'commented one')).toBe(true)
    // newest first
    const ts = items.map((i: any) => i.createdAt)
    expect([...ts].sort().reverse()).toEqual(ts)
  })
})

