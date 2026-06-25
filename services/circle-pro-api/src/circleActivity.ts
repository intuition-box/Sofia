// Build the circle Activity feed: a merged, time-sorted stream of the REAL
// events we already store — bookmarks shared + comments posted. Derived, no new
// table. Pure (merge + sort) so it's unit-tested without a DB.
import type { Bookmark, Comment, Profile } from '@prisma/client'
import { publicProfile, type PublicProfile } from './serialize'

export interface ActivityItem {
  kind: 'share' | 'comment'
  id: string
  createdAt: string
  author: PublicProfile
  /** Normalised URL the event is about (the join key). */
  bookmarkKey: string
  /** share: the bookmark title + url. */
  title?: string
  url?: string
  /** comment: the text. */
  text?: string
}

type BookmarkWithAuthor = Bookmark & { author: Profile }
type CommentWithAuthor = Comment & { author: Profile }

/** Merge shares + comments into one feed, newest first. Slicing is the caller's. */
export function buildActivity(
  bookmarks: BookmarkWithAuthor[],
  comments: CommentWithAuthor[],
): ActivityItem[] {
  const shares: ActivityItem[] = bookmarks.map((b) => ({
    kind: 'share',
    id: b.id,
    createdAt: b.createdAt.toISOString(),
    author: publicProfile(b.author),
    bookmarkKey: b.normalizedUrl,
    title: b.title,
    url: b.url,
  }))
  const posts: ActivityItem[] = comments.map((c) => ({
    kind: 'comment',
    id: c.id,
    createdAt: c.createdAt.toISOString(),
    author: publicProfile(c.author),
    bookmarkKey: c.bookmarkKey,
    text: c.text,
  }))
  return [...shares, ...posts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}
