// Member + role management. Multiple OWNER/ADMIN roles are the wallet-loss
// fallback (Issue 2.2): access never depends on a single wallet.
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { MembershipRole } from '@prisma/client'
import type { AppEnv } from '../auth'
import { getWallet, requireRole } from '../auth'
import { prisma } from '../db'
import { ensureGroupSeeded } from '../indexer'
import { notify } from '../notify'

const ROLES: MembershipRole[] = ['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER']

export const members = new Hono<AppEnv>()

/** List a group's active members + roles (any authenticated caller). */
members.get('/groups/:groupTermId/members', async (c) => {
  const groupTermId = c.req.param('groupTermId')
  await ensureGroupSeeded(groupTermId)
  const list = await prisma.membership.findMany({
    where: { groupTermId, status: 'ACTIVE' },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
  })
  return c.json({ members: list })
})

/** Whether the caller can review join requests for this group. */
members.get('/groups/:groupTermId/me/is-admin', async (c) => {
  const wallet = getWallet(c)
  const groupTermId = c.req.param('groupTermId')
  const m = await prisma.membership.findUnique({
    where: { wallet_groupTermId: { wallet, groupTermId } },
  })
  const isAdmin =
    m?.status === 'ACTIVE' &&
    (m.role === 'OWNER' || m.role === 'ADMIN' || m.role === 'MODERATOR')
  return c.json({ isAdmin: !!isAdmin, role: m?.role ?? null })
})

/** Owner sets another member's role (promote ADMIN/MODERATOR, demote, …). */
members.post('/groups/:groupTermId/members/:wallet/role', async (c) => {
  const caller = getWallet(c)
  const groupTermId = c.req.param('groupTermId')
  const target = c.req.param('wallet').toLowerCase()
  await requireRole(caller, groupTermId, ['OWNER'])

  const body = (await c.req.json().catch(() => ({}))) as { role?: string }
  const role = ROLES.find((r) => r === body.role?.toUpperCase())
  if (!role) throw new HTTPException(400, { message: 'Invalid role' })
  if (target === caller) {
    throw new HTTPException(400, { message: 'Cannot change your own role' })
  }

  const updated = await prisma.membership.upsert({
    where: { wallet_groupTermId: { wallet: target, groupTermId } },
    update: { role, status: 'ACTIVE' },
    create: { wallet: target, groupTermId, role, status: 'ACTIVE', approvedAt: new Date() },
  })
  await prisma.event.create({
    data: {
      groupTermId,
      actorWallet: caller,
      subjectWallet: target,
      type: 'ROLE_UPDATED',
      metadata: { role },
    },
  })
  await notify({
    recipientWallet: target,
    type: 'ROLE_UPDATED',
    title: 'Role updated',
    message: `You are now ${role.toLowerCase()} of a group`,
    metadata: { groupTermId, role },
  })
  return c.json({ membership: updated })
})

/** Owner/admin bans a member (off-chain access revoked). */
members.delete('/groups/:groupTermId/members/:wallet', async (c) => {
  const caller = getWallet(c)
  const groupTermId = c.req.param('groupTermId')
  const target = c.req.param('wallet').toLowerCase()
  await requireRole(caller, groupTermId, ['OWNER', 'ADMIN'])
  if (target === caller) {
    throw new HTTPException(400, { message: 'Cannot ban yourself' })
  }

  const existing = await prisma.membership.findUnique({
    where: { wallet_groupTermId: { wallet: target, groupTermId } },
  })
  if (existing?.role === 'OWNER') {
    throw new HTTPException(403, { message: 'Cannot ban the owner' })
  }

  const updated = await prisma.membership.upsert({
    where: { wallet_groupTermId: { wallet: target, groupTermId } },
    update: { status: 'BANNED', bannedBy: caller },
    create: { wallet: target, groupTermId, role: 'MEMBER', status: 'BANNED', bannedBy: caller },
  })
  await prisma.event.create({
    data: {
      groupTermId,
      actorWallet: caller,
      subjectWallet: target,
      type: 'MEMBER_BANNED',
    },
  })
  return c.json({ membership: updated })
})
