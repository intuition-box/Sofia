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
import { computeDailyMissions, type MissionPosition } from "@0xsofia/quests"
import { getAddress } from "viem"

import type {
  AddToCartMessage,
  AddToCartResponse,
  AddToSofiaStatusResponse,
  AtomSuggestion,
  SearchAtomsResponse
} from "../lib/addToSofia/types"
import {
  GetUserMarketPositionsDocument,
  intuitionGraphqlClient,
  SearchUrlAtomsDocument
} from "../lib/clients/graphql-client"
import { getAuthUrl } from "../lib/config/externalAuth"
import { cartService, certificationService } from "../lib/services"
import { sessionStore } from "../lib/signer"
import { getFaviconUrl, getProfileUrl } from "../lib/utils"
import { createServiceLogger } from "../lib/utils/logger"
import { getStoredWalletAddress } from "../lib/utils/walletStorage"
import { INTENTION_PREDICATES } from "../types/discovery"
import {
  INTENTION_CONFIG,
  type IntentionConfigEntry,
  type IntentionType
} from "../types/intentionCategories"

const logger = createServiceLogger("AddToSofia")

const ROOT_ID = "sofia-root"
const MORE_ID = "sofia-more"
const PUBLISH_PREFIX = "sofia-pub:"
const CONTEXTS: chrome.contextMenus.ContextType[] = [
  "page",
  "link",
  "selection"
]
const DOCUMENT_PATTERNS = ["http://*/*", "https://*/*"]

/** Right-click publish amount — the WeightModal "Medium" preset (0.5 TRUST) */
const QUICK_PUBLISH_WEIGHT = 500000000000000000n
const QUICK_PUBLISH_LABEL = "0.5 TRUST"

// Intentions (Work…Music), then Trust / Distrust — straight from the single
// source of truth, no local list.
const CONFIG_ENTRIES = Object.entries(INTENTION_CONFIG) as [
  IntentionType,
  IntentionConfigEntry
][]
const MENU_GROUPS = [
  CONFIG_ENTRIES.filter(([, v]) => v.intentionPurpose !== null),
  CONFIG_ENTRIES.filter(([, v]) => v.intentionPurpose === null)
]

function buildMenu() {
  chrome.contextMenus.removeAll(() => {
    const base = { contexts: CONTEXTS, documentUrlPatterns: DOCUMENT_PATTERNS }
    const child = { ...base, parentId: ROOT_ID }
    chrome.contextMenus.create({ ...base, id: ROOT_ID, title: "Sofia" })
    // The full qualification modal (categories, tags, title autocomplete)
    // comes first; the one-click intentions follow.
    chrome.contextMenus.create({
      ...child,
      id: MORE_ID,
      title: "Add to Sofia…"
    })
    MENU_GROUPS.forEach((group, i) => {
      chrome.contextMenus.create({
        ...child,
        id: `sofia-sep-${i}`,
        type: "separator"
      })
      for (const [type, entry] of group) {
        chrome.contextMenus.create({
          ...child,
          id: `${PUBLISH_PREFIX}${type}`,
          title: entry.label
        })
      }
    })
  })
}

// ── Talking to the page ─────────────────────────────────────────────────────

const MODAL_SCRIPT = chrome.runtime
  .getManifest()
  .content_scripts?.flatMap((c) => c.js ?? [])
  .find((file) => file.includes("add-to-sofia-modal"))

const NO_RECEIVER = "Receiving end does not exist"

/**
 * Deliver a message to the page's modal content script. Tabs opened before
 * the extension was (re)loaded have no content script — inject it on demand
 * instead of silently doing nothing, then retry while it mounts.
 */
async function sendToPage(tabId: number, message: object): Promise<boolean> {
  try {
    await chrome.tabs.sendMessage(tabId, message)
    return true
  } catch (error) {
    // Delivered but nobody answered → fine. Only a missing receiver needs work.
    if (!String(error).includes(NO_RECEIVER)) return true
  }
  if (!MODAL_SCRIPT) return false
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [MODAL_SCRIPT]
    })
  } catch (error) {
    logger.warn("Can't inject the Sofia modal in this tab", error)
    return false
  }
  // The modal registers its listener once React has mounted
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 150))
    try {
      await chrome.tabs.sendMessage(tabId, message)
      return true
    } catch (error) {
      if (!String(error).includes(NO_RECEIVER)) return true
    }
  }
  return false
}

// ── In-page feedback ────────────────────────────────────────────────────────

type ToastKind = "pending" | "success" | "error"

function toast(
  tabId: number,
  id: string,
  kind: ToastKind,
  text: string,
  link?: { href: string; label: string }
) {
  void sendToPage(tabId, { type: "SOFIA_TOAST", id, kind, text, link })
}

/** Readable tail of a wrapped error ("Batch creation failed: X" → "X") */
const readableError = (message: string) => {
  const firstLine = message.split("\n")[0]
  const parts = firstLine.split("failed: ")
  return parts[parts.length - 1] || "Publish failed — try again"
}

// MV3 kills an idle worker after ~30s; a publish (atoms + triple + receipts)
// can take longer. Any extension API call resets the idle timer.
async function withKeepAlive<T>(work: () => Promise<T>): Promise<T> {
  const timer = setInterval(() => void chrome.runtime.getPlatformInfo(), 20_000)
  try {
    return await work()
  } finally {
    clearInterval(timer)
  }
}

/**
 * Trend Hunter "Express 3 interests" progress for the toast (best effort,
 * never blocks the publish). The just-published page is added locally in
 * case the indexer hasn't seen it yet.
 */
async function dailyMissionLabel(
  wallet: string,
  publishedObjectId?: string
): Promise<string> {
  try {
    const addresses = [wallet.toLowerCase(), getAddress(wallet)]
    const data = await intuitionGraphqlClient.request(
      GetUserMarketPositionsDocument,
      { addresses, limit: 100, offset: 0 }
    )
    const positions: MissionPosition[] = []
    for (const row of data?.positions ?? []) {
      const triple = row.term?.triple
      if (!triple?.object?.term_id) continue
      positions.push({
        claimTermId: triple.term_id,
        pageKey: triple.object.term_id,
        createdAt: Date.parse(row.created_at),
        deposit: BigInt(row.total_deposit_assets_after_total_fees ?? "0")
      })
    }
    if (publishedObjectId) {
      positions.push({
        claimTermId: "just-published",
        pageKey: publishedObjectId,
        createdAt: Date.now(),
        deposit: QUICK_PUBLISH_WEIGHT
      })
    }
    const [express] = computeDailyMissions({
      positions,
      trendingKeys: new Set(),
      pioneerClaimIds: new Set()
    })
    return express.done
      ? " · Daily mission ✓"
      : ` · Mission ${express.progress}/${express.target}`
  } catch (error) {
    logger.warn("Mission progress unavailable", error)
    return ""
  }
}

const inFlight = new Set<string>()

/**
 * Right-click → intention. With an active "publish without popup" permission
 * it publishes right away (no panel, no popup); otherwise it queues the page
 * in the cart and tells the user how to enable one-click publishing.
 */
async function handleQuickPublish(
  tabId: number,
  url: string,
  title: string | null,
  type: IntentionType
) {
  const entry = INTENTION_CONFIG[type]
  const predicateName = entry.predicateLabel
  if (!predicateName) return
  const toastId = `${type}:${url}`

  const wallet = await getStoredWalletAddress()
  if (!wallet) {
    toast(tabId, toastId, "error", "Connect your wallet to Sofia first")
    chrome.tabs.create({ url: getAuthUrl({ autoLogin: true }) })
    return
  }

  const session = await sessionStore.getActive(wallet)
  if (!session) {
    const added = await cartService.addItem(
      wallet,
      url,
      title,
      predicateName,
      entry.intentionPurpose,
      getFaviconUrl(url, 128)
    )
    toast(
      tabId,
      toastId,
      added ? "success" : "error",
      added
        ? `Added to your cart · ${entry.label} — enable "Publish without popup" in Settings to publish in one click`
        : "Already in your cart"
    )
    return
  }

  const key = `${predicateName}|${url}`
  if (inFlight.has(key)) return
  inFlight.add(key)
  toast(tabId, toastId, "pending", `Publishing · ${entry.label}…`)
  try {
    const result = await withKeepAlive(() =>
      certificationService.publishNow(
        wallet,
        { url, title, predicateName },
        QUICK_PUBLISH_WEIGHT
      )
    )
    if (result.success) {
      const mission = await dailyMissionLabel(wallet, result.objectId)
      toast(
        tabId,
        toastId,
        "success",
        `Published · ${entry.label} · ${QUICK_PUBLISH_LABEL}${mission}`,
        { href: getProfileUrl(), label: "View" }
      )
    } else {
      toast(tabId, toastId, "error", readableError(result.error ?? ""))
    }
  } finally {
    inFlight.delete(key)
  }
}

// Queue the qualified page into the connected wallet's cart — ONE cart item per
// chosen intention (the cart's compound key is wallet:url:predicate, so multiple
// predicates on the same URL coexist). No wallet → the modal prompts a connect;
// an unknown predicate / duplicate is rejected by CartService.addItem (returns
// false). We report ok when at least one item was queued; all-duplicate → the
// "already in your cart" toast.
export async function handleAddToCart(
  msg: AddToCartMessage
): Promise<AddToCartResponse> {
  const wallet = await getStoredWalletAddress()
  if (!wallet) return { ok: false, reason: "no-wallet" }
  const intentions = msg.intentions ?? []
  if (!intentions.length) return { ok: false, reason: "error" }
  try {
    const favicon = getFaviconUrl(msg.url, 128)
    let anyAdded = false
    for (const intention of intentions) {
      const added = await cartService.addItem(
        wallet,
        msg.url,
        msg.title || null,
        INTENTION_PREDICATES[intention],
        intention,
        favicon,
        msg.contextSlugs,
        msg.objectTermId
      )
      anyAdded = anyAdded || added
    }
    return anyAdded ? { ok: true } : { ok: false, reason: "duplicate" }
  } catch (e) {
    logger.warn("addItem failed", e)
    return { ok: false, reason: "error" }
  }
}

// Connection pre-check for the modal: the content script can't read
// chrome.storage.session (wallet lives there, not exposed to content contexts),
// so it asks the SW on open. Drives the modal's connect-first affordance — when
// disconnected it swaps its primary button for one that opens the side panel.
export async function handleAddToSofiaStatus(): Promise<AddToSofiaStatusResponse> {
  const wallet = await getStoredWalletAddress()
  return { connected: !!wallet }
}

// Title autocomplete: find existing url/thing atoms matching the typed string,
// so the user reuses a canonical atom instead of minting a duplicate. Runs in
// the SW because content scripts can't reach the indexer (CORS).
export async function handleSearchAtoms(
  query: string
): Promise<SearchAtomsResponse> {
  const q = query.trim()
  if (q.length < 2) return { atoms: [] }
  try {
    const data = await intuitionGraphqlClient.request(SearchUrlAtomsDocument, {
      like: `%${q}%`,
      limit: 8
    })
    const atoms: AtomSuggestion[] = (data?.atoms ?? []).map((a: any) => ({
      termId: a.term_id,
      label:
        a.label || a.value?.thing?.name || a.value?.thing?.url || a.term_id,
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
    const menuId = String(info.menuItemId)
    if (!tab?.id || !menuId.startsWith("sofia-")) return

    // A right-clicked link wins over the page itself.
    const isLink = !!info.linkUrl
    const url = info.linkUrl || info.pageUrl || tab.url || ""
    if (!url) return

    if (menuId.startsWith(PUBLISH_PREFIX)) {
      const type = menuId.slice(PUBLISH_PREFIX.length) as IntentionType
      if (!(type in INTENTION_CONFIG)) return
      void handleQuickPublish(
        tab.id,
        url,
        isLink ? null : tab.title || null,
        type
      )
      return
    }

    if (menuId !== MORE_ID) return
    const title = isLink ? url : tab.title || url
    void sendToPage(tab.id, { type: "ADD_TO_SOFIA_OPEN", url, title, isLink })
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
