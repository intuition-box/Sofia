// Dev-only routes — enabled solely when DEV_SEED_TOKEN is set (empty in prod).
// Lets you bootstrap a group's OWNER without an on-chain group / indexer, so
// the whole join flow is testable against a made-up groupTermId.
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { MembershipRole } from '@prisma/client'
import { prisma } from '../db'
import { env } from '../env'

const ROLES: MembershipRole[] = ['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER']

export const dev = new Hono()

/**
 * POST /dev/seed-owner  { groupTermId, wallet, role? }
 * Header: x-dev-token: <DEV_SEED_TOKEN>
 * Upserts an ACTIVE membership (default OWNER) — bypasses the indexer.
 */
dev.post('/dev/seed-owner', async (c) => {
  if (!env.devSeedToken) throw new HTTPException(404, { message: 'Not found' })
  if (c.req.header('x-dev-token') !== env.devSeedToken) {
    throw new HTTPException(403, { message: 'Bad dev token' })
  }

  const body = (await c.req.json().catch(() => ({}))) as {
    groupTermId?: string
    wallet?: string
    role?: string
  }
  if (!body.groupTermId || !body.wallet) {
    throw new HTTPException(400, { message: 'groupTermId + wallet required' })
  }

  const wallet = body.wallet.toLowerCase()
  const role =
    ROLES.find((r) => r === body.role?.toUpperCase()) ?? ('OWNER' as MembershipRole)

  const membership = await prisma.membership.upsert({
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
  return c.json({ membership })
})
