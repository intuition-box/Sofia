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

describe('attributes (skills/tools + endorse)', () => {
  test('claim a skill (idempotent); empty name → 400', async () => {
    const w = wallet()
    const circleId = cid()
    const r1 = await post(`/circles/${circleId}/me/attributes`, w, { kind: 'SKILL', name: 'ZK proving' })
    expect(r1.status).toBe(201)
    const body = await r1.json()
    expect(body.memberAttributeId).toBeTruthy()
    // re-claim is idempotent (same member-attribute).
    const r2 = await post(`/circles/${circleId}/me/attributes`, w, { kind: 'SKILL', name: 'ZK proving' }).then((r) => r.json())
    expect(r2.memberAttributeId).toBe(body.memberAttributeId)
    expect((await post(`/circles/${circleId}/me/attributes`, w, { kind: 'SKILL', name: '' })).status).toBe(400)
  })

  test('endorse / un-endorse a member-attribute (idempotent)', async () => {
    const owner = wallet()
    const endorser = wallet()
    const circleId = cid()
    const { memberAttributeId } = await post(`/circles/${circleId}/me/attributes`, owner, {
      kind: 'TOOL',
      name: 'Figma',
    }).then((r) => r.json())

    expect((await post(`/circles/${circleId}/member-attributes/${memberAttributeId}/endorse`, endorser, {})).status).toBe(200)
    // idempotent (one endorsement per endorser)
    expect((await post(`/circles/${circleId}/member-attributes/${memberAttributeId}/endorse`, endorser, {})).status).toBe(200)
    expect((await del(`/circles/${circleId}/member-attributes/${memberAttributeId}/endorse`, endorser)).status).toBe(200)
  })

  test('endorsing an unknown member-attribute → 404', async () => {
    const circleId = cid()
    expect((await post(`/circles/${circleId}/member-attributes/nope/endorse`, wallet(), {})).status).toBe(404)
  })
})
