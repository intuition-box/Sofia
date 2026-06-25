/**
 * useComments — comment thread for a bookmark. Follows the project's paginated
 * feed shape (items / loading / loadingMore / hasMore / loadMore / refresh /
 * error) plus the write mutations (add / edit / remove / toggleLike).
 *
 * Page 0 lives in the React Query cache; later pages append to a local `extra`
 * buffer so the cache stays a stable head-of-list snapshot (see CLAUDE.md).
 * Reads are public (guests included); writes require auth + a profile, surfaced
 * via `canWrite`.
 */
import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useCircle } from './useCircle'
import { useProfile } from './useProfile'
import {
  listComments,
  postComment,
  editComment,
  deleteComment,
  likeComment,
  unlikeComment,
  type CommentsPage,
  type PublicComment,
} from '../services/circleProApi'

function dedupe(list: PublicComment[]): PublicComment[] {
  const seen = new Set<string>()
  return list.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)))
}

export function useComments(key: string) {
  const { authenticated, token } = useAuth()
  const { circleId } = useCircle()
  const { profile } = useProfile()
  const qc = useQueryClient()
  // circleId in the key so switching workspace refetches the right thread.
  const queryKey = ['comments', circleId, key]

  const [extra, setExtra] = useState<PublicComment[]>([])
  const [extraHasMore, setExtraHasMore] = useState<boolean | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const q = useQuery({
    queryKey,
    enabled: !!key,
    queryFn: async (): Promise<CommentsPage> => {
      const t = authenticated ? await token() : null
      return listComments(t, key, { offset: 0, circleId })
    },
  })

  const page0 = q.data?.comments ?? []
  const items = dedupe([...page0, ...extra])
  const hasMore = extraHasMore ?? q.data?.hasMore ?? false

  // Patch a comment wherever it lives (page-0 cache or the extra buffer).
  const patch = useCallback(
    (id: string, next: PublicComment) => {
      qc.setQueryData<CommentsPage>(queryKey, (d) =>
        d ? { ...d, comments: d.comments.map((c) => (c.id === id ? next : c)) } : d,
      )
      setExtra((xs) => xs.map((c) => (c.id === id ? next : c)))
    },
    [qc], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const t = authenticated ? await token() : null
      const res = await listComments(t, key, { offset: items.length, circleId })
      setExtra((xs) => dedupe([...xs, ...res.comments]))
      setExtraHasMore(res.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [authenticated, token, key, items.length, hasMore, loadingMore, circleId])

  const refresh = useCallback(() => {
    setExtra([])
    setExtraHasMore(null)
    qc.invalidateQueries({ queryKey })
  }, [qc]) // eslint-disable-line react-hooks/exhaustive-deps

  const add = useCallback(
    async (text: string) => {
      const created = await postComment(await token(), key, text, circleId)
      setExtra((xs) => dedupe([...xs, created]))
      return created
    },
    [token, key, circleId],
  )

  const edit = useCallback(
    async (id: string, text: string) => patch(id, await editComment(await token(), id, text)),
    [token, patch],
  )

  const remove = useCallback(
    async (id: string) => patch(id, await deleteComment(await token(), id)),
    [token, patch],
  )

  const toggleLike = useCallback(
    async (c: PublicComment) => {
      // Optimistic flip, reconciled with the server's authoritative counts.
      patch(c.id, {
        ...c,
        likedByMe: !c.likedByMe,
        likeCount: c.likeCount + (c.likedByMe ? -1 : 1),
      })
      const t = await token()
      const fresh = c.likedByMe ? await unlikeComment(t, c.id) : await likeComment(t, c.id)
      patch(c.id, fresh)
    },
    [token, patch],
  )

  return {
    items,
    loading: q.isLoading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
    error: q.error ? (q.error as Error).message : null,
    // Write gating for the composer.
    canWrite: authenticated && !!profile,
    add,
    edit,
    remove,
    toggleLike,
  }
}
