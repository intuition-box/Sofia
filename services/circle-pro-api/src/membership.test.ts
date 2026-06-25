// Membership client tests — the gate logic, group-api call shape, caching, and
// the enforcement flag. group-api is stubbed via a fake fetch; env via a mutable
// mock object the tests flip between cases. No Postgres / no network.
import { describe, it, expect, beforeEach, afterEach, afterAll, mock } from 'bun:test'

// Mutable mocked env — membership.ts reads these live, so tests flip them.
// IMPORTANT: bun's mock.module is process-global, so this replaces './env' for
// EVERY test file in the run. We therefore (a) mirror the real env fields from
// process.env so siwe/api tests still see jwtSecret/devSeedToken/etc., and
// (b) default the gate OFF + group-api unconfigured, flipping them on only
// inside this file's own tests (beforeEach) and resetting after (afterAll).
const env = {
  isProd: false,
  port: 8789,
  databaseUrl: process.env.DATABASE_URL ?? '',
  privyAppId: process.env.PRIVY_APP_ID ?? '',
  privyAppSecret: process.env.PRIVY_APP_SECRET ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  devSeedToken: process.env.DEV_SEED_TOKEN ?? '',
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  groupApiUrl: '',
  groupApiInternalSecret: '',
  membershipEnforced: false,
}
mock.module('./env', () => ({ env }))

const { isMember, assertMember, listCircles } = await import('./membership')

const realFetch = globalThis.fetch
let calls: { url: string; init?: RequestInit }[] = []

// Stub fetch with a per-URL responder so one test can serve several endpoints.
function stubFetch(responder: (url: string) => { status?: number; body: unknown }) {
  calls = []
  globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    const { status = 200, body } = responder(url)
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as unknown as typeof fetch
}

beforeEach(() => {
  env.groupApiUrl = 'http://group-api.test'
  env.groupApiInternalSecret = 'sek'
  env.membershipEnforced = true
})
afterEach(() => {
  globalThis.fetch = realFetch
})
// Leave the shared env mock in a benign state for other test files (gate off,
// group-api unconfigured) so this file's mutations don't leak.
afterAll(() => {
  env.groupApiUrl = ''
  env.groupApiInternalSecret = ''
  env.membershipEnforced = false
})

describe('isMember', () => {
  it('calls /internal/membership with the shared secret and lowercased wallet', async () => {
    stubFetch(() => ({ body: { member: true, role: 'OWNER' } }))

    const ok = await isMember('0xABCdef0000000000000000000000000000000001', 'circle-1')

    expect(ok).toBe(true)
    expect(calls[0].url).toContain('/internal/membership')
    expect(calls[0].url).toContain('wallet=0xabcdef0000000000000000000000000000000001')
    expect(calls[0].url).toContain('groupTermId=circle-1')
    const headers = calls[0].init?.headers as Record<string, string>
    expect(headers['x-internal-secret']).toBe('sek')
  })

  it('returns false for a non-member', async () => {
    stubFetch(() => ({ body: { member: false, role: null } }))
    expect(await isMember('0xnonmember0000000000000000000000000000aa', 'c')).toBe(false)
  })

  it('caches within the TTL — a second call hits no network', async () => {
    let n = 0
    stubFetch(() => {
      n++
      return { body: { member: true, role: 'MEMBER' } }
    })
    const w = '0xcache00000000000000000000000000000000bb'
    await isMember(w, 'circle-cache')
    await isMember(w, 'circle-cache')
    expect(n).toBe(1)
  })

  it('returns false (no call) when group-api is not configured', async () => {
    env.groupApiUrl = ''
    stubFetch(() => ({ body: { member: true } }))
    expect(await isMember('0xunconfigured000000000000000000000000cc', 'c')).toBe(false)
    expect(calls).toHaveLength(0)
  })
})

describe('assertMember (the gate)', () => {
  it('is a no-op when enforcement is off — no network call', async () => {
    env.membershipEnforced = false
    stubFetch(() => ({ body: { member: false } }))
    await assertMember('0xanyone000000000000000000000000000000dd', 'c')
    expect(calls).toHaveLength(0)
  })

  it('resolves for a member when enforced', async () => {
    stubFetch(() => ({ body: { member: true, role: 'MEMBER' } }))
    await assertMember('0xmember00000000000000000000000000000ee', 'circle-x')
  })

  it('throws 403 for a non-member when enforced', async () => {
    stubFetch(() => ({ body: { member: false, role: null } }))
    const p = assertMember('0xstranger0000000000000000000000000000ff', 'circle-y')
    await expect(p).rejects.toMatchObject({ status: 403 })
  })
})

describe('listCircles', () => {
  it('maps the memberships from group-api', async () => {
    stubFetch(() => ({
      body: {
        memberships: [
          { groupTermId: '0x111', role: 'OWNER' },
          { groupTermId: '0x222', role: 'MEMBER' },
        ],
      },
    }))
    const circles = await listCircles('0xLister0000000000000000000000000000a11')
    expect(circles).toHaveLength(2)
    expect(circles[1]).toEqual({ groupTermId: '0x222', role: 'MEMBER' })
    expect(calls[0].url).toContain('/internal/memberships')
    expect(calls[0].url).toContain('wallet=0xlister0000000000000000000000000000a11')
  })

  it('returns [] when group-api is not configured', async () => {
    env.groupApiInternalSecret = ''
    const circles = await listCircles('0xnope000000000000000000000000000000a22')
    expect(circles).toEqual([])
  })
})
