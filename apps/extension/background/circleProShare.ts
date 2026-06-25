// "Share in Sofia" context-menu entry + the API broker for the injected modal.
//
// On right-click it tells the page's content script (contents/share-modal.tsx)
// to open the qualification modal. The modal itself can't reach circle-pro-api
// (MV3 content scripts are CORS-bound and can't read session storage), so it
// asks the service worker here — which holds the JWT and fetches with the
// extension's host_permissions.
import { createServiceLogger } from "../lib/utils/logger"
import {
  getCircleProToken,
  getMyCircles,
  postBookmark,
  isNotMemberError,
  isProfileRequiredError,
  CircleProError
} from "../lib/circle-pro/client"
import type {
  ShareLoadResponse,
  ShareSubmitMessage,
  ShareSubmitResponse
} from "../lib/circle-pro/types"

const logger = createServiceLogger("CircleProShare")

const MENU_ID = "share-in-sofia"
const CONTEXTS: chrome.contextMenus.ContextType[] = ["page", "link", "selection"]

function buildMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_ID, title: "Share in Sofia", contexts: CONTEXTS })
  })
}

// Resolve the caller's session + circles for the modal. An expired/cleared JWT
// (or a 401) reads as signed-out so the modal prompts a reconnect.
async function handleLoad(): Promise<ShareLoadResponse> {
  const token = await getCircleProToken()
  if (!token) return { signedOut: true, circles: [] }
  try {
    const circles = await getMyCircles(token)
    return { signedOut: false, circles }
  } catch (e) {
    if (e instanceof CircleProError && e.status === 401) {
      return { signedOut: true, circles: [] }
    }
    // Reachable but failing — let the modal show an empty workspace list.
    logger.warn("getMyCircles failed", e)
    return { signedOut: false, circles: [] }
  }
}

// Perform the share. Maps backend gates to a discriminated result the modal can
// turn into a precise message (not a member / no profile / generic).
async function handleShare(msg: ShareSubmitMessage): Promise<ShareSubmitResponse> {
  const token = await getCircleProToken()
  if (!token) return { ok: false, kind: "error", message: "Not signed in" }
  try {
    await postBookmark(token, msg.payload, msg.circleId)
    return { ok: true }
  } catch (e) {
    if (isNotMemberError(e)) {
      return { ok: false, kind: "not-member", message: "Not a member of this workspace" }
    }
    if (isProfileRequiredError(e)) {
      return { ok: false, kind: "profile-required", message: "Create a Sofia Pro profile first" }
    }
    logger.warn("postBookmark failed", e)
    return { ok: false, kind: "error", message: "Could not share" }
  }
}

export function initCircleProShare(): void {
  chrome.runtime.onInstalled.addListener(buildMenu)
  chrome.runtime.onStartup.addListener(buildMenu)
  // Also build now: the service worker may spin up after install/startup fired.
  buildMenu()

  // API broker for the injected modal (content scripts can't fetch the backend).
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "CIRCLE_PRO_LOAD") {
      handleLoad().then(sendResponse)
      return true // async response
    }
    if (msg?.type === "CIRCLE_PRO_SHARE") {
      handleShare(msg as ShareSubmitMessage).then(sendResponse)
      return true // async response
    }
    return undefined // not ours — let other listeners handle it
  })

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== MENU_ID || !tab?.id) return

    // A right-clicked link wins over the page itself.
    const isLink = !!info.linkUrl
    const url = info.linkUrl || info.pageUrl || tab.url || ""
    const title = isLink ? url : tab.title || url

    chrome.tabs.sendMessage(tab.id, { type: "SHARE_IN_SOFIA", url, title, isLink }, () => {
      // The content script isn't present on tabs opened before the extension
      // loaded (or on restricted pages) — swallow the "no receiver" error.
      void chrome.runtime.lastError
    })
  })

  logger.info("Share in Sofia context menu registered")
}
