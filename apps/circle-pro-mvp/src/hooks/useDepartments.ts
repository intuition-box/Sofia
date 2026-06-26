/**
 * useDepartments — the teams (departments) of the current circle, with create.
 * Public read; create is members-only (backend gate). Re-fetches on circle change.
 */
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { useCircle } from './useCircle'
import {
  getDepartments,
  createDepartment,
  type PublicDepartment,
} from '../services/circleProApi'

export function useDepartments() {
  const { authenticated, token } = useAuth()
  const { circleId } = useCircle()
  const [departments, setDepartments] = useState<PublicDepartment[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const t = authenticated ? await token() : null
      setDepartments(await getDepartments(t, circleId))
    } catch {
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }, [authenticated, token, circleId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const create = useCallback(
    async (name: string, color?: string) => {
      const dept = await createDepartment(await token(), circleId, { name, color })
      await refresh()
      return dept
    },
    [token, circleId, refresh],
  )

  return { departments, loading, create, refresh }
}
