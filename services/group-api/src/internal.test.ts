// group-api internal endpoints — the contract circle-pro-api depends on.
//
// SAFETY: group-api's DATABASE_URL points at a real (Neon) database, so these
// tests deliberately exercise ONLY paths that return BEFORE any Prisma query —
// the shared-secret guard (401) and input validation (400). No rows are written.
// The DB round-trips are covered indirectly by circle-pro-api's membership
// client tests + live testing.
import { describe, expect, test } from 'bun:test'
import { app } from './app'

// Matches INTERNAL_SECRET in .env (loaded by bun test). If it didn't, the
// "with secret" cases below would 401 instead of 400 and fail loudly.
const SECRET = process.env.INTERNAL_SECRET ?? 'dev-internal-secret'
const ok = { 'x-internal-secret': SECRET }
const jsonOk = { ...ok, 'content-type': 'application/json' }

describe('internal guard (shared secret)', () => {
  test('no secret → 401', async () => {
    expect((await app.request('/internal/memberships?wallet=0xa')).status).toBe(401)
  })

  test('wrong secret → 401', async () => {
    const r = await app.request('/internal/memberships?wallet=0xa', {
      headers: { 'x-internal-secret': 'definitely-wrong' },
    })
    expect(r.status).toBe(401)
  })

  test('POST is guarded too', async () => {
    const r = await app.request('/internal/membership', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ wallet: '0xa', groupTermId: 'g' }),
    })
    expect(r.status).toBe(401)
  })
})

describe('internal validation (with secret, before any DB query)', () => {
  test('GET /internal/membership requires wallet + groupTermId', async () => {
    expect((await app.request('/internal/membership', { headers: ok })).status).toBe(400)
    expect((await app.request('/internal/membership?wallet=0xa', { headers: ok })).status).toBe(400)
  })

  test('GET /internal/memberships requires wallet', async () => {
    expect((await app.request('/internal/memberships', { headers: ok })).status).toBe(400)
  })

  test('GET /internal/members requires groupTermId', async () => {
    expect((await app.request('/internal/members', { headers: ok })).status).toBe(400)
  })

  test('POST /internal/membership requires wallet + groupTermId', async () => {
    const r = await app.request('/internal/membership', {
      method: 'POST',
      headers: jsonOk,
      body: '{}',
    })
    expect(r.status).toBe(400)
  })
})

describe('health probe (auth-free)', () => {
  test('GET /health → 200 ok', async () => {
    const r = await app.request('/health')
    expect(r.status).toBe(200)
    expect(await r.text()).toBe('ok')
  })
})
