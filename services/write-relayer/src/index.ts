/**
 * write-relayer — sponsored writes.
 *
 * Every signed-in user (email / Google embedded wallet or their own crypto
 * wallet) gets free Recommends: Sofia's treasury account sends them through
 * SofiaFeeProxy with `receiver` = the user's wallet, so every position is the
 * user's — and withdrawable. Quota per account (month / day) and hard
 * monthly + daily budgets for the whole relayer; plan in
 * docs/plans/SPONSORED_WRITES_PLAN.md.
 *
 *   GET  /health
 *   GET  /sponsor/quota       (Privy bearer) → eligibility + Recommends left
 *        (Trend Hunter credits included: spotted pages and missions this
 *        month add some)
 *   POST /sponsor/recommend   (Privy bearer) { wallet?, pages: [{ objectId | thing, tags? }] }
 *        `thing` (extension): a page with no atom yet — pinned, then minted
 *        409 { needsApproval } until the wallet approved SofiaFeeProxy once
 *   POST /sponsor/oppose      (Privy bearer) { wallet?, objectIds } → free
 *        opposes on pages one other person recommended (sorting queue)
 *   POST /sponsor/gas         (Privy bearer) { wallet? } → gas for that one approval
 *   POST   /sponsor/extension-session (Privy bearer) → { token, expiresAt }
 *   DELETE /sponsor/extension-session (extension token) → revoke it
 * Every /sponsor/* route also takes `Authorization: Extension <token>`.
 * Second opinions (a recommend or an oppose on a page exactly one other
 * account recommended) don't count against the quota: their own daily cap.
 * `wallet`: the account's wallet that receives the positions (default: its
 * embedded wallet, else its first one).
 */
import {
  configureClient,
  useAtomsByTermIdsQuery,
  useClaimSupportersQuery,
} from '@0xsofia/graphql'
import { needsSecondOpinion } from '@0xsofia/quests'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import type { Hex } from 'viem'
import {
  authMiddleware,
  createExtensionSession,
  receiverOf,
  revokeExtensionSession,
  type AppEnv,
  type Sponsee,
} from './auth'
import {
  account,
  execute,
  fundApprovalGas,
  pageAtomOf,
  treasuryBalance,
  type Execution,
} from './chain'
import { pinPage } from './pin'
import { creditsOf } from './credits'
import { prisma } from './db'
import { env } from './env'
import {
  buildOpposePlan,
  buildPlan,
  MAX_PAGES_PER_REQUEST,
  opinionsLeft,
  parseRequest,
  recommendClaimId,
  splitOpinions,
  quotaLeft,
  refusal,
  RESERVE_PER_TRIPLE_WEI,
  trustToWei,
  windowStarts,
  type Limits,
  type PageRequest,
  type Spent,
  type Usage,
  withCredits,
} from './policy'

configureClient({
  apiUrl: env.indexerUrl,
  pinApiUrl: env.pinApiKey ? env.pinUrl : undefined,
  pinApiKey: env.pinApiKey || undefined,
})

const limits: Limits = {
  quotaMonthly: env.quotaMonthly,
  quotaDaily: env.quotaDaily,
  budgetMonthlyWei: trustToWei(env.budgetMonthlyTrust),
  budgetDailyWei: trustToWei(env.budgetDailyTrust),
  opinionsDaily: env.opinionsDaily,
}
const depositWei = trustToWei(env.depositTrust)
const COUNTED = ['reserved', 'sent'] as const

async function usageOf(privyUserId: string, now = new Date()): Promise<Usage> {
  const { month, day } = windowStarts(now)
  const sum = (since: Date) =>
    prisma.sponsoredWrite.aggregate({
      where: {
        privyUserId,
        status: { in: [...COUNTED] },
        createdAt: { gte: since },
      },
      _sum: { recommendCount: true, opinionCount: true },
    })
  const [m, d] = await Promise.all([sum(month), sum(day)])
  return {
    month: m._sum.recommendCount ?? 0,
    day: d._sum.recommendCount ?? 0,
    opinionsDay: d._sum.opinionCount ?? 0,
  }
}

async function spent(now = new Date()): Promise<Spent> {
  const { month, day } = windowStarts(now)
  const sum = async (since: Date) => {
    const agg = await prisma.sponsoredWrite.aggregate({
      where: { status: { in: [...COUNTED] }, createdAt: { gte: since } },
      _sum: { costWei: true },
    })
    return BigInt(agg._sum.costWei?.toFixed(0) ?? '0')
  }
  return { month: await sum(month), day: await sum(day) }
}

/** Every page must be an atom the indexer knows — no sponsoring junk ids */
async function unknownPages(objectIds: readonly string[]): Promise<string[]> {
  const data = await useAtomsByTermIdsQuery.fetcher({
    atomIds: [...objectIds],
  })()
  const known = new Set(data.atoms.map((a) => a.term_id.toLowerCase()))
  return objectIds.filter((id) => !known.has(id.toLowerCase()))
}

/**
 * Pages waiting for a second opinion right now: exactly one other account
 * recommended them (shared rule with the "Sort your pages" mission)
 */
async function openForOpinion(
  objectIds: readonly string[],
  wallets: readonly string[],
): Promise<Set<string>> {
  const claimOf = new Map<string, string>(
    objectIds.map((id) => [recommendClaimId(id).toLowerCase(), id]),
  )
  const data = await useClaimSupportersQuery.fetcher({
    claimTermIds: [...claimOf.keys()],
  })()
  const own = new Set(wallets.map((w) => w.toLowerCase()))
  const now = Date.now()
  const open = new Set<string>()
  for (const t of data.triples ?? []) {
    const backers = new Map([
      [
        t.term_id,
        (t.support ?? []).map((p) => ({
          account: p.account_id,
          createdAt: Date.parse(p.created_at),
        })),
      ],
    ])
    const objectId = claimOf.get(t.term_id.toLowerCase())
    if (objectId && needsSecondOpinion(t.term_id, now, backers, own))
      open.add(objectId)
  }
  return open
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
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['content-type', 'authorization'],
  }),
)

app.get('/health', (c) => c.json({ ok: true, relayer: account.address }))

app.use('/sponsor/*', authMiddleware)

app.get('/sponsor/quota', async (c) => {
  const sponsee = c.get('sponsee')
  if (!sponsee) return c.json({ eligible: false, reason: c.get('reason') })
  const [used, out, credits] = await Promise.all([
    usageOf(sponsee.privyUserId),
    spent(),
    creditsOf(sponsee.wallets),
  ])
  const mine = withCredits(limits, credits.total)
  return c.json({
    eligible: true,
    left: quotaLeft(used, mine),
    opinionsLeft: opinionsLeft(used, mine),
    used,
    credits: credits.total,
    creditsFrom: { spotted: credits.spotted, missions: credits.missions },
    limits: { monthly: mine.quotaMonthly, daily: mine.quotaDaily },
    paused:
      out.month + RESERVE_PER_TRIPLE_WEI > limits.budgetMonthlyWei ||
      out.day + RESERVE_PER_TRIPLE_WEI > limits.budgetDailyWei,
  })
})

type Reserved = Awaited<ReturnType<typeof prisma.sponsoredWrite.create>>

/** Records what landed and maps a failure to its response, or null */
async function settle(row: Reserved, result: Execution) {
  const nothingSent = result.txHashes.length === 0
  await prisma.sponsoredWrite.update({
    where: { id: row.id },
    data: {
      // A failure before any tx releases the quota; after one, the mined
      // part stays counted at its real cost
      status: result.error && nothingSent ? 'failed' : 'sent',
      costWei: (env.dryRun ? 0n : result.costWei).toString(),
      txHashes: result.txHashes,
      error: result.error ?? null,
    },
  })
  if (result.notApproved && nothingSent)
    return {
      body: {
        error: 'Approve Sofia once to receive free Recommends',
        needsApproval: true,
      },
      status: 409 as const,
    }
  if (result.error && nothingSent)
    return {
      body: {
        error: /RPC Request failed|Bandwidth limit/i.test(result.error)
          ? 'The network is busy — try again in a minute'
          : 'Could not publish — try again',
      },
      status: 502 as const,
    }
  return null
}

app.post('/sponsor/recommend', async (c) => {
  const sponsee = requireSponsee(c)
  const body = await c.req.json().catch(() => null)
  const parsed = parseRequest(body)
  if ('error' in parsed) return c.json({ error: parsed.error }, 400)
  const wallet = receiverOf(sponsee, (body as { wallet?: unknown }).wallet)

  // New pages (extension): pin their fields, then reuse the atom when it
  // already exists — same fields, same atom — or mint it first
  const newPages = parsed.pages.filter((p) => p.thing)
  if (newPages.length > 0 && !env.pinApiKey)
    return c.json({ error: 'New pages are not free right now' }, 400)
  let atoms: Awaited<ReturnType<typeof pageAtomOf>>[]
  try {
    atoms = await Promise.all(
      newPages.map(async (p) => pageAtomOf(await pinPage(p.thing!))),
    )
  } catch (err) {
    console.error('[write-relayer] new page', err)
    return c.json({ error: 'Could not prepare the page — try again' }, 502)
  }
  const atomOf = new Map(newPages.map((p, i) => [p, atoms[i]]))
  const pages: PageRequest[] = parsed.pages.map((p) => ({
    objectId: p.objectId ?? atomOf.get(p)!.id,
    tags: p.tags,
  }))
  const toMint = [
    ...new Map(atoms.filter((a) => !a.exists).map((a) => [a.id, a.data])),
  ].map(([, data]) => data)

  const objectIds = pages.map((p) => p.objectId)
  const minted = new Set(atoms.filter((a) => !a.exists).map((a) => a.id))
  const missing = await unknownPages(objectIds.filter((id) => !minted.has(id)))
  if (missing.length > 0)
    return c.json({ error: 'Unknown page', pages: missing }, 400)

  const plan = buildPlan(pages)
  const reserve =
    RESERVE_PER_TRIPLE_WEI *
    BigInt(toMint.length + plan.claims.length + plan.tags.length)
  const [credits, open] = await Promise.all([
    creditsOf(sponsee.wallets),
    openForOpinion(objectIds, sponsee.wallets),
  ])
  const mine = withCredits(limits, credits.total)

  // Check + reserve atomically (vs. this account's other requests and the
  // relayer-wide budget). Second opinions go outside the quota first.
  const reserved = await exclusive(async () => {
    const [used, out] = await Promise.all([
      usageOf(sponsee.privyUserId),
      spent(),
    ])
    const { opinions, quota } = splitOpinions(
      objectIds,
      (id) => open.has(id),
      opinionsLeft(used, mine),
    )
    const why = refusal(quota.length, used, mine, out, reserve, opinions.length)
    if (why) return { why }
    const row = await prisma.sponsoredWrite.create({
      data: {
        privyUserId: sponsee.privyUserId,
        wallet,
        objectIds,
        recommendCount: quota.length,
        opinionCount: opinions.length,
        tagCount: plan.tags.length,
        costWei: reserve.toString(),
      },
    })
    return { row }
  })
  if ('why' in reserved) return c.json({ error: reserved.why }, 429)

  const result = await execute(
    { atoms: toMint, ...plan },
    wallet as Hex,
    depositWei,
  )
  const failed = await settle(reserved.row, result)
  if (failed) return c.json(failed.body, failed.status)

  const used = await usageOf(sponsee.privyUserId)
  return c.json({
    txHashes: result.txHashes,
    objectIds,
    minted: toMint.length,
    recommended: plan.claims.length,
    tagged: plan.tags.length,
    left: quotaLeft(used, mine),
    opinionsLeft: opinionsLeft(used, mine),
    partial: !!result.error,
    dryRun: env.dryRun,
    deposit: env.depositTrust,
  })
})

/**
 * POST /sponsor/oppose { wallet?, objectIds } — free opposes, only on pages
 * waiting for a second opinion (one other recommender): the sorting queue.
 */
app.post('/sponsor/oppose', async (c) => {
  const sponsee = requireSponsee(c)
  const body = (await c.req.json().catch(() => null)) as {
    wallet?: unknown
    objectIds?: unknown
  } | null
  const raw = body?.objectIds
  if (
    !Array.isArray(raw) ||
    raw.length === 0 ||
    raw.length > MAX_PAGES_PER_REQUEST ||
    !raw.every((id) => typeof id === 'string' && /^0x[0-9a-fA-F]{64}$/.test(id))
  )
    return c.json({ error: 'Invalid pages' }, 400)
  const objectIds = [
    ...new Set((raw as string[]).map((id) => id.toLowerCase())),
  ]
  const wallet = receiverOf(sponsee, body?.wallet)

  const open = await openForOpinion(objectIds, sponsee.wallets)
  if (objectIds.some((id) => !open.has(id)))
    return c.json(
      { error: 'Only pages one person recommended can be opposed for free' },
      400,
    )

  const opposes = buildOpposePlan(objectIds)
  const reserve = RESERVE_PER_TRIPLE_WEI * BigInt(opposes.length)
  const reserved = await exclusive(async () => {
    const [used, out] = await Promise.all([
      usageOf(sponsee.privyUserId),
      spent(),
    ])
    const why = refusal(0, used, limits, out, reserve, opposes.length)
    if (why) return { why }
    const row = await prisma.sponsoredWrite.create({
      data: {
        privyUserId: sponsee.privyUserId,
        wallet,
        kind: 'oppose',
        objectIds,
        recommendCount: 0,
        opinionCount: opposes.length,
        tagCount: 0,
        costWei: reserve.toString(),
      },
    })
    return { row }
  })
  if ('why' in reserved) return c.json({ error: reserved.why }, 429)

  const result = await execute(
    { claims: [], tags: [], opposes },
    wallet as Hex,
    depositWei,
  )
  const failed = await settle(reserved.row, result)
  if (failed) return c.json(failed.body, failed.status)

  const used = await usageOf(sponsee.privyUserId)
  return c.json({
    txHashes: result.txHashes,
    opposed: opposes.length,
    opinionsLeft: opinionsLeft(used, limits),
    partial: !!result.error,
    dryRun: env.dryRun,
  })
})

/**
 * POST /sponsor/extension-session (Privy bearer only) → { token, expiresAt }:
 * the landing's /auth hands it to the extension, which then calls the relayer
 * with `Authorization: Extension <token>` (no Privy SDK in the extension).
 */
app.post('/sponsor/extension-session', async (c) => {
  if (c.get('via') !== 'privy')
    return c.json({ error: 'Sign in on Sofia to connect the extension' }, 403)
  requireSponsee(c)
  return c.json(await createExtensionSession(c.get('privyUserId')))
})

/** DELETE /sponsor/extension-session — the extension signs out */
app.delete('/sponsor/extension-session', async (c) => {
  const header = c.req.header('Authorization') ?? ''
  if (c.get('via') === 'extension')
    await revokeExtensionSession(header.slice(10))
  return c.json({ ok: true })
})

// One gas drip per account per hour (the drip itself only goes to a wallet
// that can't pay the approval already)
const lastDrip = new Map<string, number>()
const DRIP_COOLDOWN_MS = 60 * 60_000

app.post('/sponsor/gas', async (c) => {
  const sponsee = requireSponsee(c)
  const body = await c.req.json().catch(() => null)
  const wallet = receiverOf(sponsee, (body as { wallet?: unknown })?.wallet)
  const last = lastDrip.get(sponsee.privyUserId) ?? 0
  if (Date.now() - last < DRIP_COOLDOWN_MS) return c.json({ funded: false })
  lastDrip.set(sponsee.privyUserId, Date.now())
  const txHash = await fundApprovalGas(wallet as Hex)
  return c.json({ funded: !!txHash, txHash, dryRun: env.dryRun })
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
