import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '../db'
import { env } from '../env'
import { computeLeaderboard } from '../computeLeaderboard'

export const leaderboard = new Hono()

/**
 * GET /leaderboard            → every snapshot row (per bucket) so the client can
 *                               derive the overall (sum a wallet's buckets) AND
 *                               each per-topic ranking. Zero scoring here.
 * GET /leaderboard?topic=<id> → just that bucket's ranking, top `limit`.
 *
 * A "bucket" is a real topic slug, or one of the reserved __general__ /
 * __trusts__ / __distrust__ buckets holding the non-topic cert points.
 */
leaderboard.get('/leaderboard', async (c) => {
  const topic = c.req.query('topic')?.trim()

  if (topic) {
    const limit = Math.min(Number(c.req.query('limit') ?? 50) || 50, 200)
    const rows = await prisma.reputationSnapshot.findMany({
      where: { topicId: topic },
      orderBy: { rank: 'asc' },
      take: limit,
    })
    return c.json({
      topic,
      entries: rows.map((r) => ({
        wallet: r.wallet,
        score: r.score,
        rank: r.rank,
      })),
      computedAt: rows[0]?.computedAt ?? null,
    })
  }

  // Full snapshot — the client groups by wallet (overall) and by topic.
  const rows = await prisma.reputationSnapshot.findMany({
    orderBy: [{ topicId: 'asc' }, { rank: 'asc' }],
  })
  return c.json({
    rows: rows.map((r) => ({
      wallet: r.wallet,
      topicId: r.topicId,
      score: r.score,
      rank: r.rank,
    })),
    computedAt: rows[0]?.computedAt ?? null,
  })
})

// In-memory guard so overlapping cron triggers don't run the expensive job
// twice concurrently (a second call gets 409 while the first is in flight).
let running = false

/**
 * POST /internal/leaderboard/compute
 * Header: x-compute-token: <LEADERBOARD_COMPUTE_TOKEN>
 *
 * Fire-and-forget: the job runs for minutes (an MCP pass per unique address), so
 * we kick it off and return 202 immediately rather than holding the connection
 * (Bun's idleTimeout would drop a silent long request anyway). The cron only
 * needs the ack; results land in the snapshot when the run finishes. 404 when no
 * token is configured (feature disabled).
 */
leaderboard.post('/internal/leaderboard/compute', (c) => {
  if (!env.computeToken) throw new HTTPException(404, { message: 'Not found' })
  if (c.req.header('x-compute-token') !== env.computeToken) {
    throw new HTTPException(403, { message: 'Bad compute token' })
  }
  if (running) {
    throw new HTTPException(409, { message: 'Compute already in progress' })
  }

  running = true
  void computeLeaderboard()
    .catch((err) => console.error('[leaderboard] compute failed', err))
    .finally(() => {
      running = false
    })

  return c.json({ started: true }, 202)
})
