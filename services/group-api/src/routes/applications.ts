// Join-request flow: request → admin review → approve/reject. Approval creates
// an ACTIVE Membership; the user then mints the on-chain MEMBER_OF triple via
// the explorer cart (the backend only gates).
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../auth'
import { getWallet, requireRole } from '../auth'
import { prisma } from '../db'
import { ensureGroupSeeded } from '../indexer'
import { notify } from '../notify'

const REVIEWER_ROLES = ['OWNER', 'ADMIN', 'MODERATOR'] as const
const APPLICATION_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
  'BANNED',
] as const

export const applications = new Hono<AppEnv>()

/** A wallet requests to join a group. */
applications.post('/groups/:groupTermId/applications', async (c) => {
  const wallet = getWallet(c)
  const groupTermId = c.req.param('groupTermId')

  // Make sure the group's owner exists so there's someone to review.
  await ensureGroupSeeded(groupTermId)

  const membership = await prisma.membership.findUnique({
    where: { wallet_groupTermId: { wallet, groupTermId } },
  })
  if (membership?.status === 'ACTIVE') {
    throw new HTTPException(409, { message: 'Already a member' })
  }
  if (membership?.status === 'BANNED') {
    throw new HTTPException(403, { message: 'Banned from this group' })
  }

  const body = (await c.req.json().catch(() => ({}))) as { answers?: unknown }
  const application = await prisma.application.upsert({
    where: { wallet_groupTermId: { wallet, groupTermId } },
    update: {
      status: 'PENDING',
      answers: body.answers === undefined ? undefined : (body.answers as object),
      reviewerWallet: null,
      reviewedAt: null,
      reviewNote: null,
    },
    create: {
      wallet,
      groupTermId,
      status: 'PENDING',
      answers: body.answers === undefined ? undefined : (body.answers as object),
    },
  })

  await prisma.event.create({
    data: { groupTermId, actorWallet: wallet, type: 'JOIN_REQUESTED' },
  })

  // Notify every reviewer of the group.
  const reviewers = await prisma.membership.findMany({
    where: { groupTermId, status: 'ACTIVE', role: { in: [...REVIEWER_ROLES] } },
  })
  await Promise.all(
    reviewers.map((r) =>
      notify({
        recipientWallet: r.wallet,
        type: 'JOIN_REQUESTED',
        title: 'New join request',
        message: `${wallet} asked to join`,
        metadata: { groupTermId, applicationId: application.id, wallet },
      }),
    ),
  )

  return c.json({ application })
})

/** Reviewer lists a group's applications (optionally filtered by status). */
applications.get('/groups/:groupTermId/applications', async (c) => {
  const wallet = getWallet(c)
  const groupTermId = c.req.param('groupTermId')
  await requireRole(wallet, groupTermId, [...REVIEWER_ROLES])

  const raw = c.req.query('status')?.toUpperCase()
  const status = APPLICATION_STATUSES.find((s) => s === raw)

  const apps = await prisma.application.findMany({
    where: { groupTermId, ...(status ? { status } : {}) },
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ applications: apps })
})

/** Approve a request → ACTIVE Membership (preserving any existing role). */
applications.post('/applications/:id/approve', async (c) => {
  const reviewer = getWallet(c)
  const id = c.req.param('id')

  const app = await prisma.application.findUnique({ where: { id } })
  if (!app) throw new HTTPException(404, { message: 'Application not found' })
  await requireRole(reviewer, app.groupTermId, [...REVIEWER_ROLES])

  const [updated] = await prisma.$transaction([
    prisma.application.update({
      where: { id },
      data: { status: 'APPROVED', reviewerWallet: reviewer, reviewedAt: new Date() },
    }),
    prisma.membership.upsert({
      where: { wallet_groupTermId: { wallet: app.wallet, groupTermId: app.groupTermId } },
      update: { status: 'ACTIVE', approvedAt: new Date() },
      create: {
        wallet: app.wallet,
        groupTermId: app.groupTermId,
        role: 'MEMBER',
        status: 'ACTIVE',
        approvedAt: new Date(),
      },
    }),
    prisma.event.create({
      data: {
        groupTermId: app.groupTermId,
        actorWallet: reviewer,
        subjectWallet: app.wallet,
        type: 'JOIN_APPROVED',
      },
    }),
  ])

  await notify({
    recipientWallet: app.wallet,
    type: 'JOIN_APPROVED',
    title: 'Request approved',
    message: 'You can now join the group',
    metadata: { groupTermId: app.groupTermId, applicationId: id },
  })

  return c.json({ application: updated })
})

/** Reject a request, with an optional note surfaced to the applicant. */
applications.post('/applications/:id/reject', async (c) => {
  const reviewer = getWallet(c)
  const id = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as { note?: string }

  const app = await prisma.application.findUnique({ where: { id } })
  if (!app) throw new HTTPException(404, { message: 'Application not found' })
  await requireRole(reviewer, app.groupTermId, [...REVIEWER_ROLES])

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewerWallet: reviewer,
      reviewedAt: new Date(),
      reviewNote: body.note,
    },
  })
  await prisma.event.create({
    data: {
      groupTermId: app.groupTermId,
      actorWallet: reviewer,
      subjectWallet: app.wallet,
      type: 'JOIN_REJECTED',
    },
  })
  await notify({
    recipientWallet: app.wallet,
    type: 'JOIN_REJECTED',
    title: 'Request declined',
    message: body.note || 'Your request was declined',
    metadata: { groupTermId: app.groupTermId, applicationId: id },
  })

  return c.json({ application: updated })
})

/** The caller's membership + application state for one group (drives the UI:
 *  request / pending / approved-unlock-mint / rejected). */
applications.get('/me/membership', async (c) => {
  const wallet = getWallet(c)
  const groupTermId = c.req.query('groupTermId')
  if (!groupTermId) throw new HTTPException(400, { message: 'groupTermId required' })

  const [membership, application] = await Promise.all([
    prisma.membership.findUnique({
      where: { wallet_groupTermId: { wallet, groupTermId } },
    }),
    prisma.application.findUnique({
      where: { wallet_groupTermId: { wallet, groupTermId } },
    }),
  ])

  return c.json({
    membership: membership
      ? { role: membership.role, status: membership.status }
      : null,
    application: application ? { status: application.status } : null,
  })
})
