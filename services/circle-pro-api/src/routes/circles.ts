// Circle (workspace) routes: create + metadata + the Members and Activity reads.
// Members come from group-api (source of truth); profile + expertise are
// joined/derived here from circle-pro data.
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../auth'
import { authMiddleware, optionalAuthMiddleware, getWallet } from '../auth'
import { prisma } from '../db'
import { listMembers, seedMember } from '../membership'
import { buildCircleMembers } from '../circleMembers'
import { buildActivity } from '../circleActivity'
import { publicCircle } from '../serialize'

export const circles = new Hono<AppEnv>()

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
  // write. If this fails, surface it — the workspace exists but is unusable.
  await seedMember(wallet, circle.id, 'OWNER')
  return c.json({ circle: publicCircle(circle) }, 201)
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
