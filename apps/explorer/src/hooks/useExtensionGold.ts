/**
 * useExtensionGold — reads the connected user's Gold balance from the Sofia
 * browser extension via a content-script bridge.
 *
 * Gold is private and lives in the extension's `chrome.storage.local` (not
 * on-chain, not in any backend the explorer can reach). The extension injects a
 * content script (`contents/goldBridge.ts`) on the explorer origin that answers
 * a `window.postMessage` request — so this needs NO extension id and NO config
 * on either side.
 *
 * Degrades silently: if the extension isn't installed, nothing answers and
 * `gold` stays null, so the Achievements UI omits the Gold column.
 */
import { useEffect, useState } from 'react'

interface GoldResult {
  /** Gold balance, or null when the extension can't be reached. */
  gold: number | null
}

export function useExtensionGold(address: string | undefined): GoldResult {
  const [gold, setGold] = useState<number | null>(null)

  useEffect(() => {
    if (!address) {
      setGold(null)
      return
    }

    let cancelled = false
    const target = address.toLowerCase()

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return
      const d = event.data
      if (
        !d ||
        d.source !== 'sofia-extension' ||
        d.type !== 'GOLD_BALANCE' ||
        typeof d.wallet !== 'string' ||
        d.wallet.toLowerCase() !== target
      ) {
        return
      }
      if (!cancelled) {
        setGold(typeof d.gold === 'number' ? d.gold : null)
      }
    }

    window.addEventListener('message', onMessage)
    // Ask the content script (if any) for this wallet's Gold.
    window.postMessage(
      { source: 'sofia-explorer', type: 'GET_GOLD', wallet: address },
      window.location.origin,
    )

    return () => {
      cancelled = true
      window.removeEventListener('message', onMessage)
    }
  }, [address])

  return { gold }
}
