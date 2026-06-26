/**
 * useDepartmentBookmarks — the bookmarks filed under a team (department) in the
 * current circle. Real data; the department detail view derives skills + tools
 * from these. Public read.
 */
import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { useCircle } from './useCircle'
import { listBookmarks, type PublicBookmark } from '../services/circleProApi'

export function useDepartmentBookmarks(departmentId: string) {
  const { authenticated, token } = useAuth()
  const { circleId } = useCircle()
  const [items, setItems] = useState<PublicBookmark[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    ;(async () => {
      try {
        const t = authenticated ? await token() : null
        const { bookmarks } = await listBookmarks(t, { circleId, departmentId })
        if (alive) setItems(bookmarks)
      } catch {
        if (alive) setItems([])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [circleId, departmentId, authenticated, token])

  return { items, loading }
}
