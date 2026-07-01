import { useCallback, useEffect, useRef, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'

/**
 * useExplorerOnboarding — drives the first-run guided tour.
 *
 * Trigger: the tour opens once, when Privy authentication flips false → true
 * (the user's first connection) AND the "seen" flag isn't set yet. Persisted
 * in localStorage (same pattern as `useNavCollapse`), so it never replays on
 * later logins or reloads.
 *
 * Exposes `{ active, dismiss, replay }`:
 *  - `active`  — mount + run the tour while true.
 *  - `dismiss` — end the tour and persist the flag (called on finish/skip).
 *  - `replay`  — clear the flag and re-run (wire to a "Replay tutorial" entry).
 */
const STORAGE_KEY = 'sofia:explorer-onboarding-done'

function readSeen(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return true
  }
}

function writeSeen(seen: boolean) {
  try {
    if (seen) window.localStorage.setItem(STORAGE_KEY, 'true')
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore — private mode / storage full
  }
}

export function useExplorerOnboarding() {
  const { ready, authenticated } = usePrivy()
  const [active, setActive] = useState(false)
  // Track the previous auth state so we only fire on the false → true edge,
  // not on every render where the user is already authenticated.
  const wasAuthed = useRef<boolean | null>(null)

  useEffect(() => {
    if (!ready) return
    const prev = wasAuthed.current
    wasAuthed.current = authenticated
    // First observation: if already authenticated on load, don't retro-trigger
    // (a returning user opening the app shouldn't get the tour). Only the live
    // false → true transition counts as a "first connection" this session.
    if (prev === null) return
    if (!prev && authenticated && !readSeen()) {
      setActive(true)
    }
  }, [ready, authenticated])

  const dismiss = useCallback(() => {
    writeSeen(true)
    setActive(false)
  }, [])

  const replay = useCallback(() => {
    writeSeen(false)
    setActive(true)
  }, [])

  return { active, dismiss, replay }
}
