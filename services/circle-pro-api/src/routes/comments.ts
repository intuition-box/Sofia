// Comment CRUD on a bookmark, scoped to a circle. Bookmarks live elsewhere
// (on-chain or off-chain, TBD) — a comment only references `bookmarkKey`, the
// normalised URL, so this layer is independent of that decision.
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../auth'
import { getWallet, optionalAuthMiddleware } from '../auth'
import { prisma } from '../db'
import { assertMember } from '../membership'
import { publicComment } from '../serialize'

// Writes — mounted behind the global auth middleware (token required).
export const comments = new Hono<AppEnv>()
// Reads — mounted before global auth, with optional auth so guests can browse
// the thread while signed-in callers still get their per-comment like state.
export const commentsRead = new Hono<AppEnv>()

const DEFAULT_CIRCLE = 'acme'
const PAGE_SIZE = 30

// include shape that feeds publicComment() — author + per-caller like state.
function withMeta(wallet: string) {
  return {
    author: true,
    likes: { where: { wallet }, select: { id: true } },
    _count: { select: { likes: true } },
  } as const
}

/** The caller must have a profile before they can write (the pseudo gate). */
async function requireProfile(wallet: string) {
  const p = await prisma.profile.findUnique({ where: { wallet } })
  if (!p) {
    throw new HTTPException(409, { message: 'Create a profile first', cause: 'PROFILE_REQUIRED' })
  }
}

/** Load a comment and assert the caller authored it. */
async function requireAuthor(id: string, wallet: string) {
  const c = await prisma.comment.findUnique({ where: { id } })
  if (!c || c.deletedAt) throw new HTTPException(404, { message: 'Comment not found' })
  if (c.authorWallet !== wallet) throw new HTTPException(403, { message: 'Not your comment' })
  return c
}

/** GET thread for a bookmark (oldest-first), paginated by offset. Public. */
commentsRead.get('/bookmarks/:key/comments', optionalAuthMiddleware, async (c) => {
  const wallet = getWallet(c)
  const bookmarkKey = decodeURIComponent(c.req.param('key'))
  const circleId = c.req.query('circleId') ?? DEFAULT_CIRCLE
  const offset = Math.max(0, Number(c.req.query('offset') ?? 0))
  const limit = Math.min(PAGE_SIZE, Math.max(1, Number(c.req.query('limit') ?? PAGE_SIZE)))

  const rows = await prisma.comment.findMany({
    where: { bookmarkKey, circleId },
    orderBy: { createdAt: 'asc' },
    skip: offset,
    take: limit + 1, // fetch one extra to compute hasMore
    include: withMeta(wallet),
  })
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  return c.json({ comments: page.map(publicComment), hasMore })
})

/** Create a comment. */
comments.post('/bookmarks/:key/comments', async (c) => {
  const wallet = getWallet(c)
  await requireProfile(wallet)
  const bookmarkKey = decodeURIComponent(c.req.param('key'))
  const body = (await c.req.json().catch(() => ({}))) as { text?: string; circleId?: string }
  const text = body.text?.trim()
  if (!text) throw new HTTPException(400, { message: 'Empty comment' })
  if (text.length > 4000) throw new HTTPException(400, { message: 'Comment too long' })
  const circleId = body.circleId ?? DEFAULT_CIRCLE
  // Writes are members-only — group-api is the source of truth (no-op in dev).
  await assertMember(wallet, circleId)

  const created = await prisma.comment.create({
    data: { bookmarkKey, circleId, authorWallet: wallet, text },
    include: withMeta(wallet),
  })
  return c.json({ comment: publicComment(created) }, 201)
})

/** Edit a comment (author only). */
comments.patch('/comments/:id', async (c) => {
  const wallet = getWallet(c)
  await requireAuthor(c.req.param('id'), wallet)
  const body = (await c.req.json().catch(() => ({}))) as { text?: string }
  const text = body.text?.trim()
  if (!text) throw new HTTPException(400, { message: 'Empty comment' })
  if (text.length > 4000) throw new HTTPException(400, { message: 'Comment too long' })

  const updated = await prisma.comment.update({
    where: { id: c.req.param('id') },
    data: { text, editedAt: new Date() },
    include: withMeta(wallet),
  })
  return c.json({ comment: publicComment(updated) })
})

/** Soft-delete a comment (author only) — keeps the thread intact. */
comments.delete('/comments/:id', async (c) => {
  const wallet = getWallet(c)
  await requireAuthor(c.req.param('id'), wallet)
  const updated = await prisma.comment.update({
    where: { id: c.req.param('id') },
    data: { deletedAt: new Date() },
    include: withMeta(wallet),
  })
  return c.json({ comment: publicComment(updated) })
})

/** Like a comment (idempotent). */
comments.post('/comments/:id/like', async (c) => {
  const wallet = getWallet(c)
  await requireProfile(wallet)
  const id = c.req.param('id')
  const target = await prisma.comment.findUnique({ where: { id } })
  if (!target || target.deletedAt) throw new HTTPException(404, { message: 'Comment not found' })

  await prisma.commentLike.upsert({
    where: { commentId_wallet: { commentId: id, wallet } },
    update: {},
    create: { commentId: id, wallet },
  })
  const fresh = await prisma.comment.findUniqueOrThrow({ where: { id }, include: withMeta(wallet) })
  return c.json({ comment: publicComment(fresh) })
})

/** Unlike a comment (idempotent). */
comments.delete('/comments/:id/like', async (c) => {
  const wallet = getWallet(c)
  const id = c.req.param('id')
  await prisma.commentLike.deleteMany({ where: { commentId: id, wallet } })
  const fresh = await prisma.comment.findUnique({ where: { id }, include: withMeta(wallet) })
  if (!fresh) throw new HTTPException(404, { message: 'Comment not found' })
  return c.json({ comment: publicComment(fresh) })
})
