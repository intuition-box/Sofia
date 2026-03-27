/**
 * Browsing Nudge — Content Script
 *
 * Injects a notification overlay on the current page when
 * the user has visited 15+ URLs without certifying.
 * Listens for BROWSING_NUDGE messages from background.
 */

import type { PlasmoCSConfig } from "plasmo"
import sofiaIconUrl from "data-base64:~assets/icon-dark-32.png"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

const FALLBACK_COUNT = 15
let notificationEl: HTMLElement | null = null

function createNotification(count = FALLBACK_COUNT) {
  if (notificationEl) return

  const shadow = document.createElement("div")
  shadow.id = "sofia-nudge-root"
  const root = shadow.attachShadow({ mode: "closed" })

  const style = document.createElement("style")
  style.textContent = `
    .sofia-nudge {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      width: 380px;
      background: rgba(10, 9, 8, 0.96);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05);
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: sofiaNudgeSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      color: white;
      box-sizing: border-box;
    }
    @keyframes sofiaNudgeSlide {
      from { opacity: 0; transform: translateY(16px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes sofiaNudgeFadeOut {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to { opacity: 0; transform: translateY(8px) scale(0.97); }
    }
    .sofia-nudge--closing {
      animation: sofiaNudgeFadeOut 0.2s ease-in forwards;
    }
    .sofia-nudge__header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .sofia-nudge__icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      flex-shrink: 0;
    }
    .sofia-nudge__message {
      flex: 1;
      font-size: 13px;
      line-height: 1.5;
      color: rgba(255, 255, 255, 0.88);
      margin: 0;
    }
    .sofia-nudge__dismiss {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.35);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      flex-shrink: 0;
      transition: all 0.15s;
      width: 24px;
      height: 24px;
    }
    .sofia-nudge__dismiss:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }
    .sofia-nudge__count {
      background: linear-gradient(135deg, #3B82F6, #8B5CF6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 700;
    }
    .sofia-nudge__dismiss svg {
      width: 14px;
      height: 14px;
    }
    .sofia-nudge__actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .sofia-nudge__btn-secondary {
      padding: 8px 18px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.6);
      background: transparent;
      transition: all 0.15s;
      font-family: inherit;
    }
    .sofia-nudge__btn-secondary:hover {
      color: white;
      border-color: rgba(255, 255, 255, 0.25);
    }
    .sofia-nudge__btn-primary {
      padding: 8px 18px;
      border-radius: 10px;
      border: none;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      color: white;
      background: linear-gradient(135deg, #3B82F6, #8B5CF6);
      transition: all 0.2s;
      font-family: inherit;
    }
    .sofia-nudge__btn-primary:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
  `

  const container = document.createElement("div")
  container.className = "sofia-nudge"
  container.innerHTML = `
    <div class="sofia-nudge__header">
      <img src="${sofiaIconUrl}" class="sofia-nudge__icon" alt="Sofia" />
      <p class="sofia-nudge__message">
        You've visited <strong class="sofia-nudge__count">${count}</strong> pages without certifying any. Open Sofia to certify them!
      </p>
      <button class="sofia-nudge__dismiss" aria-label="Dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="sofia-nudge__actions">
      <button class="sofia-nudge__btn-secondary" data-action="later">Later</button>
      <button class="sofia-nudge__btn-primary" data-action="certify">Certify Now</button>
    </div>
  `

  root.appendChild(style)
  root.appendChild(container)
  document.body.appendChild(shadow)
  notificationEl = shadow

  // Event handlers
  const dismiss = () => removeNotification(true)

  container.querySelector(".sofia-nudge__dismiss")
    ?.addEventListener("click", dismiss)
  container.querySelector('[data-action="later"]')
    ?.addEventListener("click", dismiss)
  container.querySelector('[data-action="certify"]')
    ?.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "open_sidepanel" }).catch(() => {})
      dismiss()
    })
}

function removeNotification(sendDismiss = false) {
  if (!notificationEl) return

  const shadow = notificationEl.shadowRoot
    ? notificationEl
    : notificationEl
  const root = shadow.shadowRoot
  if (root) {
    const container = root.querySelector(".sofia-nudge")
    if (container) {
      container.classList.add("sofia-nudge--closing")
      setTimeout(() => {
        shadow.remove()
        notificationEl = null
      }, 200)
    } else {
      shadow.remove()
      notificationEl = null
    }
  } else {
    shadow.remove()
    notificationEl = null
  }

  if (sendDismiss) {
    chrome.runtime
      .sendMessage({ type: "NUDGE_DISMISSED" })
      .catch(() => {})
  }
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

// ── Browsing nudge ──

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "BROWSING_NUDGE") {
    createNotification(message.count || FALLBACK_COUNT)
  }
})
