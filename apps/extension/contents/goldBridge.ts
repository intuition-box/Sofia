import type { PlasmoCSConfig } from "plasmo"

/**
 * goldBridge — exposes the user's private Gold balance to the Sofia explorer
 * with zero configuration on either side.
 *
 * Gold lives in the extension's `chrome.storage.local` (per-wallet, private).
 * A web page can't read that directly, so this content script — injected only
 * on the Sofia explorer origins — answers a `window.postMessage` request from
 * the page and posts back the total. No extension id, no externally_connectable
 * needed; if the extension isn't installed the page simply gets no reply and
 * the Achievements UI omits the Gold column.
 *
 * Storage keys mirror GoldService:
 *   discovery_gold_{wallet} + certification_gold_{wallet} - spent_gold_{wallet}
 */
export const config: PlasmoCSConfig = {
  matches: ["http://localhost:5174/*", "https://sofia.intuition.box/*"],
  all_frames: false,
  run_at: "document_idle"
}

function goldKeys(wallet: string): [string, string, string] {
  const w = wallet.toLowerCase()
  return [`discovery_gold_${w}`, `certification_gold_${w}`, `spent_gold_${w}`]
}

window.addEventListener("message", (event: MessageEvent) => {
  // Only accept requests from this same page.
  if (event.source !== window) return
  const data = event.data
  if (
    !data ||
    data.source !== "sofia-explorer" ||
    data.type !== "GET_GOLD" ||
    typeof data.wallet !== "string"
  ) {
    return
  }

  const wallet = data.wallet as string
  const [discoveryKey, certKey, spentKey] = goldKeys(wallet)

  chrome.storage.local.get([discoveryKey, certKey, spentKey], (res) => {
    if (chrome.runtime.lastError) return
    const total =
      (res[discoveryKey] || 0) + (res[certKey] || 0) - (res[spentKey] || 0)
    window.postMessage(
      { source: "sofia-extension", type: "GOLD_BALANCE", wallet, gold: total },
      window.location.origin
    )
  })
})
