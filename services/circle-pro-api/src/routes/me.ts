// Caller-scoped reads (behind auth). Powers the circle picker in the extension
// and web app: "which circles can I write to?" — membership from group-api,
// enriched with the workspace name from circle-pro's Circle table.
import { Hono } from 'hono'
import type { AppEnv } from '../auth'
import { getWallet } from '../auth'
import { prisma } from '../db'
import { listCircles } from '../membership'

export const me = new Hono<AppEnv>()

/** GET /me/circles → the circles the caller actively belongs to (+ name). */
me.get('/me/circles', async (c) => {
  const wallet = getWallet(c)
  const memberships = await listCircles(wallet)
  // Join the workspace name (off-chain circles have a Circle row; on-chain-only
  // ids may not yet, hence name can be null).
  const rows = await prisma.circle.findMany({
    where: { id: { in: memberships.map((m) => m.groupTermId) } },
    select: { id: true, name: true },
  })
  const nameById = new Map(rows.map((r) => [r.id, r.name]))
  const circles = memberships.map((m) => ({
    ...m,
    name: nameById.get(m.groupTermId) ?? null,
  }))
  return c.json({ circles })
})
