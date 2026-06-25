// Front client tests around the membership gate: the circle picker source
// (/me/circles) and how a non-member write (403) surfaces to the UI.
import { describe, it, expect, afterEach, mock } from 'bun:test'
import {
  ApiError,
  getMyCircles,
  isNotMemberError,
  postBookmark,
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
