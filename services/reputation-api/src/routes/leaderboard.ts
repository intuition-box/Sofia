import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '../db'
import { env } from '../env'
import { computeLeaderboard } from '../computeLeaderboard'

const OVERALL = '__overall__'

export const leaderboard = new Hono()

/**
 * GET /leaderboard?limit=50&offset=0
 * Public. Reads the precomputed `__overall__` snapshot — zero scoring here.
 */
leaderboard.get('/leaderboard', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 50) || 50, 200)
  const offset = Math.max(Number(c.req.query('offset') ?? 0) || 0, 0)

  const rows = await prisma.reputationSnapshot.findMany({
    where: { topicId: OVERALL },
    orderBy: { rank: 'asc' },
    take: limit,
    skip: offset,
  })

  return c.json({
    entries: rows.map((r) => ({
      wallet: r.wallet,
      score: r.score,
      rank: r.rank,
    })),
    // The whole batch shares one timestamp — surface it so the UI can show
    // "updated X ago". Null when no snapshot has ever been computed.
    computedAt: rows[0]?.computedAt ?? null,
  })
})

// In-memory guard so overlapping cron triggers don't run the expensive job
// twice concurrently (a second call gets 409 while the first is in flight).
let running = false

/**
 * POST /internal/leaderboard/compute
 * Header: x-compute-token: <LEADERBOARD_COMPUTE_TOKEN>
 * Recomputes the snapshot. 404 when no token is configured (feature disabled).
 */
leaderboard.post('/internal/leaderboard/compute', async (c) => {
  if (!env.computeToken) throw new HTTPException(404, { message: 'Not found' })
  if (c.req.header('x-compute-token') !== env.computeToken) {
    throw new HTTPException(403, { message: 'Bad compute token' })
  }
  if (running) {
    throw new HTTPException(409, { message: 'Compute already in progress' })
  }

  running = true
  try {
    const stats = await computeLeaderboard()
    return c.json({ ok: true, stats })
  } finally {
    running = false
  }
})
