// Front client tests around the membership gate: the circle picker source
// (/me/circles) and how a non-member write (403) surfaces to the UI.
import { describe, it, expect, afterEach, mock } from 'bun:test'
import {
  ApiError,
  getMyCircles,
  isNotMemberError,
  postBookmark,
  createWorkspace,
  getCircleMembers,
  getDepartments,
  createDepartment,
  getCircleActivity,
  addAttribute,
  endorseAttribute,
  updateBookmark,
  inviteMember,
  getSharers,
} from './circleProApi'

const realFetch = globalThis.fetch

// Build a fake fetch returning a given status + JSON body, capturing the call.
function stubFetch(status: number, body: unknown) {
  const calls: { url: string; init?: RequestInit }[] = []
  globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as unknown as typeof fetch
  return calls
}

afterEach(() => {
  globalThis.fetch = realFetch
})

describe('getMyCircles', () => {
  it('returns the circles array and sends the bearer token', async () => {
    const calls = stubFetch(200, {
      circles: [
        { groupTermId: '0xabc', role: 'OWNER' },
        { groupTermId: '0xdef', role: 'MEMBER' },
      ],
    })

    const circles = await getMyCircles('tok-123')

    expect(circles).toHaveLength(2)
    expect(circles[0]).toEqual({ groupTermId: '0xabc', role: 'OWNER' })
    expect(calls[0].url).toContain('/me/circles')
    const headers = calls[0].init?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tok-123')
  })
})

describe('membership gate on writes', () => {
  it('throws an ApiError(403) when the backend refuses a non-member', async () => {
    stubFetch(403, { error: 'Not a member of this circle' })

    const promise = postBookmark('tok', {
      url: 'https://example.com',
      normalizedUrl: 'example.com',
      title: 'Example',
    })

    await expect(promise).rejects.toBeInstanceOf(ApiError)
    await expect(promise).rejects.toMatchObject({ status: 403 })
  })

  it('isNotMemberError recognises the gate refusal (and only it)', () => {
    expect(isNotMemberError(new ApiError('Not a member', 403))).toBe(true)
    expect(isNotMemberError(new ApiError('Create a profile first', 409))).toBe(false)
    expect(isNotMemberError(new Error('network'))).toBe(false)
    expect(isNotMemberError(null)).toBe(false)
  })
})

// Verb + path + body of every client interaction (response parsing too).
const body = (init?: RequestInit) => JSON.parse((init?.body as string) ?? '{}')

describe('client interactions — request shape + parse', () => {
  it('createWorkspace → POST /circles { name }', async () => {
    const calls = stubFetch(201, { circle: { id: 'c1', name: 'Acme', description: null, color: null, ownerWallet: '0xa', termId: null } })
    const circle = await createWorkspace('t', { name: 'Acme' })
    expect(circle.id).toBe('c1')
    expect(calls[0].url).toContain('/circles')
    expect(calls[0].init?.method).toBe('POST')
    expect(body(calls[0].init)).toEqual({ name: 'Acme' })
  })

  it('inviteMember → POST /circles/:id/members { wallet }', async () => {
    const calls = stubFetch(201, { ok: true, wallet: '0xb', role: 'MEMBER' })
    await inviteMember('t', '0xcircle', '0xB0B')
    expect(calls[0].url).toContain('/circles/0xcircle/members')
    expect(calls[0].init?.method).toBe('POST')
    expect(body(calls[0].init).wallet).toBe('0xB0B')
  })

  it('getCircleMembers → GET /circles/:id/members', async () => {
    const calls = stubFetch(200, { members: [{ wallet: '0xa', role: 'OWNER', profile: null, shareCount: 0, expertise: [], skills: [], tools: [] }] })
    const members = await getCircleMembers('t', '0xcircle')
    expect(members).toHaveLength(1)
    expect(calls[0].url).toContain('/circles/0xcircle/members')
  })

  it('getDepartments → GET; createDepartment → POST { name }', async () => {
    const list = stubFetch(200, { departments: [{ id: 'd1', circleId: 'c', name: 'Eng', color: '#fff' }] })
    expect(await getDepartments('t', 'c')).toHaveLength(1)
    expect(list[0].url).toContain('/circles/c/departments')

    const create = stubFetch(201, { department: { id: 'd2', circleId: 'c', name: 'Design', color: null } })
    const d = await createDepartment('t', 'c', { name: 'Design' })
    expect(d.name).toBe('Design')
    expect(create[0].init?.method).toBe('POST')
    expect(body(create[0].init).name).toBe('Design')
  })

  it('getCircleActivity → GET /circles/:id/activity?offset=0', async () => {
    const calls = stubFetch(200, { items: [{ kind: 'share', id: 's1', createdAt: 'x', author: {}, bookmarkKey: 'k', title: 't' }], hasMore: false })
    const page = await getCircleActivity('t', { circleId: 'c' })
    expect(page.items).toHaveLength(1)
    expect(page.hasMore).toBe(false)
    expect(calls[0].url).toContain('/circles/c/activity?offset=0')
  })

  it('addAttribute → POST /me/attributes { kind, name }', async () => {
    const calls = stubFetch(201, { ok: true })
    await addAttribute('t', 'c', 'SKILL', 'ZK')
    expect(calls[0].url).toContain('/circles/c/me/attributes')
    expect(body(calls[0].init)).toMatchObject({ kind: 'SKILL', name: 'ZK' })
  })

  it('endorseAttribute → POST when on, DELETE when off', async () => {
    const on = stubFetch(200, { ok: true })
    await endorseAttribute('t', 'c', 'ma1', true)
    expect(on[0].init?.method).toBe('POST')
    expect(on[0].url).toContain('/member-attributes/ma1/endorse')

    const off = stubFetch(200, { ok: true })
    await endorseAttribute('t', 'c', 'ma1', false)
    expect(off[0].init?.method).toBe('DELETE')
  })

  it('updateBookmark → PATCH /bookmarks/:id { tags }', async () => {
    const calls = stubFetch(200, { bookmark: { id: 'b1', tags: [] } })
    await updateBookmark('t', 'b1', { tags: [{ id: 'x', label: 'X', color: '#fff', level: 'category' }] })
    expect(calls[0].init?.method).toBe('PATCH')
    expect(calls[0].url).toContain('/bookmarks/b1')
    expect(body(calls[0].init).tags).toHaveLength(1)
  })

  it('getSharers → POST /bookmarks/sharers { circleId, normalizedUrls }', async () => {
    const calls = stubFetch(200, { sharers: { 'https://x': [{ wallet: '0xa' }] } })
    const s = await getSharers('t', ['https://x'], 'c')
    expect(s['https://x']).toHaveLength(1)
    expect(calls[0].url).toContain('/bookmarks/sharers')
    expect(body(calls[0].init)).toMatchObject({ circleId: 'c', normalizedUrls: ['https://x'] })
  })
})
