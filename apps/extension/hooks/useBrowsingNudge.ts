/**
 * useBrowsingNudge
 *
 * Listens for BROWSING_NUDGE messages from background.
 * Also checks threshold on mount (side panel may open after threshold was reached).
 */

import { useEffect, useState, useCallback } from "react"
import { createHookLogger } from "~/lib/utils"

const logger = createHookLogger("useBrowsingNudge")

export function useBrowsingNudge() {
  const [showNudge, setShowNudge] = useState(false)

  useEffect(() => {
    // Check if threshold already reached when side panel opens
    chrome.storage.session
      .get("browsingNudgeCount")
      .then((result) => {
        if ((result.browsingNudgeCount || 0) >= 15) {
          setShowNudge(true)
        }
      })
      .catch(() => {})

    // Listen for nudge messages from background
    const handler = (message: { type: string }) => {
      if (message.type === "BROWSING_NUDGE") {
        logger.debug("Browsing nudge received")
        setShowNudge(true)
      }
    }

    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  const dismissNudge = useCallback(() => {
    setShowNudge(false)
    chrome.runtime
      .sendMessage({ type: "NUDGE_DISMISSED" })
      .catch(() => {})
  }, [])

  return { showNudge, dismissNudge }
}
