// Internal, server-to-server membership reads — used by circle-pro-api to gate
// writes and to populate the circle picker. Guarded by a shared secret
// (x-internal-secret), NOT Privy, because the caller is another service (and the
// end user may be SIWE-authed against circle-pro-api, not Privy).
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { MembershipRole } from '@prisma/client'
import { prisma } from '../db'
import { env } from '../env'

export const internal = new Hono()

const ROLES: MembershipRole[] = ['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER']

// Shared-secret guard for everything under /internal.
internal.use('/internal/*', async (c, next) => {
  if (!env.internalSecret || c.req.header('x-internal-secret') !== env.internalSecret) {
    throw new HTTPException(401, { message: 'bad internal secret' })
  }
  await next()
})

/** GET /internal/membership?wallet=&groupTermId= → is this wallet an active member? */
internal.get('/internal/membership', async (c) => {
  const wallet = (c.req.query('wallet') ?? '').toLowerCase()
  const groupTermId = c.req.query('groupTermId') ?? ''
  if (!wallet || !groupTermId) {
    throw new HTTPException(400, { message: 'wallet + groupTermId required' })
  }
  const m = await prisma.membership.findUnique({
    where: { wallet_groupTermId: { wallet, groupTermId } },
  })
  const member = m?.status === 'ACTIVE'
  return c.json({ member, role: member ? m!.role : null })
})

/** GET /internal/memberships?wallet= → all active memberships (for the picker). */
internal.get('/internal/memberships', async (c) => {
  const wallet = (c.req.query('wallet') ?? '').toLowerCase()
  if (!wallet) throw new HTTPException(400, { message: 'wallet required' })
  const memberships = await prisma.membership.findMany({
    where: { wallet, status: 'ACTIVE' },
    select: { groupTermId: true, role: true },
  })
  return c.json({ memberships })
})

/** POST /internal/membership { wallet, groupTermId, role? } → upsert an ACTIVE
 *  membership. Used by circle-pro-api to seed the owner when an off-chain
 *  workspace is created (and later to register invited members). */
internal.post('/internal/membership', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    wallet?: string
    groupTermId?: string
    role?: string
  }
  if (!body.wallet || !body.groupTermId) {
    throw new HTTPException(400, { message: 'wallet + groupTermId required' })
  }
  const wallet = body.wallet.toLowerCase()
  const role = ROLES.find((r) => r === body.role?.toUpperCase()) ?? ('MEMBER' as MembershipRole)
  const m = await prisma.membership.upsert({
    where: { wallet_groupTermId: { wallet, groupTermId: body.groupTermId } },
    update: { role, status: 'ACTIVE' },
    create: {
      wallet,
      groupTermId: body.groupTermId,
      role,
      status: 'ACTIVE',
      approvedAt: new Date(),
    },
  })
  return c.json({ membership: { wallet: m.wallet, groupTermId: m.groupTermId, role: m.role } })
})

/** GET /internal/members?groupTermId= → active members of a circle (for the
 *  circle-pro Members tab). circle-pro-api joins these wallets to its profiles. */
internal.get('/internal/members', async (c) => {
  const groupTermId = c.req.query('groupTermId') ?? ''
  if (!groupTermId) throw new HTTPException(400, { message: 'groupTermId required' })
  const members = await prisma.membership.findMany({
    where: { groupTermId, status: 'ACTIVE' },
    select: { wallet: true, role: true },
    orderBy: { createdAt: 'asc' },
  })
  return c.json({ members })
})
