// Circle-scoped reads — the Members tab. Members come from group-api (source of
// truth); their profile + expertise are joined/derived here from circle-pro data.
import { Hono } from 'hono'
import type { AppEnv } from '../auth'
import { optionalAuthMiddleware } from '../auth'
import { prisma } from '../db'
import { listMembers } from '../membership'
import { buildCircleMembers } from '../circleMembers'
import { buildActivity } from '../circleActivity'

export const circles = new Hono<AppEnv>()

const ACTIVITY_PAGE = 30
const ACTIVITY_MAX_WINDOW = 300

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
