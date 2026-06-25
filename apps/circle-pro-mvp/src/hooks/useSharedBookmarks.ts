/**
 * useSharedBookmarks — the user's REAL bookmarks shared into the circle (backend).
 * Read is public; `mine` scopes to the signed-in user. These are merged into the
 * My-bookmarks feed so what you publish (in-app or via the extension) shows up.
 */
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { useCircle } from './useCircle'
import { listBookmarks, type PublicBookmark } from '../services/circleProApi'

export function useSharedBookmarks(mine = true) {
  const { authenticated, token } = useAuth()
  const { circleId } = useCircle()
  const [items, setItems] = useState<PublicBookmark[]>([])

  const refresh = useCallback(async () => {
    try {
      const t = authenticated ? await token() : null
      // `mine` only works signed-in; guests see nothing here.
      if (mine && !t) {
        setItems([])
        return
      }
      const { bookmarks } = await listBookmarks(t, { mine, circleId })
      setItems(bookmarks)
    } catch {
      setItems([])
    }
  }, [authenticated, token, mine, circleId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { items, refresh }
}
