// Identity routes. A Profile maps the caller's wallet to a unique @handle +
// displayName so the UI never surfaces a 0x… address.
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { Prisma } from '@prisma/client'
import type { AppEnv } from '../auth'
import { getWallet } from '../auth'
import { prisma } from '../db'
import { cleanHandle, publicProfile } from '../serialize'

export const profile = new Hono<AppEnv>()

/** Caller's own profile. 404 (with code) drives the front's "choose a pseudo" gate. */
profile.get('/me/profile', async (c) => {
  const wallet = getWallet(c)
  const p = await prisma.profile.findUnique({ where: { wallet } })
  if (!p) return c.json({ error: 'No profile', code: 'PROFILE_REQUIRED' }, 404)
  return c.json({ profile: publicProfile(p) })
})

/** Create the caller's profile (first-login pseudo pick). */
profile.post('/me/profile', async (c) => {
  const wallet = getWallet(c)
  const body = (await c.req.json().catch(() => ({}))) as {
    handle?: string
    displayName?: string
    avatarSeed?: number
  }

  const handle = cleanHandle(body.handle)
  if (!handle) {
    throw new HTTPException(400, {
      message: 'Invalid handle — 3-20 chars, lowercase letters, digits, underscore',
    })
  }
  if (await prisma.profile.findUnique({ where: { wallet } })) {
    throw new HTTPException(409, { message: 'Profile already exists' })
  }

  try {
    const p = await prisma.profile.create({
      data: {
        wallet,
        handle,
        displayName: body.displayName?.trim() || null,
        avatarSeed: Number.isInteger(body.avatarSeed) ? body.avatarSeed! : 0,
      },
    })
    return c.json({ profile: publicProfile(p) }, 201)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new HTTPException(409, { message: 'Handle already taken' })
    }
    throw e
  }
})

/** Update displayName / handle / avatar. */
profile.patch('/me/profile', async (c) => {
  const wallet = getWallet(c)
  const existing = await prisma.profile.findUnique({ where: { wallet } })
  if (!existing) throw new HTTPException(404, { message: 'No profile' })

  const body = (await c.req.json().catch(() => ({}))) as {
    handle?: string
    displayName?: string
    avatarSeed?: number
  }

  const data: Prisma.ProfileUpdateInput = {}
  if (body.handle !== undefined) {
    const handle = cleanHandle(body.handle)
    if (!handle) throw new HTTPException(400, { message: 'Invalid handle' })
    data.handle = handle
  }
  if (body.displayName !== undefined) data.displayName = body.displayName.trim() || null
  if (Number.isInteger(body.avatarSeed)) data.avatarSeed = body.avatarSeed

  try {
    const p = await prisma.profile.update({ where: { wallet }, data })
    return c.json({ profile: publicProfile(p) })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new HTTPException(409, { message: 'Handle already taken' })
    }
    throw e
  }
})

/** Check handle availability — for live validation in the pseudo picker. */
profile.get('/profiles/check', async (c) => {
  const handle = cleanHandle(c.req.query('handle'))
  if (!handle) return c.json({ valid: false, available: false })
  const taken = await prisma.profile.findUnique({ where: { handle } })
  return c.json({ valid: true, available: !taken })
})

/** Batch-resolve wallets → public profiles (for rendering a thread's authors). */
profile.get('/profiles', async (c) => {
  const raw = c.req.query('wallets') ?? ''
  const wallets = raw
    .split(',')
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 100)
  if (!wallets.length) return c.json({ profiles: [] })
  const list = await prisma.profile.findMany({ where: { wallet: { in: wallets } } })
  return c.json({ profiles: list.map(publicProfile) })
})
