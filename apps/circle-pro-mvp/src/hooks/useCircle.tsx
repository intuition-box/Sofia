/**
 * useCircle — the current workspace (circle) the app reads/writes against.
 *
 * A circle = an on-chain group atom (term_id), and membership lives in group-api.
 * The signed-in user's circles come from `GET /me/circles`. The selection is
 * persisted so a reload keeps the same workspace. When the user has no real
 * membership yet (or group-api isn't wired in local dev), we fall back to the
 * configured DEFAULT circle so the standalone MVP still demos — `isFallback`
 * tells the UI to surface a "create/join a workspace" call to action.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { CIRCLE_ID } from '../config'
import { getMyCircles, createWorkspace, type CircleMembership } from '../services/circleProApi'
import { useAuth } from './useAuth'

const STORAGE_KEY = 'sofia:circle-pro:circleId'

interface CircleState {
  /** Real circles the caller belongs to (empty until they join/create one). */
  circles: CircleMembership[]
  /** The active circleId — always defined (falls back to the default). */
  circleId: string
  /** True when `circleId` is the dev/default fallback (no real membership). */
  isFallback: boolean
  loading: boolean
  setCircle: (id: string) => void
  reload: () => void
  /** Create a workspace, refresh, and switch to it. Returns the new circleId. */
  create: (name: string) => Promise<string>
}

const CircleContext = createContext<CircleState | null>(null)

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Resolve the active circleId: the stored pick if the caller is still a member,
 * else the first real circle, else the default fallback (keeps the MVP usable
 * with no membership). Pure — exported for tests.
 */
export function resolveCircleId(
  circles: CircleMembership[],
  selected: string | null,
  fallback: string,
): string {
  const ids = circles.map((c) => c.groupTermId)
  if (selected && ids.includes(selected)) return selected
  return ids[0] ?? fallback
}

export function CircleProvider({ children }: { children: ReactNode }) {
  const { authenticated, token } = useAuth()
  const [circles, setCircles] = useState<CircleMembership[]>([])
  const [selected, setSelected] = useState<string | null>(readStored)
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!authenticated) {
      setCircles([])
      return
    }
    setLoading(true)
    try {
      const mine = await getMyCircles(await token())
      setCircles(mine)
    } catch {
      setCircles([])
    } finally {
      setLoading(false)
    }
  }, [authenticated, token])

  useEffect(() => {
    reload()
  }, [reload])

  const circleId = useMemo(
    () => resolveCircleId(circles, selected, CIRCLE_ID),
    [circles, selected],
  )

  const isFallback = circles.length === 0 || !circles.some((c) => c.groupTermId === circleId)

  const setCircle = useCallback((id: string) => {
    setSelected(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* ignore quota / privacy-mode failures */
    }
  }, [])

  const create = useCallback(
    async (name: string) => {
      const circle = await createWorkspace(await token(), { name })
      await reload()
      setCircle(circle.id)
      return circle.id
    },
    [token, reload, setCircle],
  )

  const value = useMemo<CircleState>(
    () => ({ circles, circleId, isFallback, loading, setCircle, reload, create }),
    [circles, circleId, isFallback, loading, setCircle, reload, create],
  )

  return <CircleContext.Provider value={value}>{children}</CircleContext.Provider>
}

export function useCircle(): CircleState {
  const ctx = useContext(CircleContext)
  if (!ctx) throw new Error('useCircle must be used within <CircleProvider>')
  return ctx
}
