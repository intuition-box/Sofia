// Who may be sponsored: any Privy user with a wallet — a Privy embedded wallet
// (email / Google sign-in) or their own crypto wallet. That wallet receives
// the positions.
import { PrivyClient } from '@privy-io/server-auth'
import type { MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
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

export type AppEnv = { Variables: { sponsee: Sponsee | null; reason: string } }

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

/** Verifies the Privy bearer token; sets the sponsee (or why not) */
export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) throw new HTTPException(401, { message: 'Missing bearer token' })
  let userId: string
  try {
    userId = (await privy.verifyAuthToken(token)).userId
  } catch {
    throw new HTTPException(401, { message: 'Invalid token' })
  }
  const { sponsee, reason } = await resolve(userId)
  c.set('sponsee', sponsee)
  c.set('reason', reason)
  await next()
}
