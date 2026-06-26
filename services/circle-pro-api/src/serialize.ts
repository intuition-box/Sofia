// Shared shaping + validation helpers for the public API surface.
import type { Profile, Comment, Bookmark, BookmarkTag, Circle } from '@prisma/client'

const HANDLE_RE = /^[a-z0-9_]{3,20}$/

/** Normalise + validate a handle. Returns the cleaned handle or null if invalid. */
export function cleanHandle(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const h = raw.trim().toLowerCase()
  return HANDLE_RE.test(h) ? h : null
}

export type PublicCircle = {
  id: string
  name: string
  description: string | null
  color: string | null
  ownerWallet: string
  /** On-chain group atom term_id once minted, else null (off-chain). */
  termId: string | null
}

export function publicCircle(c: Circle): PublicCircle {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    color: c.color,
    ownerWallet: c.ownerWallet,
    termId: c.termId,
  }
}

export type PublicProfile = {
  wallet: string
  handle: string
  displayName: string
  avatarSeed: number
}

/** Public projection of a Profile — the wallet is included as a stable id, but
 *  the UI displays handle/displayName, never the address. */
export function publicProfile(p: Profile): PublicProfile {
  return {
    wallet: p.wallet,
    handle: p.handle,
    displayName: p.displayName ?? p.handle,
    avatarSeed: p.avatarSeed,
  }
}

export type PublicTag = { id: string; label: string; color: string; level: string }

type BookmarkWithMeta = Bookmark & { author: Profile; tags: BookmarkTag[] }

export type PublicBookmark = {
  id: string
  url: string
  normalizedUrl: string
  title: string
  context: string
  circleId: string
  author: PublicProfile
  tags: PublicTag[]
  createdAt: string
}

export function publicBookmark(b: BookmarkWithMeta): PublicBookmark {
  return {
    id: b.id,
    url: b.url,
    normalizedUrl: b.normalizedUrl,
    title: b.title,
    context: b.context,
    circleId: b.circleId,
    author: publicProfile(b.author),
    tags: b.tags.map((t) => ({ id: t.tagId, label: t.label, color: t.color, level: t.level })),
    createdAt: b.createdAt.toISOString(),
  }
}

type CommentWithMeta = Comment & {
  author: Profile
  likes: { id: string }[]
  _count: { likes: number }
}

export type PublicComment = {
  id: string
  bookmarkKey: string
  circleId: string
  author: PublicProfile
  text: string | null
  edited: boolean
  deleted: boolean
  likeCount: number
  likedByMe: boolean
  createdAt: string
}

/** Public projection of a Comment. Soft-deleted rows keep their slot in the
 *  thread but drop their text — the UI renders "comment deleted". */
export function publicComment(c: CommentWithMeta): PublicComment {
  const deleted = c.deletedAt != null
  return {
    id: c.id,
    bookmarkKey: c.bookmarkKey,
    circleId: c.circleId,
    author: publicProfile(c.author),
    text: deleted ? null : c.text,
    edited: c.editedAt != null,
    deleted,
    likeCount: c._count.likes,
    likedByMe: c.likes.length > 0,
    createdAt: c.createdAt.toISOString(),
  }
}
