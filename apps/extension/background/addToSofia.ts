// "Add to Sofia" context-menu entry + the cart broker for the injected modal.
//
// On right-click it tells the page's content script (contents/add-to-sofia-
// modal.tsx) to open the qualification modal. On submit the modal asks this
// service worker to queue the page into the batch-certification CART — the
// content script can't touch the cart's IndexedDB (extension-origin) itself.
//
// PRO (later): the prototype brokered circle-pro-api calls here (CIRCLE_PRO_LOAD
// / CIRCLE_PRO_SHARE → workspace bookmarks). That broker is kept commented at the
// bottom so the Pro version can revive it.
import { createServiceLogger } from "../lib/utils/logger"
import { cartService } from "../lib/services"
import { getFaviconUrl } from "../lib/utils"
import { getStoredWalletAddress } from "../lib/utils/walletStorage"
import { INTENTION_PREDICATES } from "../types/discovery"
import {
  intuitionGraphqlClient,
  SearchUrlAtomsDocument
} from "../lib/clients/graphql-client"
import type {
  AddToCartMessage,
  AddToCartResponse,
  SearchAtomsResponse,
  AtomSuggestion
} from "../lib/addToSofia/types"

const logger = createServiceLogger("AddToSofia")

const MENU_ID = "add-to-sofia"
const CONTEXTS: chrome.contextMenus.ContextType[] = ["page", "link", "selection"]

function buildMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_ID, title: "Add to Sofia", contexts: CONTEXTS })
  })
}

// Queue the qualified page into the connected wallet's cart. No wallet → the
// modal prompts a connect; an unknown predicate / duplicate is rejected by
// CartService.addItem (returns false).
export async function handleAddToCart(msg: AddToCartMessage): Promise<AddToCartResponse> {
  const wallet = await getStoredWalletAddress()
  if (!wallet) return { ok: false, reason: "no-wallet" }
  try {
    const predicateName = INTENTION_PREDICATES[msg.intention]
    const added = await cartService.addItem(
      wallet,
      msg.url,
      msg.title || null,
      predicateName,
      msg.intention,
      getFaviconUrl(msg.url, 128),
      msg.contextSlugs,
      msg.objectTermId
    )
    return added ? { ok: true } : { ok: false, reason: "duplicate" }
  } catch (e) {
    logger.warn("addItem failed", e)
    return { ok: false, reason: "error" }
  }
}

// Title autocomplete: find existing url/thing atoms matching the typed string,
// so the user reuses a canonical atom instead of minting a duplicate. Runs in
// the SW because content scripts can't reach the indexer (CORS).
export async function handleSearchAtoms(query: string): Promise<SearchAtomsResponse> {
  const q = query.trim()
  if (q.length < 2) return { atoms: [] }
  try {
    const data = await intuitionGraphqlClient.request(SearchUrlAtomsDocument, {
      like: `%${q}%`,
      limit: 8
    })
    const atoms: AtomSuggestion[] = (data?.atoms ?? []).map((a: any) => ({
      termId: a.term_id,
      label: a.label || a.value?.thing?.name || a.value?.thing?.url || a.term_id,
      url: a.value?.thing?.url ?? null,
      image: a.image ?? null
    }))
    return { atoms }
  } catch (e) {
    logger.warn("SearchUrlAtoms failed", e)
    return { atoms: [] }
  }
}

export function initAddToSofia(): void {
  chrome.runtime.onInstalled.addListener(buildMenu)
  chrome.runtime.onStartup.addListener(buildMenu)
  // Also build now: the service worker may spin up after install/startup fired.
  buildMenu()

  // NOTE: ADD_TO_CART and SEARCH_ATOMS are routed by the CENTRAL message
  // handler (background/messageHandlers.ts) — NOT a separate listener here.
  // The central switch sends a synchronous "Unknown message type" fallback that
  // would win the sendResponse race against any async listener registered
  // separately, so the modal must be served from inside that switch.

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== MENU_ID || !tab?.id) return

    // A right-clicked link wins over the page itself.
    const isLink = !!info.linkUrl
    const url = info.linkUrl || info.pageUrl || tab.url || ""
    const title = isLink ? url : tab.title || url

    chrome.tabs.sendMessage(tab.id, { type: "ADD_TO_SOFIA_OPEN", url, title, isLink }, () => {
      // The content script isn't present on tabs opened before the extension
      // loaded (or on restricted pages) — swallow the "no receiver" error.
      void chrome.runtime.lastError
    })
  })

  logger.info("Add to Sofia context menu registered")
}

// ── PRO (later): circle-pro workspace share broker ─────────────────────────
// Revive when the Pro version lands. Brokered circle-pro-api calls the content
// script can't make (MV3 content scripts are CORS-bound + can't read session).
//
// import { getCircleProToken, getMyCircles, postBookmark, isNotMemberError,
//   isProfileRequiredError, CircleProError } from "../lib/circle-pro/client"
// import type { ShareLoadResponse, ShareSubmitMessage, ShareSubmitResponse } from "../lib/addToSofia/types"
//
// async function handleLoad(): Promise<ShareLoadResponse> { … getMyCircles(token) … }
// async function handleShare(msg: ShareSubmitMessage): Promise<ShareSubmitResponse> { … postBookmark(…) … }
// // …then in initAddToSofia's onMessage: handle "CIRCLE_PRO_LOAD" / "CIRCLE_PRO_SHARE".
