import { useSyncExternalStore } from "react"
import { globalStakeService } from "~/lib/services"

/**
 * Hook for global stake state (position, P&L, vault stats).
 * Uses useSyncExternalStore — auto-initializes on first subscription,
 * reacts to wallet changes via chrome.storage.session.
 */
export const useGlobalStake = () => {
  const state = useSyncExternalStore(
    globalStakeService.subscribe,
    globalStakeService.getSnapshot
  )

  return {
    ...state,
    refetch: () => globalStakeService.refetch()
  }
}
