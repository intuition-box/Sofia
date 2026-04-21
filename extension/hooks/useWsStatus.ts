/**
 * useWsStatus — live WS connection status for the popup.
 *
 * The SW mirrors its in-memory wsStatus store into chrome.storage.local
 * under `sofia-ws-status` on every change. This hook subscribes to that
 * key via chrome.storage.onChanged and returns the current snapshot.
 *
 * Renders `WsStatusBadge` in the header when status !== "connected".
 */

import { useEffect, useState } from "react"

import type { WsStatusSnapshot } from "~/lib/realtime/wsStatus"

const STORAGE_KEY = "sofia-ws-status"

const INITIAL: WsStatusSnapshot = {
  status: "idle",
  lastConnectedAt: 0,
  lastDisconnectedAt: 0,
  reconnectAttempts: 0,
  lastError: null
}

export function useWsStatus(): WsStatusSnapshot {
  const [snapshot, setSnapshot] = useState<WsStatusSnapshot>(INITIAL)

  useEffect(() => {
    let cancelled = false

    // Initial read from storage so we hydrate with whatever the SW
    // persisted before the popup mounted.
    chrome.storage.local
      .get(STORAGE_KEY)
      .then((result) => {
        if (cancelled) return
        const stored = result[STORAGE_KEY] as WsStatusSnapshot | undefined
        if (stored) setSnapshot(stored)
      })
      .catch(() => {
        // First-mount race where storage isn't ready yet — stay on INITIAL.
      })

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area !== "local") return
      const change = changes[STORAGE_KEY]
      if (!change) return
      const next = change.newValue as WsStatusSnapshot | undefined
      if (next) setSnapshot(next)
    }

    chrome.storage.onChanged.addListener(listener)
    return () => {
      cancelled = true
      chrome.storage.onChanged.removeListener(listener)
    }
  }, [])

  return snapshot
}
