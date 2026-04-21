import { useState, useEffect, useCallback } from 'react'
import { fetchStreakLeaderboard, DAILY_CERTIFICATION_ATOM_ID, type StreakEntry } from '../services/streakService'

export function useStreakLeaderboard(atomId: string = DAILY_CERTIFICATION_ATOM_ID) {
  const [entries, setEntries] = useState<StreakEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchStreakLeaderboard(atomId)
      setEntries(data)
      setError(null)
    } catch (err) {
      console.error('[useStreakLeaderboard]', err)
      setError(err instanceof Error ? err.message : 'Failed to load streaks')
    } finally {
      setLoading(false)
    }
  }, [atomId])

  useEffect(() => {
    load()
  }, [load])

  return { entries, loading, error, refresh: load }
}
