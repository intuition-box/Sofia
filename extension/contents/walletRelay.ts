import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false,
  // Default world is ISOLATED - can communicate with chrome.runtime
}

// Pending requests waiting for response from MAIN world
const pendingRequests = new Map<string, (response: any) => void>()

// Listen for messages from extension (background/sidepanel)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "WALLET_REQUEST") return false

  const { requestId, method, params } = message

  console.log("🔄 [WalletRelay] Forwarding to MAIN world:", method)

  // Store the callback for this request
  pendingRequests.set(requestId, sendResponse)

  // Forward to MAIN world (walletBridge.ts)
  window.postMessage({
    type: "SOFIA_WALLET_REQUEST",
    requestId,
    method,
    params
  }, "*")

  // Return true to indicate we'll respond asynchronously
  return true
})

// Listen for responses from MAIN world (walletBridge.ts)
window.addEventListener("message", (event) => {
  if (event.source !== window) return

  // Handle wallet responses
  if (event.data?.type === "SOFIA_WALLET_RESPONSE") {
    const { requestId, result, error } = event.data
    const callback = pendingRequests.get(requestId)

    if (callback) {
      console.log("🔄 [WalletRelay] Sending response back:", requestId, result ? "success" : "error")
      callback({ result, error })
      pendingRequests.delete(requestId)
    }
  }

  // Handle wallet events (forward to background)
  if (event.data?.type === "SOFIA_WALLET_EVENT") {
    const { event: eventName, data } = event.data
    console.log("📢 [WalletRelay] Forwarding event:", eventName)

    chrome.runtime.sendMessage({
      type: "WALLET_EVENT",
      event: eventName,
      data
    }).catch(() => {
      // Ignore errors (background may not be listening)
    })
  }
})

console.log("🔄 [WalletRelay] Relay initialized")
