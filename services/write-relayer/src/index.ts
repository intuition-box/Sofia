/**
 * write-relayer — sponsored writes.
 *
 * Users who signed in with email or Google (Privy embedded wallet, no TRUST)
 * get free Recommends: Sofia's treasury account sends them through
 * SofiaFeeProxy with `receiver` = the user's wallet, so every position is the
 * user's — and withdrawable. Quota per account (month / day) and a hard
 * monthly budget for the whole relayer; plan in
 * docs/plans/SPONSORED_WRITES_PLAN.md.
 *
 *   GET  /health
 *   GET  /sponsor/quota       (Privy bearer) → eligibility + Recommends left
 *   POST /sponsor/recommend   (Privy bearer) { pages: [{ objectId, tags? }] }
 */
import { useAtomsByTermIdsQuery } from '@0xsofia/graphql'
import { configureClient } from '@0xsofia/graphql'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import type { Hex } from 'viem'
import { authMiddleware, type AppEnv, type Sponsee } from './auth'
import { account, execute, treasuryBalance } from './chain'
import { prisma } from './db'
import { env } from './env'
import {
  buildPlan,
  parseRequest,
  quotaLeft,
  refusal,
  RESERVE_PER_TRIPLE_WEI,
  trustToWei,
  windowStarts,
  type Limits,
  type Usage,
} from './policy'

configureClient({ apiUrl: env.indexerUrl })

const limits: Limits = {
  quotaMonthly: env.quotaMonthly,
  quotaDaily: env.quotaDaily,
  budgetMonthlyWei: trustToWei(env.budgetMonthlyTrust),
}
const depositWei = trustToWei(env.depositTrust)
const COUNTED = ['reserved', 'sent'] as const

async function usageOf(privyUserId: string, now = new Date()): Promise<Usage> {
  const { month, day } = windowStarts(now)
  const sum = async (since: Date) =>
    (
      await prisma.sponsoredWrite.aggregate({
        where: {
          privyUserId,
          status: { in: [...COUNTED] },
          createdAt: { gte: since },
        },
        _sum: { recommendCount: true },
      })
    )._sum.recommendCount ?? 0
  return { month: await sum(month), day: await sum(day) }
}

async function spentThisMonth(now = new Date()): Promise<bigint> {
  const agg = await prisma.sponsoredWrite.aggregate({
    where: {
      status: { in: [...COUNTED] },
      createdAt: { gte: windowStarts(now).month },
    },
    _sum: { costWei: true },
  })
  return BigInt(agg._sum.costWei?.toFixed(0) ?? '0')
}

/** Every page must be an atom the indexer knows — no sponsoring junk ids */
async function unknownPages(objectIds: readonly string[]): Promise<string[]> {
  const data = await useAtomsByTermIdsQuery.fetcher({
    atomIds: [...objectIds],
  })()
  const known = new Set(data.atoms.map((a) => a.term_id.toLowerCase()))
  return objectIds.filter((id) => !known.has(id.toLowerCase()))
}

// One request at a time between the quota check and its reservation, so two
// parallel requests can't both pass on the same remaining quota / budget.
let reserving: Promise<unknown> = Promise.resolve()
function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = reserving.then(task)
  reserving = run.catch(() => undefined)
  return run
}

function requireSponsee(c: {
  get: (k: 'sponsee' | 'reason') => unknown
}): Sponsee {
  const sponsee = c.get('sponsee') as Sponsee | null
  if (!sponsee)
    throw new HTTPException(403, { message: String(c.get('reason')) })
  return sponsee
}

const app = new Hono<AppEnv>()

app.use(
  '*',
  cors({
    origin: env.corsOrigins,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['content-type', 'authorization'],
  }),
)

app.get('/health', (c) => c.json({ ok: true, relayer: account.address }))

app.use('/sponsor/*', authMiddleware)

app.get('/sponsor/quota', async (c) => {
  const sponsee = c.get('sponsee')
  if (!sponsee) return c.json({ eligible: false, reason: c.get('reason') })
  const [used, spent] = await Promise.all([
    usageOf(sponsee.privyUserId),
    spentThisMonth(),
  ])
  return c.json({
    eligible: true,
    left: quotaLeft(used, limits),
    used,
    limits: { monthly: limits.quotaMonthly, daily: limits.quotaDaily },
    paused: spent + RESERVE_PER_TRIPLE_WEI > limits.budgetMonthlyWei,
  })
})

app.post('/sponsor/recommend', async (c) => {
  const sponsee = requireSponsee(c)
  const parsed = parseRequest(await c.req.json().catch(() => null))
  if ('error' in parsed) return c.json({ error: parsed.error }, 400)

  const missing = await unknownPages(parsed.pages.map((p) => p.objectId))
  if (missing.length > 0)
    return c.json({ error: 'Unknown page', pages: missing }, 400)

  const plan = buildPlan(parsed.pages)
  const reserve =
    RESERVE_PER_TRIPLE_WEI * BigInt(plan.claims.length + plan.tags.length)

  // Check + reserve atomically (vs. this account's other requests and the
  // relayer-wide budget)
  const reserved = await exclusive(async () => {
    const [used, spent] = await Promise.all([
      usageOf(sponsee.privyUserId),
      spentThisMonth(),
    ])
    const why = refusal(plan.claims.length, used, limits, spent, reserve)
    if (why) return { why }
    const row = await prisma.sponsoredWrite.create({
      data: {
        privyUserId: sponsee.privyUserId,
        wallet: sponsee.wallet,
        objectIds: parsed.pages.map((p) => p.objectId),
        recommendCount: plan.claims.length,
        tagCount: plan.tags.length,
        costWei: reserve.toString(),
      },
    })
    return { row }
  })
  if ('why' in reserved) return c.json({ error: reserved.why }, 429)

  const result = await execute(plan, sponsee.wallet as Hex, depositWei)
  const nothingSent = result.txHashes.length === 0
  await prisma.sponsoredWrite.update({
    where: { id: reserved.row.id },
    data: {
      // A failure before any tx releases the quota; after one, the mined
      // part stays counted at its real cost
      status: result.error && nothingSent ? 'failed' : 'sent',
      costWei: (env.dryRun ? 0n : result.costWei).toString(),
      txHashes: result.txHashes,
      error: result.error ?? null,
    },
  })
  if (result.error && nothingSent)
    return c.json({ error: 'Could not publish — try again' }, 502)

  const used = await usageOf(sponsee.privyUserId)
  return c.json({
    txHashes: result.txHashes,
    recommended: plan.claims.length,
    tagged: plan.tags.length,
    left: quotaLeft(used, limits),
    partial: !!result.error,
    dryRun: env.dryRun,
    deposit: env.depositTrust,
  })
})

app.onError((err, c) => {
  if (err instanceof HTTPException)
    return c.json({ error: err.message }, err.status)
  console.error('[write-relayer]', err)
  return c.json({ error: 'Internal error' }, 500)
})

// A crash between reserve and send leaves `reserved` rows: release them
await prisma.sponsoredWrite.updateMany({
  where: {
    status: 'reserved',
    createdAt: { lt: new Date(Date.now() - 10 * 60_000) },
  },
  data: { status: 'failed', error: 'Released at boot' },
})

const balance = await treasuryBalance().catch(() => null)
console.log(
  `write-relayer on :${env.port} — treasury ${account.address}` +
    (balance === null ? '' : ` (${Number(balance) / 1e18} TRUST)`) +
    (env.dryRun ? ' — DRY RUN' : ''),
)

export default { port: env.port, hostname: '0.0.0.0', fetch: app.fetch }
