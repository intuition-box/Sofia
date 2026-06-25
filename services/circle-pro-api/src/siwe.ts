// SIWE (Sign-In With Ethereum) → session JWT. The wallet-native auth path for
// the extension (which has a wallet, not a Privy login):
//   1. GET /auth/nonce      → a one-time nonce (anti-replay)
//   2. wallet signs a message containing that nonce
//   3. POST /auth/siwe       → verify signature + nonce → issue a session JWT
//   4. JWT (Bearer) authenticates writes; the extension stores it in
//      chrome.storage.session (cleared on browser close).
import { SignJWT, jwtVerify } from 'jose'
import { recoverMessageAddress } from 'viem'
import { prisma } from './db'
import { env } from './env'

const NONCE_TTL_MS = 10 * 60 * 1000 // a nonce is valid 10 min
const SESSION_TTL = '12h'

function secretKey(): Uint8Array {
  if (!env.jwtSecret) throw new Error('JWT_SECRET not set — SIWE auth disabled')
  return new TextEncoder().encode(env.jwtSecret)
}

/** Issue a fresh one-time nonce. */
export async function issueNonce(): Promise<string> {
  const value = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '')
  await prisma.authNonce.create({ data: { value } })
  return value
}

/** The exact message the client must sign. Both sides build it identically. */
export function buildSiweMessage(address: string, nonce: string): string {
  return [
    'Sign in to Sofia Pro',
    '',
    `Wallet: ${address}`,
    `Nonce: ${nonce}`,
  ].join('\n')
}

/** Verify a SIWE login. Returns the lowercased wallet on success, else null. */
export async function verifySiwe(input: {
  address: string
  message: string
  signature: string
  nonce: string
}): Promise<string | null> {
  // 1. Nonce must exist, be unused, and fresh.
  const n = await prisma.authNonce.findUnique({ where: { value: input.nonce } })
  if (!n || n.usedAt || Date.now() - n.createdAt.getTime() > NONCE_TTL_MS) return null

  // 2. The signed message must carry this nonce (binds the signature to it).
  if (!input.message.includes(input.nonce)) return null

  // 3. The signature must recover the claimed address (EOA).
  let recovered: string
  try {
    recovered = await recoverMessageAddress({
      message: input.message,
      signature: input.signature as `0x${string}`,
    })
  } catch {
    return null
  }
  if (recovered.toLowerCase() !== input.address.toLowerCase()) return null

  // 4. Consume the nonce (one-time use).
  await prisma.authNonce.update({ where: { value: input.nonce }, data: { usedAt: new Date() } })
  return recovered.toLowerCase()
}

/** Mint a session JWT for a wallet (HS256, exp). */
export async function signSession(wallet: string): Promise<string> {
  return new SignJWT({ wallet })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secretKey())
}

/** Verify a session JWT → lowercased wallet, or null. */
export async function verifySession(token: string): Promise<string | null> {
  if (!env.jwtSecret) return null
  try {
    const { payload } = await jwtVerify(token, secretKey())
    return typeof payload.wallet === 'string' ? payload.wallet.toLowerCase() : null
  } catch {
    return null
  }
}
