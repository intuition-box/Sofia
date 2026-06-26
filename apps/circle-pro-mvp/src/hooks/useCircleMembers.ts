/**
 * useCircleMembers — the REAL members of the current circle (replaces mock
 * MEMBERS). Role + profile come from the backend; expertise is derived from the
 * taxonomy tags each member has shared. Re-fetches on circle change. Public read
 * (a token is sent when signed in, not required).
 */
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { useCircle } from './useCircle'
import { getCircleMembers, type CircleMember } from '../services/circleProApi'

export function useCircleMembers() {
  const { authenticated, token } = useAuth()
  const { circleId } = useCircle()
  const [members, setMembers] = useState<CircleMember[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const t = authenticated ? await token() : null
      const m = await getCircleMembers(t, circleId)
      setMembers(m)
    } catch {
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [authenticated, token, circleId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { members, loading, refresh }
}
