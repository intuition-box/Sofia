// Cross-cutting search — the group's knowledge access. Queries the REAL data
// (bookmarks: title/context/url/tags, comments: text, people: handle/name).
// The frontend merges these with its mock sources (tools/memory/skills) so the
// results page shows the full vision. Public read (optional auth).
import { Hono } from 'hono'
import type { AppEnv } from '../auth'
import { optionalAuthMiddleware } from '../auth'
import { prisma } from '../db'
import { publicBookmark, publicProfile } from '../serialize'

export const search = new Hono<AppEnv>()

const DEFAULT_CIRCLE = 'acme'
const ci = (q: string) => ({ contains: q, mode: 'insensitive' as const })

/** Split a query into words so a multi-word hint ("AI / Machine Learning")
 *  matches on ANY token — clicking a category hint then returns at least what
 *  typing one of its words did. Falls back to the whole query. */
function tokenize(q: string): string[] {
  const tokens = q.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2)
  return tokens.length ? tokens : [q.toLowerCase()]
}

/** GET /search?q=&circleId= — grouped real results. */
search.get('/search', optionalAuthMiddleware, async (c) => {
  const q = (c.req.query('q') ?? '').trim()
  const circleId = c.req.query('circleId') ?? DEFAULT_CIRCLE
  if (q.length < 2) {
    return c.json({ query: q, bookmarks: [], comments: [], people: [] })
  }

  const terms = tokenize(q)
  const bookmarkOr = terms.flatMap((t) => [
    { title: ci(t) },
    { context: ci(t) },
    { normalizedUrl: ci(t) },
    { tags: { some: { label: ci(t) } } },
  ])
  const commentOr = terms.map((t) => ({ text: ci(t) }))
  const peopleOr = terms.flatMap((t) => [{ handle: ci(t) }, { displayName: ci(t) }])

  const [bookmarkRows, commentRows, peopleRows] = await Promise.all([
    prisma.bookmark.findMany({
      where: { circleId, OR: bookmarkOr },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { author: true, tags: true },
    }),
    prisma.comment.findMany({
      where: { circleId, deletedAt: null, OR: commentOr },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { author: true },
    }),
    prisma.profile.findMany({
      where: { OR: peopleOr },
      take: 10,
    }),
  ])

  return c.json({
    query: q,
    bookmarks: bookmarkRows.map(publicBookmark),
    comments: commentRows.map((cm) => ({
      id: cm.id,
      text: cm.text,
      bookmarkKey: cm.bookmarkKey,
      author: publicProfile(cm.author),
      createdAt: cm.createdAt.toISOString(),
    })),
    people: peopleRows.map(publicProfile),
  })
})

/** GET /search/hints?q= — real autocomplete: existing tags, titles, people. */
search.get('/search/hints', optionalAuthMiddleware, async (c) => {
  const q = (c.req.query('q') ?? '').trim()
  if (q.length < 1) return c.json({ hints: [] })

  const [tagRows, bookmarkRows, peopleRows] = await Promise.all([
    prisma.bookmarkTag.findMany({
      where: { label: ci(q) },
      distinct: ['label'],
      take: 5,
      select: { label: true, color: true, tagId: true },
    }),
    prisma.bookmark.findMany({
      where: { title: ci(q) },
      distinct: ['title'],
      take: 4,
      select: { title: true },
    }),
    prisma.profile.findMany({
      where: { OR: [{ handle: ci(q) }, { displayName: ci(q) }] },
      take: 3,
      select: { handle: true, displayName: true },
    }),
  ])

  const hints = [
    ...tagRows.map((t) => ({ type: 'tag', label: t.label, color: t.color, value: t.tagId })),
    ...bookmarkRows.map((b) => ({ type: 'bookmark', label: b.title, value: b.title })),
    ...peopleRows.map((p) => ({
      type: 'person',
      label: p.displayName ?? p.handle,
      value: p.handle,
    })),
  ]
  return c.json({ hints })
})
