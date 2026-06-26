// Skills — open knowledge containers a team builds together (the mock's model):
// anyone in the circle creates a skill, adds URLs + tools to it, and votes on
// the URLs. Scoped to a team (departmentId) or the whole circle.
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../auth'
import { authMiddleware, optionalAuthMiddleware, getWallet } from '../auth'
import { prisma } from '../db'
import { assertMember } from '../membership'

export const skills = new Hono<AppEnv>()

/** Resolve a skill + gate the caller as a member of its circle (for writes). */
async function gateSkill(c: { req: { param: (k: string) => string } }, wallet: string) {
  const skill = await prisma.skill.findUnique({ where: { id: c.req.param('skillId') } })
  if (!skill) throw new HTTPException(404, { message: 'Skill not found' })
  await assertMember(wallet, skill.circleId)
  return skill
}

// ── List + create (circle/team scoped) ──

/** GET /circles/:circleId/skills?departmentId= → skill cards (counts). Public. */
skills.get('/circles/:circleId/skills', optionalAuthMiddleware, async (c) => {
  const circleId = c.req.param('circleId')
  const departmentId = c.req.query('departmentId') || undefined
  const rows = await prisma.skill.findMany({
    where: { circleId, ...(departmentId ? { departmentId } : {}) },
    include: { urls: { select: { _count: { select: { votes: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  const skillsList = rows.map((s) => ({
    id: s.id,
    name: s.name,
    topic: s.topic,
    departmentId: s.departmentId,
    createdBy: s.createdBy,
    urlCount: s.urls.length,
    voteCount: s.urls.reduce((a, u) => a + u._count.votes, 0),
  }))
  return c.json({ skills: skillsList })
})

/** POST /circles/:circleId/skills { name, topic?, departmentId? } — members-only. */
skills.post('/circles/:circleId/skills', authMiddleware, async (c) => {
  const circleId = c.req.param('circleId')
  const wallet = getWallet(c)
  await assertMember(wallet, circleId)
  const body = (await c.req.json().catch(() => ({}))) as {
    name?: string
    topic?: string
    departmentId?: string | null
  }
  const name = body.name?.trim()
  if (!name) throw new HTTPException(400, { message: 'name required' })
  const skill = await prisma.skill.create({
    data: { circleId, departmentId: body.departmentId ?? null, name, topic: body.topic || null, createdBy: wallet },
  })
  return c.json({ skill }, 201)
})

// ── Skill detail + contributions ──

/** GET /skills/:skillId → URLs (with vote counts + votedByMe) + tools. Public. */
skills.get('/skills/:skillId', optionalAuthMiddleware, async (c) => {
  const caller = getWallet(c).toLowerCase()
  const skill = await prisma.skill.findUnique({
    where: { id: c.req.param('skillId') },
    include: {
      urls: { include: { votes: { select: { wallet: true } } }, orderBy: { createdAt: 'desc' } },
      tools: true,
    },
  })
  if (!skill) throw new HTTPException(404, { message: 'Skill not found' })
  return c.json({
    skill: {
      id: skill.id,
      circleId: skill.circleId,
      departmentId: skill.departmentId,
      name: skill.name,
      topic: skill.topic,
      createdBy: skill.createdBy,
      urls: skill.urls.map((u) => ({
        id: u.id,
        url: u.url,
        title: u.title,
        addedBy: u.addedBy,
        voteCount: u.votes.length,
        votedByMe: u.votes.some((v) => v.wallet.toLowerCase() === caller),
      })),
      tools: skill.tools.map((t) => ({ id: t.id, name: t.name, host: t.host })),
    },
  })
})

/** POST /skills/:skillId/urls { url, title } — add a link (auto-voted by you). */
skills.post('/skills/:skillId/urls', authMiddleware, async (c) => {
  const wallet = getWallet(c)
  const skill = await gateSkill(c, wallet)
  const body = (await c.req.json().catch(() => ({}))) as { url?: string; title?: string }
  const url = body.url?.trim()
  if (!url) throw new HTTPException(400, { message: 'url required' })
  const created = await prisma.skillUrl.create({
    data: { skillId: skill.id, url, title: body.title?.trim() || url, addedBy: wallet },
  })
  // The adder's own vote (mirrors the mock's votes:1 on add).
  await prisma.skillUrlVote.create({ data: { skillUrlId: created.id, wallet } })
  return c.json({ url: created }, 201)
})

/** POST /skills/:skillId/urls/:urlId/vote — toggle your vote on a URL. */
skills.post('/skills/:skillId/urls/:urlId/vote', authMiddleware, async (c) => {
  const wallet = getWallet(c)
  await gateSkill(c, wallet)
  const skillUrlId = c.req.param('urlId')
  const existing = await prisma.skillUrlVote.findUnique({
    where: { skillUrlId_wallet: { skillUrlId, wallet } },
  })
  if (existing) {
    await prisma.skillUrlVote.delete({ where: { id: existing.id } })
    return c.json({ voted: false })
  }
  await prisma.skillUrlVote.create({ data: { skillUrlId, wallet } })
  return c.json({ voted: true })
})

/** POST /skills/:skillId/tools { name, host? } — attach a tool to the skill. */
skills.post('/skills/:skillId/tools', authMiddleware, async (c) => {
  const wallet = getWallet(c)
  const skill = await gateSkill(c, wallet)
  const body = (await c.req.json().catch(() => ({}))) as { name?: string; host?: string }
  const name = body.name?.trim()
  if (!name) throw new HTTPException(400, { message: 'name required' })
  const tool = await prisma.skillTool.upsert({
    where: { skillId_name: { skillId: skill.id, name } },
    update: {},
    create: { skillId: skill.id, name, host: body.host || null },
  })
  return c.json({ tool }, 201)
})
