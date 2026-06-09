/**
 * Cart Close Reminder — Content Script
 *
 * Warns the user (via beforeunload) before leaving a page while items
 * are still pending in the cart. The former in-page browsing nudge was
 * replaced by a red numbered badge on the extension icon.
 */

import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

// ── Cart close reminder (beforeunload) ──

let cartBeforeUnloadActive = false

function cartBeforeUnloadHandler(event: BeforeUnloadEvent) {
  event.preventDefault()
}

function updateCartBeforeUnload(count: number) {
  if (count > 0 && !cartBeforeUnloadActive) {
    window.addEventListener("beforeunload", cartBeforeUnloadHandler)
    cartBeforeUnloadActive = true
  } else if (count <= 0 && cartBeforeUnloadActive) {
    window.removeEventListener("beforeunload", cartBeforeUnloadHandler)
    cartBeforeUnloadActive = false
  }
}

// Check initial cart count on load
chrome.storage.session.get("cartItemCount").then((result) => {
  updateCartBeforeUnload(result.cartItemCount || 0)
}).catch(() => {})

// React to cart count changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "session" && changes.cartItemCount) {
    updateCartBeforeUnload(changes.cartItemCount.newValue || 0)
  }
})
