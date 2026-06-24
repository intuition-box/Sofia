// Shared shaping + validation helpers for the public API surface.
import type { Profile, Comment } from '@prisma/client'

const HANDLE_RE = /^[a-z0-9_]{3,20}$/

/** Normalise + validate a handle. Returns the cleaned handle or null if invalid. */
export function cleanHandle(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const h = raw.trim().toLowerCase()
  return HANDLE_RE.test(h) ? h : null
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
