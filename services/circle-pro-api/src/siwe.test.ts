// Tests for the SIWE → JWT auth. Pure JWT tests run anywhere; the verifySiwe
// suite hits the local Postgres (nonces live in the DB), so `bun test` needs the
// dev DB up + .env (DATABASE_URL, JWT_SECRET) — both loaded automatically by bun.
import { describe, expect, test } from 'bun:test'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import {
  buildSiweMessage,
  issueNonce,
  signSession,
  verifySession,
  verifySiwe,
} from './siwe'

describe('session JWT', () => {
  test('round-trips a wallet (lowercased)', async () => {
    const token = await signSession('0xabc0000000000000000000000000000000000001')
    expect(await verifySession(token)).toBe('0xabc0000000000000000000000000000000000001')
  })

  test('lowercases the wallet claim', async () => {
    const token = await signSession('0xABCDEF0000000000000000000000000000000002')
    expect(await verifySession(token)).toBe('0xabcdef0000000000000000000000000000000002')
  })

  test('rejects a tampered token', async () => {
    const token = await signSession('0xabc0000000000000000000000000000000000003')
    expect(await verifySession(token.slice(0, -2) + 'xx')).toBeNull()
  })

  test('rejects garbage', async () => {
    expect(await verifySession('not.a.jwt')).toBeNull()
    expect(await verifySession('')).toBeNull()
  })
})

describe('buildSiweMessage', () => {
  test('contains the address and the nonce', () => {
    const m = buildSiweMessage('0xADDRESS', 'NONCE_123')
    expect(m).toContain('0xADDRESS')
    expect(m).toContain('NONCE_123')
  })
})

describe('verifySiwe (Postgres required)', () => {
  test('accepts a valid signature → returns the lowercased wallet', async () => {
    const acct = privateKeyToAccount(generatePrivateKey())
    const nonce = await issueNonce()
    const message = buildSiweMessage(acct.address, nonce)
    const signature = await acct.signMessage({ message })
    expect(await verifySiwe({ address: acct.address, message, signature, nonce })).toBe(
      acct.address.toLowerCase(),
    )
  })

  test('rejects replay — a nonce is single-use', async () => {
    const acct = privateKeyToAccount(generatePrivateKey())
    const nonce = await issueNonce()
    const message = buildSiweMessage(acct.address, nonce)
    const signature = await acct.signMessage({ message })
    // first use succeeds
    expect(await verifySiwe({ address: acct.address, message, signature, nonce })).toBe(
      acct.address.toLowerCase(),
    )
    // replay fails
    expect(await verifySiwe({ address: acct.address, message, signature, nonce })).toBeNull()
  })

  test('rejects impersonation — signature from a different key', async () => {
    const real = privateKeyToAccount(generatePrivateKey())
    const attacker = privateKeyToAccount(generatePrivateKey())
    const nonce = await issueNonce()
    const message = buildSiweMessage(real.address, nonce) // claims the real address
    const signature = await attacker.signMessage({ message }) // but signed by the attacker
    expect(await verifySiwe({ address: real.address, message, signature, nonce })).toBeNull()
  })

  test('rejects a message that does not carry the nonce', async () => {
    const acct = privateKeyToAccount(generatePrivateKey())
    const nonce = await issueNonce()
    const message = `Sign in to Sofia Pro\n\nWallet: ${acct.address}\nNonce: SOMETHING_ELSE`
    const signature = await acct.signMessage({ message })
    expect(await verifySiwe({ address: acct.address, message, signature, nonce })).toBeNull()
  })

  test('rejects an unknown nonce', async () => {
    const acct = privateKeyToAccount(generatePrivateKey())
    const nonce = 'nonce-that-was-never-issued'
    const message = buildSiweMessage(acct.address, nonce)
    const signature = await acct.signMessage({ message })
    expect(await verifySiwe({ address: acct.address, message, signature, nonce })).toBeNull()
  })
})
