import { useCallback, useEffect, useState } from "react"

import { delegationService, type DelegationStatus } from "~/lib/services"
import { SESSION_KEY_PREFIX } from "~/lib/signer"
import { createHookLogger } from "~/lib/utils"

import { useWalletFromStorage } from "./useWalletFromStorage"

const logger = createHookLogger("useDelegatedPublishing")

/** "Publish without popup" status + actions for the connected wallet */
export const useDelegatedPublishing = () => {
  const { walletAddress } = useWalletFromStorage()
  const [status, setStatus] = useState<DelegationStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setStatus(null)
      return
    }
    setLoading(true)
    try {
      setStatus(await delegationService.getStatus(walletAddress))
      setError(null)
    } catch (err) {
      logger.error("Failed to load delegation status", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    refresh()
    // Activation completes in another tab → storage change brings us back
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (
        area === "local" &&
        Object.keys(changes).some((k) => k.startsWith(SESSION_KEY_PREFIX))
      ) {
        refresh()
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [refresh])

  const run = useCallback(
    (action: (wallet: string) => Promise<void>) => async () => {
      if (!walletAddress) return
      try {
        await action(walletAddress)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    },
    [walletAddress]
  )

  return {
    status,
    loading,
    error,
    refresh,
    activate: run((w) => delegationService.startActivation(w)),
    topUp: run((w) => delegationService.openTopUp(w)),
    deactivate: run((w) => delegationService.deactivate(w))
  }
}
