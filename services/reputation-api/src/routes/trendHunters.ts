import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '../db'
import { env } from '../env'
import { computeTrendHunters, monthOf, MONTH_RE } from '../computeTrendHunters'
import { poolShares } from '../trendHunterPool'

export const trendHunters = new Hono()

/** `?month=YYYY-MM`, defaulting to the current UTC month */
function monthParam(raw: string | undefined): string {
  const month = raw?.trim() || monthOf()
  if (!MONTH_RE.test(month)) {
    throw new HTTPException(400, { message: 'month must be YYYY-MM' })
  }
  return month
}

function limitParam(raw: string | undefined, fallback: number): number {
  return Math.min(Number(raw ?? fallback) || fallback, 100)
}

/**
 * GET /trend-hunters?month=2026-10&limit=10 → the month's Flair ranking, with
 * each Top N wallet's share of the monthly pool (`reward`, TRUST)
 */
trendHunters.get('/trend-hunters', async (c) => {
  const month = monthParam(c.req.query('month'))
  // "YYYY-MM" compares in calendar order
  const pool =
    month >= env.trendHunterPool.startMonth
      ? env.trendHunterPool
      : { ...env.trendHunterPool, trust: 0 }
  const limit = limitParam(c.req.query('limit'), 10)
  // The shares need the whole Top N, whatever the limit
  const rows = await prisma.trendHunterMonth.findMany({
    where: { month },
    orderBy: { rank: 'asc' },
    take: Math.max(limit, pool.size),
  })
  const shares = poolShares(rows, pool)
  return c.json({
    month,
    entries: rows.slice(0, limit).map((r) => ({
      wallet: r.wallet,
      flair: r.flair,
      rank: r.rank,
      calls: r.calls,
      reward: shares.get(r.wallet) ?? null,
    })),
    pool: { trust: pool.trust, size: pool.size },
    computedAt: rows[0]?.computedAt ?? null,
  })
})

/** GET /early-signals?month=2026-10&limit=6 → the month's best calls */
trendHunters.get('/early-signals', async (c) => {
  const month = monthParam(c.req.query('month'))
  const rows = await prisma.earlySignal.findMany({
    where: { month },
    orderBy: { rank: 'asc' },
    take: limitParam(c.req.query('limit'), 6),
  })
  return c.json({
    month,
    entries: rows.map((r) => ({
      claimId: r.claimId,
      wallet: r.wallet,
      leadDays: r.leadDays,
      followers: r.followers,
      rank: r.rank,
      pageLabel: r.pageLabel,
      pageUrl: r.pageUrl,
    })),
    computedAt: rows[0]?.computedAt ?? null,
  })
})

/** GET /trend-hunters/:wallet → every month the wallet was ranked (badges) */
trendHunters.get('/trend-hunters/:wallet', async (c) => {
  const wallet = c.req.param('wallet').toLowerCase()
  if (!/^0x[0-9a-f]{40}$/.test(wallet)) {
    throw new HTTPException(400, { message: 'Bad wallet' })
  }
  const rows = await prisma.trendHunterMonth.findMany({
    where: { wallet },
    orderBy: { month: 'desc' },
  })
  return c.json({
    wallet,
    months: rows.map((r) => ({
      month: r.month,
      flair: r.flair,
      rank: r.rank,
      calls: r.calls,
    })),
  })
})

let running = false

/**
 * POST /internal/trend-hunters/compute?month=YYYY-MM
 * Header: x-compute-token: <LEADERBOARD_COMPUTE_TOKEN>
 *
 * Fire-and-forget like the leaderboard compute. The cron runs it daily for the
 * current month, and on the 1st with the previous month to freeze it.
 */
trendHunters.post('/internal/trend-hunters/compute', (c) => {
  if (!env.computeToken) throw new HTTPException(404, { message: 'Not found' })
  if (c.req.header('x-compute-token') !== env.computeToken) {
    throw new HTTPException(403, { message: 'Bad compute token' })
  }
  if (running) {
    throw new HTTPException(409, { message: 'Compute already in progress' })
  }
  const month = monthParam(c.req.query('month'))

  running = true
  void computeTrendHunters(month)
    .catch((err) => console.error('[trend-hunters] compute failed', err))
    .finally(() => {
      running = false
    })

  return c.json({ started: true, month }, 202)
})
