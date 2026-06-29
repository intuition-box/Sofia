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

// Write-abuse guards: an authenticated caller could otherwise stuff arbitrary
// blobs into the DB. Caps keep one row bounded.
const MAX_ANSWERS_BYTES = 8 * 1024 // 8 KB of JSON
const MAX_NOTE_CHARS = 1000

/** Validate + normalise the optional join-form answers. Throws 400 if oversized
 *  or not a plain JSON object. Returns `undefined` when absent (left untouched). */
function sanitizeAnswers(value: unknown): object | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new HTTPException(400, { message: 'answers must be an object' })
  }
  if (JSON.stringify(value).length > MAX_ANSWERS_BYTES) {
    throw new HTTPException(413, { message: 'answers too large' })
  }
  return value as object
}

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
  const answers = sanitizeAnswers(body.answers)
  const application = await prisma.application.upsert({
    where: { wallet_groupTermId: { wallet, groupTermId } },
    update: {
      status: 'PENDING',
      answers,
      reviewerWallet: null,
      reviewedAt: null,
      reviewNote: null,
    },
    create: {
      wallet,
      groupTermId,
      status: 'PENDING',
      answers,
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
      data: {
        status: 'APPROVED',
        reviewerWallet: reviewer,
        reviewedAt: new Date(),
      },
    }),
    prisma.membership.upsert({
      where: {
        wallet_groupTermId: {
          wallet: app.wallet,
          groupTermId: app.groupTermId,
        },
      },
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
  const note =
    typeof body.note === 'string'
      ? body.note.slice(0, MAX_NOTE_CHARS)
      : undefined

  const app = await prisma.application.findUnique({ where: { id } })
  if (!app) throw new HTTPException(404, { message: 'Application not found' })
  await requireRole(reviewer, app.groupTermId, [...REVIEWER_ROLES])

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewerWallet: reviewer,
      reviewedAt: new Date(),
      reviewNote: note,
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
    message: note || 'Your request was declined',
    metadata: { groupTermId: app.groupTermId, applicationId: id },
  })

  return c.json({ application: updated })
})

/** The caller's membership + application state for one group (drives the UI:
 *  request / pending / approved-unlock-mint / rejected). */
applications.get('/me/membership', async (c) => {
  const wallet = getWallet(c)
  const groupTermId = c.req.query('groupTermId')
  if (!groupTermId)
    throw new HTTPException(400, { message: 'groupTermId required' })

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
