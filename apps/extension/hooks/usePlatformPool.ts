/**
 * usePlatformPool Hook
 * Thin wrapper over PlatformPoolService (mirrors useGlobalStake pattern).
 */

import { useCallback, useSyncExternalStore } from "react"
import { platformPoolService } from "~/lib/services"

export const PP_FEE_DENOMINATOR = 100000

export const usePlatformPool = () => {
  const state = useSyncExternalStore(
    platformPoolService.subscribe,
    platformPoolService.getSnapshot
  )

  const getUserPercentage = useCallback(
    () => platformPoolService.getUserPercentage(),
    []
  )

  const setUserPercentage = useCallback(
    (pct: number) => platformPoolService.setUserPercentage(pct),
    []
  )

  const detectPlatformFromUrl = useCallback(
    (url: string) => platformPoolService.detectPlatformFromUrl(url),
    []
  )

  return {
    ...state,
    ppEnabled: platformPoolService.isEnabled(),
    getUserPercentage,
    setUserPercentage,
    detectPlatformFromUrl,
  }
}
