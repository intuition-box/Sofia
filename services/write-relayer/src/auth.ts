// Who may be sponsored: any Privy user with a wallet — a Privy embedded wallet
// (email / Google sign-in) or their own crypto wallet. That wallet receives
// the positions.
import { createHash, randomBytes } from 'node:crypto'
import { PrivyClient } from '@privy-io/server-auth'
import type { MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { prisma } from './db'
import { env } from './env'

export interface Sponsee {
  privyUserId: string
  /** The account's wallets, lowercase, embedded first — positions go to one */
  wallets: string[]
}

/** The wallet the user writes with when it's theirs, else their first one */
export const receiverOf = (sponsee: Sponsee, requested?: unknown): string =>
  typeof requested === 'string' &&
  sponsee.wallets.includes(requested.toLowerCase())
    ? requested.toLowerCase()
    : sponsee.wallets[0]

export type AppEnv = {
  Variables: {
    sponsee: Sponsee | null
    reason: string
    privyUserId: string
    /** How the caller signed in: a Privy token, or an extension session */
    via: 'privy' | 'extension'
  }
}

/** How long the extension stays signed in to the relayer */
const EXTENSION_SESSION_DAYS = 90

const sha256 = (token: string) =>
  createHash('sha256').update(token).digest('hex')

/** A new extension token for this account (shown once, stored hashed) */
export async function createExtensionSession(privyUserId: string) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + EXTENSION_SESSION_DAYS * 86_400_000)
  await prisma.extensionSession.create({
    data: { tokenHash: sha256(token), privyUserId, expiresAt },
  })
  return { token, expiresAt }
}

export async function revokeExtensionSession(token: string) {
  await prisma.extensionSession.updateMany({
    where: { tokenHash: sha256(token), revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

/** The account behind a live extension token, else null */
async function userOfExtensionToken(token: string): Promise<string | null> {
  const session = await prisma.extensionSession.findUnique({
    where: { tokenHash: sha256(token) },
  })
  if (!session || session.revokedAt || session.expiresAt < new Date())
    return null
  void prisma.extensionSession
    .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
    .catch(() => undefined)
  return session.privyUserId
}

const privy = new PrivyClient(env.privyAppId, env.privyAppSecret)

// userId → eligibility, cached briefly (getUser adds latency to each call)
const cache = new Map<
  string,
  { sponsee: Sponsee | null; reason: string; at: number }
>()
const TTL_MS = 5 * 60_000

async function resolve(
  userId: string,
): Promise<{ sponsee: Sponsee | null; reason: string }> {
  const hit = cache.get(userId)
  if (hit && Date.now() - hit.at < TTL_MS) return hit
  const user = await privy.getUser(userId)
  const wallets = user.linkedAccounts
    .filter(
      (a): a is typeof a & { address: string; walletClientType?: string } =>
        a.type === 'wallet' && 'address' in a,
    )
    .sort(
      (a, b) =>
        Number(b.walletClientType === 'privy') -
        Number(a.walletClientType === 'privy'),
    )
    .map((a) => a.address.toLowerCase())
  const out =
    wallets.length === 0
      ? { sponsee: null, reason: 'Connect a wallet to get free Recommends' }
      : { sponsee: { privyUserId: userId, wallets }, reason: '' }
  cache.set(userId, { ...out, at: Date.now() })
  return out
}

/**
 * Verifies the caller — a Privy bearer token (explorer, landing) or an
 * extension session (`Authorization: Extension <token>`); sets the sponsee
 * (or why not). The wallets are always read fresh from Privy.
 */
export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header('Authorization') ?? ''
  let userId: string | null = null
  if (header.startsWith('Extension ')) {
    userId = await userOfExtensionToken(header.slice(10))
    if (!userId)
      throw new HTTPException(401, { message: 'Extension session expired' })
    c.set('via', 'extension')
  } else {
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    if (!token)
      throw new HTTPException(401, { message: 'Missing bearer token' })
    try {
      userId = (await privy.verifyAuthToken(token)).userId
    } catch {
      throw new HTTPException(401, { message: 'Invalid token' })
    }
    c.set('via', 'privy')
  }
  const { sponsee, reason } = await resolve(userId)
  c.set('privyUserId', userId)
  c.set('sponsee', sponsee)
  c.set('reason', reason)
  await next()
}
