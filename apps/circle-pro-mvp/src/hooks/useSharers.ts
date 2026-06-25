/**
 * useSharers — REAL "who in the circle shared this URL" for the bookmark cards
 * (replaces the mocked teammates proof). Batched: pass every visible normalized
 * URL, one request resolves them all. Re-fetches when the URL set or circle
 * changes. Public read (a token is sent when signed in, not required).
 */
import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { useCircle } from './useCircle'
import { getSharers, type PublicProfile } from '../services/circleProApi'

export function useSharers(normalizedUrls: string[]) {
  const { authenticated, token } = useAuth()
  const { circleId } = useCircle()
  const [map, setMap] = useState<Record<string, PublicProfile[]>>({})

  // Stable dependency for the URL set (array identity changes every render).
  const key = normalizedUrls.slice().sort().join('|')

  useEffect(() => {
    if (!normalizedUrls.length) {
      setMap({})
      return
    }
    let alive = true
    ;(async () => {
      try {
        const t = authenticated ? await token() : null
        const sharers = await getSharers(t, normalizedUrls, circleId)
        if (alive) setMap(sharers)
      } catch {
        if (alive) setMap({})
      }
    })()
    return () => {
      alive = false
    }
    // normalizedUrls intentionally excluded — `key` captures its content.
  }, [key, circleId, authenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  return map
}
