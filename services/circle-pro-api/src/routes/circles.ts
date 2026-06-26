// Circle (workspace) routes: create + metadata + the Members and Activity reads.
// Members come from group-api (source of truth); profile + expertise are
// joined/derived here from circle-pro data.
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../auth'
import { authMiddleware, optionalAuthMiddleware, getWallet } from '../auth'
import { prisma } from '../db'
import { listMembers, seedMember, isMember, assertMember } from '../membership'
import { buildCircleMembers } from '../circleMembers'
import { buildActivity } from '../circleActivity'
import { publicCircle, publicDepartment } from '../serialize'

export const circles = new Hono<AppEnv>()

const WALLET_RE = /^0x[a-f0-9]{40}$/
const ACTIVITY_PAGE = 30
const ACTIVITY_MAX_WINDOW = 300

/**
 * Create a workspace (off-chain). Generates the circleId, stores the metadata,
 * and seeds the creator as OWNER in group-api (the gate's source of truth) so
 * they can immediately write. `termId` stays null until it's minted on-chain.
 */
circles.post('/circles', authMiddleware, async (c) => {
  const wallet = getWallet(c)
  const body = (await c.req.json().catch(() => ({}))) as {
    name?: string
    description?: string
    color?: string
  }
  const name = body.name?.trim()
  if (!name) throw new HTTPException(400, { message: 'name required' })

  const circle = await prisma.circle.create({
    data: {
      name,
      description: body.description?.trim() || null,
      color: body.color || null,
      ownerWallet: wallet,
    },
  })
  // Register the creator as OWNER in group-api so the membership gate lets them
  // write. If this fails (group-api down), roll back the orphan workspace so the
  // user can retry cleanly rather than owning an unusable circle.
  try {
    await seedMember(wallet, circle.id, 'OWNER')
  } catch {
    await prisma.circle.delete({ where: { id: circle.id } }).catch(() => {})
    throw new HTTPException(503, {
      message: 'Membership service unavailable — could not create the workspace. Is group-api running?',
    })
  }
  return c.json({ circle: publicCircle(circle) }, 201)
})

/**
 * Invite a wallet into the circle. Only an existing member can invite (always
 * checked, independent of the global write-gate flag). Registers the invitee in
 * group-api so the membership gate lets them write. Owner/admin-only + paid
 * gating come later.
 */
circles.post('/circles/:circleId/members', authMiddleware, async (c) => {
  const circleId = c.req.param('circleId')
  const caller = getWallet(c)
  if (!(await isMember(caller, circleId))) {
    throw new HTTPException(403, { message: 'Only members can invite' })
  }
  const body = (await c.req.json().catch(() => ({}))) as { wallet?: string; role?: string }
  const wallet = body.wallet?.trim().toLowerCase()
  if (!wallet || !WALLET_RE.test(wallet)) {
    throw new HTTPException(400, { message: 'valid wallet address required' })
  }
  const role = body.role === 'ADMIN' || body.role === 'MODERATOR' ? body.role : 'MEMBER'
  await seedMember(wallet, circleId, role)
  return c.json({ ok: true, wallet, role }, 201)
})

/** GET /circles/:circleId/departments → the circle's teams. Public read. */
circles.get('/circles/:circleId/departments', optionalAuthMiddleware, async (c) => {
  const circleId = c.req.param('circleId')
  const departments = await prisma.department.findMany({
    where: { circleId },
    orderBy: { createdAt: 'asc' },
  })
  return c.json({ departments: departments.map(publicDepartment) })
})

/** POST /circles/:circleId/departments → create a team (members-only write). */
circles.post('/circles/:circleId/departments', authMiddleware, async (c) => {
  const circleId = c.req.param('circleId')
  await assertMember(getWallet(c), circleId)
  const body = (await c.req.json().catch(() => ({}))) as { name?: string; color?: string }
  const name = body.name?.trim()
  if (!name) throw new HTTPException(400, { message: 'name required' })

  const existing = await prisma.department.findUnique({
    where: { circleId_name: { circleId, name } },
  })
  if (existing) throw new HTTPException(409, { message: 'A team with this name already exists' })

  const dept = await prisma.department.create({
    data: { circleId, name, color: body.color || null },
  })
  return c.json({ department: publicDepartment(dept) }, 201)
})

/** GET /circles/:circleId → workspace metadata (name, etc.). Public read. */
circles.get('/circles/:circleId', optionalAuthMiddleware, async (c) => {
  const circle = await prisma.circle.findUnique({ where: { id: c.req.param('circleId') } })
  if (!circle) throw new HTTPException(404, { message: 'Workspace not found' })
  return c.json({ circle: publicCircle(circle) })
})

/** GET /circles/:circleId/members → members + role + profile + derived expertise. */
circles.get('/circles/:circleId/members', optionalAuthMiddleware, async (c) => {
  const circleId = c.req.param('circleId')
  const refs = await listMembers(circleId)
  if (!refs.length) return c.json({ members: [] })

  const wallets = refs.map((m) => m.wallet.toLowerCase())
  const [profiles, bookmarks] = await Promise.all([
    prisma.profile.findMany({ where: { wallet: { in: wallets } } }),
    prisma.bookmark.findMany({
      where: { circleId, authorWallet: { in: wallets } },
      include: { tags: true },
    }),
  ])

  return c.json({ members: buildCircleMembers(refs, profiles, bookmarks) })
})

/** GET /circles/:circleId/activity → merged shares+comments feed (newest first),
 *  paginated. Public read. Follows the project's paginated-feed shape. */
circles.get('/circles/:circleId/activity', optionalAuthMiddleware, async (c) => {
  const circleId = c.req.param('circleId')
  const offset = Math.max(0, Number(c.req.query('offset') ?? 0))
  const limit = Math.min(ACTIVITY_PAGE, Math.max(1, Number(c.req.query('limit') ?? ACTIVITY_PAGE)))
  // Fetch enough of each source to fill the requested page after merge-sort.
  const window = Math.min(ACTIVITY_MAX_WINDOW, offset + limit + 1)

  const [bookmarks, comments] = await Promise.all([
    prisma.bookmark.findMany({
      where: { circleId },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
      take: window,
    }),
    prisma.comment.findMany({
      where: { circleId, deletedAt: null },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
      take: window,
    }),
  ])

  const all = buildActivity(bookmarks, comments)
  const items = all.slice(offset, offset + limit)
  return c.json({ items, hasMore: all.length > offset + limit })
})
