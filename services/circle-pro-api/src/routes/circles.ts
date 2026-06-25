// Circle-scoped reads — the Members tab. Members come from group-api (source of
// truth); their profile + expertise are joined/derived here from circle-pro data.
import { Hono } from 'hono'
import type { AppEnv } from '../auth'
import { optionalAuthMiddleware } from '../auth'
import { prisma } from '../db'
import { listMembers } from '../membership'
import { buildCircleMembers } from '../circleMembers'

export const circles = new Hono<AppEnv>()

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
