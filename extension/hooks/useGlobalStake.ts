import { useCallback, useSyncExternalStore } from "react"
import { globalStakeService } from "~/lib/services"

export const GS_FEE_DENOMINATOR = 100000

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

  const getUserPercentage = useCallback(
    () => globalStakeService.getUserPercentage(),
    []
  )

  const setUserPercentage = useCallback(
    (pct: number) => globalStakeService.setUserPercentage(pct),
    []
  )

  return {
    ...state,
    gsEnabled: globalStakeService.isEnabled(),
    gsConfig: globalStakeService.getConfig(),
    getUserPercentage,
    setUserPercentage,
    refetch: () => globalStakeService.refetch()
  }
}
