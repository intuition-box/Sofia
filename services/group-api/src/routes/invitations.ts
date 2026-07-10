// Invite flow (owner/member-initiated, the mirror of the join-request flow):
// any authenticated caller invites N wallets to a circle. Each invitee gets an
// Application in the INVITED state + a notification. The invitee then accepts
// (→ ACTIVE Membership, exactly like an approved join, so they can mint the
// on-chain MEMBER_OF triple via the explorer cart) or declines.
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../auth'
import { getWallet } from '../auth'
import { prisma } from '../db'
import { ensureGroupSeeded } from '../indexer'
import { notify } from '../notify'

// Cap the fan-out so one call can't create thousands of rows/notifications.
const MAX_INVITES = 50
const WALLET_RE = /^0x[0-9a-fA-F]{40}$/

/** Normalise + validate the invite wallet list: lowercase, dedupe, drop the
 *  caller, reject non-address entries. Throws 400 on a malformed payload. */
function sanitizeWallets(value: unknown, caller: string): string[] {
  if (!Array.isArray(value)) {
    throw new HTTPException(400, { message: 'wallets must be an array' })
  }
  const seen = new Set<string>()
  for (const raw of value) {
    if (typeof raw !== 'string' || !WALLET_RE.test(raw.trim())) {
      throw new HTTPException(400, {
        message: `invalid wallet: ${String(raw)}`,
      })
    }
    const w = raw.trim().toLowerCase()
    if (w !== caller) seen.add(w)
  }
  if (seen.size > MAX_INVITES) {
    throw new HTTPException(413, {
      message: `too many wallets (max ${MAX_INVITES})`,
    })
  }
  return [...seen]
}

export const invitations = new Hono<AppEnv>()

/** Invite one or more wallets to a circle. Any authenticated wallet may invite
 *  (v1 is intentionally open); the inviter is recorded on each invitation. */
invitations.post('/groups/:groupTermId/invitations', async (c) => {
  const inviter = getWallet(c)
  const groupTermId = c.req.param('groupTermId')
  const body = (await c.req.json().catch(() => ({}))) as { wallets?: unknown }
  const wallets = sanitizeWallets(body.wallets, inviter)

  // Best-effort: make sure the group's owner is seeded so the circle is known
  // off-chain. Never gates the invite (owner resolution depends on the indexer,
  // which lags right after mint).
  await ensureGroupSeeded(groupTermId).catch(() => null)

  const invited: string[] = []
  const skipped: string[] = []

  for (const wallet of wallets) {
    const existing = await prisma.membership.findUnique({
      where: { wallet_groupTermId: { wallet, groupTermId } },
    })
    // Already in (or banned) — nothing to invite.
    if (existing?.status === 'ACTIVE' || existing?.status === 'BANNED') {
      skipped.push(wallet)
      continue
    }

    // Record the inviter on the Application so we can notify them on accept.
    await prisma.application.upsert({
      where: { wallet_groupTermId: { wallet, groupTermId } },
      update: {
        status: 'INVITED',
        answers: { invitedBy: inviter },
        reviewerWallet: null,
        reviewedAt: null,
        reviewNote: null,
      },
      create: {
        wallet,
        groupTermId,
        status: 'INVITED',
        answers: { invitedBy: inviter },
      },
    })
    await prisma.event.create({
      data: {
        groupTermId,
        actorWallet: inviter,
        subjectWallet: wallet,
        type: 'MEMBER_INVITED',
      },
    })
    await notify({
      recipientWallet: wallet,
      type: 'INVITED',
      title: 'Circle invitation',
      message: `${inviter} invited you to join a circle`,
      metadata: { groupTermId, invitedBy: inviter },
    })
    invited.push(wallet)
  }

  return c.json({ invited, skipped })
})

/** The invitee accepts or declines their pending invitation. Accept mirrors an
 *  approved join: ACTIVE Membership + APPROVED Application, so the existing
 *  "mint your membership" gate unlocks. */
invitations.post('/groups/:groupTermId/invitations/respond', async (c) => {
  const wallet = getWallet(c)
  const groupTermId = c.req.param('groupTermId')
  const body = (await c.req.json().catch(() => ({}))) as { accept?: unknown }
  const accept = body.accept === true

  const application = await prisma.application.findUnique({
    where: { wallet_groupTermId: { wallet, groupTermId } },
  })
  if (!application || application.status !== 'INVITED') {
    throw new HTTPException(404, { message: 'No pending invitation' })
  }

  const invitedBy =
    application.answers &&
    typeof application.answers === 'object' &&
    !Array.isArray(application.answers)
      ? (application.answers as { invitedBy?: string }).invitedBy
      : undefined

  if (!accept) {
    const updated = await prisma.application.update({
      where: { wallet_groupTermId: { wallet, groupTermId } },
      data: { status: 'WITHDRAWN', reviewedAt: new Date() },
    })
    await prisma.event.create({
      data: {
        groupTermId,
        actorWallet: wallet,
        subjectWallet: invitedBy ?? null,
        type: 'INVITE_DECLINED',
      },
    })
    return c.json({ application: updated })
  }

  const [updated] = await prisma.$transaction([
    prisma.application.update({
      where: { wallet_groupTermId: { wallet, groupTermId } },
      data: { status: 'APPROVED', reviewedAt: new Date() },
    }),
    prisma.membership.upsert({
      where: { wallet_groupTermId: { wallet, groupTermId } },
      update: { status: 'ACTIVE', approvedAt: new Date() },
      create: {
        wallet,
        groupTermId,
        role: 'MEMBER',
        status: 'ACTIVE',
        approvedAt: new Date(),
      },
    }),
    prisma.event.create({
      data: {
        groupTermId,
        actorWallet: wallet,
        subjectWallet: invitedBy ?? null,
        type: 'INVITE_ACCEPTED',
      },
    }),
  ])

  // Let the inviter know their invite was accepted (best-effort).
  if (invitedBy) {
    await notify({
      recipientWallet: invitedBy,
      type: 'INVITE_ACCEPTED',
      title: 'Invitation accepted',
      message: `${wallet} accepted your circle invitation`,
      metadata: { groupTermId, wallet },
    })
  }

  return c.json({ application: updated })
})
