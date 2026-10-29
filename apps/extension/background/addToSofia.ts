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
import { INTENTION_TAGS, type IntentionTag } from "@0xsofia/taxonomy"
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
import { PAGE_MARKET_PREDICATE } from "../lib/config/predicateConstants"
import {
  cartService,
  certificationService,
  freeRecommendService,
  MAX_CART_ITEMS
} from "../lib/services"
import { sessionStore } from "../lib/signer"
import { getFaviconUrl, getProfileUrl, pageAtomData } from "../lib/utils"
import { createServiceLogger } from "../lib/utils/logger"
import { getStoredWalletAddress } from "../lib/utils/walletStorage"

const logger = createServiceLogger("AddToSofia")

const ROOT_ID = "sofia-root"
const MORE_ID = "sofia-more"
const RECOMMEND_FOR_ID = "sofia-recommend-for"
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

/**
 * One-click actions. A page has ONE market (`I | recommends | page`):
 * Recommend = support, Distrust = oppose, "Recommend for…" = support plus
 * an intention tag (feeds Echoes).
 */
interface QuickAction {
  side: "support" | "oppose"
  tag: IntentionTag | null
  label: string
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const QUICK_ACTIONS: Record<string, QuickAction> = {
  recommend: { side: "support", tag: null, label: "Recommended" },
  distrust: { side: "oppose", tag: null, label: "Distrusted" },
  ...Object.fromEntries(
    INTENTION_TAGS.map((tag) => [
      `for-${tag.key}`,
      { side: "support", tag, label: `Recommended · ${capitalize(tag.key)}` }
    ])
  )
}

function buildMenu() {
  chrome.contextMenus.removeAll(() => {
    const base = { contexts: CONTEXTS, documentUrlPatterns: DOCUMENT_PATTERNS }
    const child = { ...base, parentId: ROOT_ID }
    chrome.contextMenus.create({ ...base, id: ROOT_ID, title: "Sofia" })
    // The full qualification modal (tags, title autocomplete, amount) first
    chrome.contextMenus.create({
      ...child,
      id: MORE_ID,
      title: "Add to Sofia…"
    })
    chrome.contextMenus.create({
      ...child,
      id: "sofia-sep-0",
      type: "separator"
    })
    chrome.contextMenus.create({
      ...child,
      id: `${PUBLISH_PREFIX}recommend`,
      title: "Recommend"
    })
    chrome.contextMenus.create({
      ...child,
      id: RECOMMEND_FOR_ID,
      title: "Recommend for…"
    })
    for (const tag of INTENTION_TAGS) {
      chrome.contextMenus.create({
        ...base,
        parentId: RECOMMEND_FOR_ID,
        id: `${PUBLISH_PREFIX}for-${tag.key}`,
        title: capitalize(tag.key)
      })
    }
    chrome.contextMenus.create({
      ...child,
      id: "sofia-sep-1",
      type: "separator"
    })
    chrome.contextMenus.create({
      ...child,
      id: `${PUBLISH_PREFIX}distrust`,
      title: "Distrust"
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
      backers: new Map(),
      own: new Set([wallet.toLowerCase()])
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
 * Right-click → recommend / distrust. With an active "publish without popup"
 * permission it publishes right away (no panel, no popup); otherwise it
 * queues the page in the cart and tells the user how to enable one-click
 * publishing.
 */
async function handleQuickPublish(
  tabId: number,
  url: string,
  title: string | null,
  actionId: string
) {
  const action = QUICK_ACTIONS[actionId]
  if (!action) return
  const toastId = `${actionId}:${url}`
  const contextSlugs = action.tag ? [action.tag.slug] : []

  const wallet = await getStoredWalletAddress()
  if (!wallet) {
    toast(tabId, toastId, "error", "Connect your wallet to Sofia first")
    chrome.tabs.create({ url: getAuthUrl({ autoLogin: true }) })
    return
  }

  // Free first: a Recommend through Sofia's relayer (no signature, no TRUST)
  if (
    action.side === "support" &&
    (await freeRecommendService.getSession(wallet))
  ) {
    const key = `free|${url}`
    if (inFlight.has(key)) return
    inFlight.add(key)
    toast(tabId, toastId, "pending", `Publishing · ${action.label}…`)
    try {
      const free = await withKeepAlive(() =>
        freeRecommendService.recommend(
          wallet,
          pageAtomData(url, title),
          contextSlugs
        )
      )
      if (free.status === "done") {
        const mission = await dailyMissionLabel(
          wallet,
          free.objectId ?? undefined
        )
        toast(tabId, toastId, "success", `${action.label} · free${mission}`, {
          href: getProfileUrl(),
          label: "View"
        })
        return
      }
      // Quota used, relayer down…: the usual paths below
    } finally {
      inFlight.delete(key)
    }
  }

  const session = await sessionStore.getActive(wallet)
  if (!session) {
    const added = await cartService.addItem(
      wallet,
      url,
      title,
      PAGE_MARKET_PREDICATE,
      null,
      getFaviconUrl(url, 128),
      contextSlugs,
      null,
      action.side
    )
    toast(
      tabId,
      toastId,
      added ? "success" : "error",
      added
        ? `Added to your cart · ${action.label} — enable "Publish without popup" in Settings to publish in one click`
        : (await cartService.isFull(wallet))
          ? `Cart full · ${MAX_CART_ITEMS} pages max — publish it to add more`
          : "Already in your cart"
    )
    return
  }

  const key = `${action.side}|${url}`
  if (inFlight.has(key)) return
  inFlight.add(key)
  toast(tabId, toastId, "pending", `Publishing · ${action.label}…`)
  try {
    const result = await withKeepAlive(() =>
      certificationService.publishNow(
        wallet,
        {
          url,
          title,
          predicateName: PAGE_MARKET_PREDICATE,
          side: action.side,
          contextSlugs
        },
        QUICK_PUBLISH_WEIGHT
      )
    )
    if (result.success) {
      const mission =
        action.side === "support"
          ? await dailyMissionLabel(wallet, result.objectId)
          : ""
      toast(
        tabId,
        toastId,
        "success",
        `${action.label} · ${QUICK_PUBLISH_LABEL}${mission}`,
        { href: getProfileUrl(), label: "View" }
      )
    } else {
      toast(tabId, toastId, "error", readableError(result.error ?? ""))
    }
  } finally {
    inFlight.delete(key)
  }
}

// Queue the qualified page into the connected wallet's cart — ONE item on the
// page market (`recommends`); the chosen intentions ride along as optional
// tags next to the topic tags. No wallet → the modal prompts a connect; a
// duplicate with nothing new to add → "already in your cart".
export async function handleAddToCart(
  msg: AddToCartMessage
): Promise<AddToCartResponse> {
  const wallet = await getStoredWalletAddress()
  if (!wallet) return { ok: false, reason: "no-wallet" }
  const intentions = msg.intentions ?? []
  const intentionSlugs = intentions.map(
    (purpose) => `intent:${purpose.replace(/^for_/, "")}`
  )
  try {
    const added = await cartService.addItem(
      wallet,
      msg.url,
      msg.title || null,
      PAGE_MARKET_PREDICATE,
      intentions[0] ?? null,
      getFaviconUrl(msg.url, 128),
      [...(msg.contextSlugs ?? []), ...intentionSlugs],
      msg.objectTermId
    )
    if (added) return { ok: true }
    return {
      ok: false,
      reason: (await cartService.isFull(wallet)) ? "full" : "duplicate"
    }
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
      void handleQuickPublish(
        tab.id,
        url,
        isLink ? null : tab.title || null,
        menuId.slice(PUBLISH_PREFIX.length)
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
