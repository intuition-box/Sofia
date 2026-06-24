// Dev-only routes — enabled solely when DEV_SEED_TOKEN is set (empty in prod).
// Lets you create a profile for an arbitrary wallet without Privy, so the whole
// comment flow is curl-testable. Pair with the x-dev-token + x-dev-wallet
// impersonation headers handled in auth.ts.
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '../db'
import { env } from '../env'
import { cleanHandle, publicProfile } from '../serialize'

export const dev = new Hono()

/**
 * POST /dev/seed-profile  { wallet, handle, displayName?, avatarSeed? }
 * Header: x-dev-token: <DEV_SEED_TOKEN>
 * Upserts a Profile — bypasses Privy so you can curl as that wallet using
 * `x-dev-token` + `x-dev-wallet: <wallet>`.
 */
dev.post('/dev/seed-profile', async (c) => {
  if (!env.devSeedToken) throw new HTTPException(404, { message: 'Not found' })
  if (c.req.header('x-dev-token') !== env.devSeedToken) {
    throw new HTTPException(403, { message: 'Bad dev token' })
  }

  const body = (await c.req.json().catch(() => ({}))) as {
    wallet?: string
    handle?: string
    displayName?: string
    avatarSeed?: number
  }
  const wallet = body.wallet?.toLowerCase()
  const handle = cleanHandle(body.handle)
  if (!wallet || !handle) {
    throw new HTTPException(400, { message: 'wallet + valid handle required' })
  }

  const p = await prisma.profile.upsert({
    where: { wallet },
    update: { handle, displayName: body.displayName ?? null },
    create: {
      wallet,
      handle,
      displayName: body.displayName ?? null,
      avatarSeed: Number.isInteger(body.avatarSeed) ? body.avatarSeed! : 0,
    },
  })
  return c.json({ profile: publicProfile(p) })
})
