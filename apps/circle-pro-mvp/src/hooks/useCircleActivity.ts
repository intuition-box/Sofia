/**
 * useCircleActivity — the circle's real activity feed (shares + comments).
 * Follows the project's paginated-feed shape. Public read (token sent when
 * signed in). Re-fetches page 0 on circle change.
 */
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { useCircle } from './useCircle'
import { getCircleActivity, type ActivityItem } from '../services/circleProApi'

const dedupe = (list: ActivityItem[]): ActivityItem[] => {
  const seen = new Set<string>()
  return list.filter((i) => {
    const k = `${i.kind}:${i.id}`
    return seen.has(k) ? false : (seen.add(k), true)
  })
}

export function useCircleActivity() {
  const { authenticated, token } = useAuth()
  const { circleId } = useCircle()
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tok = useCallback(
    async () => (authenticated ? await token() : null),
    [authenticated, token],
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await getCircleActivity(await tok(), { offset: 0, circleId })
      setItems(page.items)
      setHasMore(page.hasMore)
    } catch (e) {
      setError((e as Error).message || 'Could not load activity')
      setItems([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [tok, circleId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const page = await getCircleActivity(await tok(), { offset: items.length, circleId })
      setItems((xs) => dedupe([...xs, ...page.items]))
      setHasMore(page.hasMore && page.items.length > 0)
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [tok, circleId, items.length, hasMore, loadingMore])

  return { items, loading, loadingMore, hasMore, loadMore, refresh, error }
}
