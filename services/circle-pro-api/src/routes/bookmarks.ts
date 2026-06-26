// Bookmark CRUD — the shared knowledge of the circle. Created by the extension
// ("Share in Sofia") or in-app, qualified with a context note + taxonomy tags.
// One row per (author, normalisedUrl, circle); re-sharing updates it.
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { normalizeUrl } from '@0xsofia/url-key'
import type { AppEnv } from '../auth'
import { getWallet, optionalAuthMiddleware } from '../auth'
import { prisma } from '../db'
import { assertMember } from '../membership'
import { publicBookmark, publicProfile, type PublicProfile } from '../serialize'

export const bookmarks = new Hono<AppEnv>() // writes (auth)
export const bookmarksRead = new Hono<AppEnv>() // reads (optional auth)

const DEFAULT_CIRCLE = 'acme'
const PAGE_SIZE = 40
const MAX_SHARER_KEYS = 200
const withMeta = { author: true, tags: true } as const

type IncomingTag = { id?: string; label?: string; color?: string; level?: string }

async function requireProfile(wallet: string) {
  const p = await prisma.profile.findUnique({ where: { wallet } })
  if (!p) throw new HTTPException(409, { message: 'Create a profile first' })
}

/** Create or update a shared bookmark (author + normalised URL + circle). */
bookmarks.post('/bookmarks', async (c) => {
  const wallet = getWallet(c)
  await requireProfile(wallet)
  const body = (await c.req.json().catch(() => ({}))) as {
    url?: string
    normalizedUrl?: string
    title?: string
    context?: string
    circleId?: string
    departmentId?: string | null
    tags?: IncomingTag[]
  }

  const url = body.url?.trim()
  const title = body.title?.trim()
  if (!url || !title) {
    throw new HTTPException(400, { message: 'url + title required' })
  }
  // Canonicalise server-side — never trust the client's normalizedUrl. This is
  // THE invariant: the stored key must match what derives the on-chain atom.
  const normalizedUrl = normalizeUrl(url)
  if (!normalizedUrl) throw new HTTPException(400, { message: 'invalid url' })
  const circleId = body.circleId ?? DEFAULT_CIRCLE
  // Writes are members-only — group-api is the source of truth (no-op in dev).
  await assertMember(wallet, circleId)
  const departmentId = body.departmentId ?? null
  const tags = (body.tags ?? [])
    .filter((t): t is Required<IncomingTag> => !!t?.id && !!t?.label)
    .map((t) => ({ tagId: t.id, label: t.label, color: t.color || '#8f8ca8', level: t.level || 'topic' }))

  const saved = await prisma.bookmark.upsert({
    where: { authorWallet_normalizedUrl_circleId: { authorWallet: wallet, normalizedUrl, circleId } },
    update: {
      url,
      title,
      context: body.context?.trim() ?? '',
      departmentId,
      tags: { deleteMany: {}, create: tags },
    },
    create: {
      url,
      normalizedUrl,
      title,
      context: body.context?.trim() ?? '',
      circleId,
      departmentId,
      authorWallet: wallet,
      tags: { create: tags },
    },
    include: withMeta,
  })
  return c.json({ bookmark: publicBookmark(saved) }, 201)
})

/** Delete one of the caller's bookmarks. */
bookmarks.delete('/bookmarks/:id', async (c) => {
  const wallet = getWallet(c)
  const id = c.req.param('id')
  const existing = await prisma.bookmark.findUnique({ where: { id } })
  if (!existing) throw new HTTPException(404, { message: 'Not found' })
  if (existing.authorWallet !== wallet) throw new HTTPException(403, { message: 'Not yours' })
  await prisma.bookmark.delete({ where: { id } })
  return c.json({ ok: true })
})

/**
 * Who in the circle has shared each of these URLs — REAL social proof for the
 * "who on your team keeps this link" stack. Batched: the My-bookmarks tab asks
 * for every visible URL at once. Public read. POST (a body of keys, not a query).
 */
bookmarksRead.post('/bookmarks/sharers', optionalAuthMiddleware, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    circleId?: string
    normalizedUrls?: string[]
  }
  const circleId = body.circleId ?? DEFAULT_CIRCLE
  const urls = Array.from(
    new Set((body.normalizedUrls ?? []).filter((u): u is string => typeof u === 'string')),
  ).slice(0, MAX_SHARER_KEYS)
  if (!urls.length) return c.json({ sharers: {} })

  const rows = await prisma.bookmark.findMany({
    where: { circleId, normalizedUrl: { in: urls } },
    include: { author: true },
    orderBy: { createdAt: 'asc' },
  })
  // normalizedUrl → unique sharer profiles (oldest share first).
  const sharers: Record<string, PublicProfile[]> = {}
  for (const r of rows) {
    const list = (sharers[r.normalizedUrl] ??= [])
    if (!list.some((p) => p.wallet === r.author.wallet)) list.push(publicProfile(r.author))
  }
  return c.json({ sharers })
})

/** The circle's bookmarks (newest first), paginated. Public read. */
bookmarksRead.get('/bookmarks', optionalAuthMiddleware, async (c) => {
  const circleId = c.req.query('circleId') ?? DEFAULT_CIRCLE
  const offset = Math.max(0, Number(c.req.query('offset') ?? 0))
  const limit = Math.min(PAGE_SIZE, Math.max(1, Number(c.req.query('limit') ?? PAGE_SIZE)))
  const mineOnly = c.req.query('mine') === '1'
  const departmentId = c.req.query('departmentId') || undefined
  const wallet = getWallet(c)

  const where = {
    circleId,
    ...(mineOnly && wallet ? { authorWallet: wallet } : {}),
    ...(departmentId ? { departmentId } : {}),
  }
  const rows = await prisma.bookmark.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit + 1,
    include: withMeta,
  })
  const hasMore = rows.length > limit
  return c.json({
    bookmarks: (hasMore ? rows.slice(0, limit) : rows).map(publicBookmark),
    hasMore,
  })
})
