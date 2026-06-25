// Privy JWT auth. The front sends `Authorization: Bearer <privy access token>`;
// we verify it server-side, resolve the user's wallet (embedded or linked), and
// stash the lowercased address on the Hono context.
import { PrivyClient } from '@privy-io/server-auth'
import type { Context, MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { env } from './env'
import { verifySession } from './siwe'

let privyClient: PrivyClient | null = null
function privy(): PrivyClient {
  if (!privyClient) {
    if (!env.privyAppId || !env.privyAppSecret) {
      throw new HTTPException(503, { message: 'Auth not configured (PRIVY_APP_ID/SECRET)' })
    }
    privyClient = new PrivyClient(env.privyAppId, env.privyAppSecret)
  }
  return privyClient
}

/** Hono context typing — `wallet` is set by `authMiddleware`. */
export type AppEnv = { Variables: { wallet: string } }

// userId → wallet, cached briefly (the linked wallet rarely changes and the
// getUser call adds latency to every request otherwise).
const walletCache = new Map<string, { wallet: string; at: number }>()
const WALLET_TTL = 5 * 60 * 1000

async function resolveWallet(userId: string): Promise<string | null> {
  const cached = walletCache.get(userId)
  if (cached && Date.now() - cached.at < WALLET_TTL) return cached.wallet

  const user = await privy().getUser(userId)
  const fromEmbedded = user.wallet?.address
  const fromLinked = user.linkedAccounts.find(
    (a): a is typeof a & { address: string } =>
      a.type === 'wallet' && 'address' in a,
  )?.address
  const wallet = (fromEmbedded ?? fromLinked)?.toLowerCase() ?? null
  if (wallet) walletCache.set(userId, { wallet, at: Date.now() })
  return wallet
}

/** Verify the bearer token, resolve the wallet, set it on the context. */
export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  // Dev impersonation — guarded by DEV_SEED_TOKEN (empty in prod). Lets curl
  // hit any endpoint as an arbitrary wallet without a Privy token.
  if (env.devSeedToken && c.req.header('x-dev-token') === env.devSeedToken) {
    const devWallet = c.req.header('x-dev-wallet')
    if (devWallet) {
      c.set('wallet', devWallet.toLowerCase())
      await next()
      return
    }
  }

  const header = c.req.header('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) throw new HTTPException(401, { message: 'Missing bearer token' })

  // Our own SIWE session JWT (wallet-native, used by the extension) — checked
  // first, no network. Falls through to Privy for the web app's tokens.
  const siweWallet = await verifySession(token)
  if (siweWallet) {
    c.set('wallet', siweWallet)
    await next()
    return
  }

  let userId: string
  try {
    const claims = await privy().verifyAuthToken(token)
    userId = claims.userId
  } catch {
    throw new HTTPException(401, { message: 'Invalid token' })
  }

  const wallet = await resolveWallet(userId)
  if (!wallet) throw new HTTPException(403, { message: 'No wallet on account' })

  c.set('wallet', wallet)
  await next()
}

/**
 * Like authMiddleware but never rejects: resolves the wallet when a valid token
 * (or dev header) is present, otherwise sets an empty wallet (guest). Lets
 * public reads compute per-caller state (likedByMe) when signed in, while still
 * serving guests.
 */
export const optionalAuthMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (env.devSeedToken && c.req.header('x-dev-token') === env.devSeedToken) {
    c.set('wallet', (c.req.header('x-dev-wallet') ?? '').toLowerCase())
    await next()
    return
  }

  const header = c.req.header('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) {
    c.set('wallet', '')
    await next()
    return
  }

  const siweWallet = await verifySession(token)
  if (siweWallet) {
    c.set('wallet', siweWallet)
    await next()
    return
  }

  try {
    const claims = await privy().verifyAuthToken(token)
    c.set('wallet', (await resolveWallet(claims.userId)) ?? '')
  } catch {
    c.set('wallet', '')
  }
  await next()
}

export function getWallet(c: Context<AppEnv>): string {
  return c.get('wallet')
}
