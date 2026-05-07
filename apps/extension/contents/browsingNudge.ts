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

  // DS tokens are inlined here because the shadow DOM doesn't inherit
  // host stylesheets. Values mirror @0xsofia/design-system dark theme.
  const style = document.createElement("style")
  style.textContent = `
    :host {
      --ds-bg: #0b0a12;
      --ds-border: #25223a;
      --ds-ink: #f5f3ff;
      --ds-muted: #8f8ca8;
      --ds-accent: #ffc6b0;
      --ds-on-accent: #02000e;
      --ds-radius: 12px;
      --ds-font:
        'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto,
        sans-serif;
    }
    .sofia-nudge {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      width: 380px;
      background: var(--ds-bg);
      border: 1px solid var(--ds-border);
      border-radius: var(--ds-radius);
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.04);
      font-family: var(--ds-font);
      animation: sofiaNudgeSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      color: var(--ds-ink);
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
      color: var(--ds-ink);
      margin: 0;
    }
    .sofia-nudge__dismiss {
      background: none;
      border: none;
      color: var(--ds-muted);
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
      color: var(--ds-ink);
      background: rgba(255, 255, 255, 0.08);
    }
    .sofia-nudge__count {
      color: var(--ds-accent);
      font-weight: 700;
    }
    .sofia-nudge__dismiss svg {
      width: 14px;
      height: 14px;
    }
    .sofia-nudge__actions {
      display: flex;
      gap: 8px;
      justify-content: flex-start;
    }
    .sofia-nudge__btn-secondary {
      padding: 8px 18px;
      border-radius: var(--ds-radius);
      border: 1px solid var(--ds-border);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      color: var(--ds-muted);
      background: transparent;
      transition: all 0.15s;
      font-family: inherit;
    }
    .sofia-nudge__btn-secondary:hover {
      color: var(--ds-ink);
      border-color: var(--ds-accent);
    }
    .sofia-nudge__btn-primary {
      padding: 8px 18px;
      border-radius: var(--ds-radius);
      border: 1px solid var(--ds-accent);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      color: var(--ds-on-accent);
      background: var(--ds-accent);
      transition: all 0.2s;
      font-family: inherit;
    }
    .sofia-nudge__btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 198, 176, 0.25);
    }
  `

  const container = document.createElement("div")
  container.className = "sofia-nudge"
  container.innerHTML = `
    <div class="sofia-nudge__header">
      <img src="${sofiaIconUrl}" class="sofia-nudge__icon" alt="Sofia" />
      <p class="sofia-nudge__message">
        <strong class="sofia-nudge__count">${count}</strong> pages browsed, none marked yet.
      </p>
      <button class="sofia-nudge__dismiss" aria-label="Dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="sofia-nudge__actions">
      <button class="sofia-nudge__btn-primary" data-action="certify">Mark now</button>
      <button class="sofia-nudge__btn-secondary" data-action="later">Later</button>
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
