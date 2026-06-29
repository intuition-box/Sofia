// Memory — the team's collective context (decisions, threads, docs, signals).
// Anyone in the circle records one so the team can recall "what did we decide
// about X?" instead of relitigating it. Team-scoped (departmentId).
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { MemoryKind } from '@prisma/client'
import type { AppEnv } from '../auth'
import { authMiddleware, optionalAuthMiddleware, getWallet } from '../auth'
import { prisma } from '../db'
import { assertMember } from '../membership'

export const memory = new Hono<AppEnv>()

const KINDS: MemoryKind[] = ['DOC', 'THREAD', 'DECISION', 'SIGNAL']
const asKind = (raw: unknown): MemoryKind | undefined =>
  KINDS.find((k) => k === String(raw ?? '').toUpperCase())

/** GET /circles/:circleId/memory?departmentId=&kind= → records (newest first). Public. */
memory.get('/circles/:circleId/memory', optionalAuthMiddleware, async (c) => {
  const circleId = c.req.param('circleId')
  const departmentId = c.req.query('departmentId') || undefined
  const kind = asKind(c.req.query('kind'))
  const rows = await prisma.memory.findMany({
    where: { circleId, ...(departmentId ? { departmentId } : {}), ...(kind ? { kind } : {}) },
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ memory: rows })
})

/** POST /circles/:circleId/memory — record a memory (members-only). */
memory.post('/circles/:circleId/memory', authMiddleware, async (c) => {
  const circleId = c.req.param('circleId')
  const wallet = getWallet(c)
  await assertMember(wallet, circleId)
  const body = (await c.req.json().catch(() => ({}))) as {
    kind?: string
    title?: string
    body?: string
    url?: string
    topic?: string
    departmentId?: string | null
  }
  const title = body.title?.trim()
  if (!title) throw new HTTPException(400, { message: 'title required' })
  const rec = await prisma.memory.create({
    data: {
      circleId,
      departmentId: body.departmentId ?? null,
      authorWallet: wallet,
      kind: asKind(body.kind) ?? 'DOC',
      title,
      body: body.body?.trim() || null,
      url: body.url?.trim() || null,
      topic: body.topic || null,
    },
  })
  return c.json({ memory: rec }, 201)
})

/** DELETE /memory/:id — author-only. */
memory.delete('/memory/:id', authMiddleware, async (c) => {
  const wallet = getWallet(c)
  const rec = await prisma.memory.findUnique({ where: { id: c.req.param('id') } })
  if (!rec) throw new HTTPException(404, { message: 'Not found' })
  if (rec.authorWallet !== wallet) throw new HTTPException(403, { message: 'Not yours' })
  await prisma.memory.delete({ where: { id: rec.id } })
  return c.json({ ok: true })
})
