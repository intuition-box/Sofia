/**
 * Service Worker realtime module.
 *
 * Instantiates a SubscriptionManager tied to the shared queryClient and
 * drives WS subscriptions from the wallet address stored in
 * chrome.storage.session. Wallet connect → manager.connect(wallet).
 * Wallet disconnect → manager.disconnect(). Wallet switch → reconnect.
 *
 * Why SW over offscreen: MV3 keeps the SW alive as long as an active
 * WebSocket holds a connection open. The extension already owns one
 * offscreen document (public/offscreen.html, theme detection) and Chrome
 * caps us at one offscreen per extension. Merging theme + realtime is
 * doable but invasive (migrate vanilla JS → TS, rewire CSS for theme
 * detection). Phase 5 can migrate here if we see SW kills under memory
 * pressure. For Phase 1.B the SW-direct path is sufficient.
 *
 * Environment:
 * - PLASMO_PUBLIC_GRAPHQL_WS_URL — optional override; defaults to mainnet.
 */

import { persistQueryClient } from "@tanstack/react-query-persist-client"
import {
  API_WS_PROD,
  configureWsClient
} from "@0xsofia/graphql"
import {
  CACHE_MAX_AGE,
  CACHE_VERSION,
  persister,
  queryClient
} from "../lib/providers/queryClient"
import { SubscriptionManager } from "../lib/realtime/SubscriptionManager"
import { createServiceLogger } from "../lib/utils/logger"

const logger = createServiceLogger("Realtime")
const manager = new SubscriptionManager(queryClient)

let persistStarted = false
let initialized = false

function ensurePersisted(): void {
  if (persistStarted) return
  persistStarted = true
  // Mirror what PersistQueryClientProvider does in the popup, so SW-side
  // setQueryData writes land in chrome.storage.local — the popup picks
  // them up via onChanged and rehydrates its own QueryClient.
  persistQueryClient({
    queryClient,
    persister,
    maxAge: CACHE_MAX_AGE,
    buster: CACHE_VERSION
  })
}

function isValidWallet(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("0x")
}

async function syncWalletFromStorage(): Promise<void> {
  const result = await chrome.storage.session.get("walletAddress")
  const wallet = result.walletAddress
  if (isValidWallet(wallet)) {
    manager.connect(wallet)
    logger.info("connected", { wallet: wallet.slice(0, 10) })
  } else {
    manager.disconnect()
  }
}

export async function initializeRealtime(): Promise<void> {
  if (initialized) return
  initialized = true

  const wsUrl = process.env.PLASMO_PUBLIC_GRAPHQL_WS_URL ?? API_WS_PROD
  configureWsClient({ wsUrl })
  logger.info("configured", { wsUrl })

  ensurePersisted()
  await syncWalletFromStorage()

  // React to popup writing/removing the wallet address. Fires even when
  // the SW was asleep — chrome.storage.onChanged is a wake-up trigger.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "session") return
    if (!("walletAddress" in changes)) return
    const newValue = changes.walletAddress.newValue
    if (isValidWallet(newValue)) {
      manager.connect(newValue)
      logger.info("wallet switched", { wallet: newValue.slice(0, 10) })
    } else {
      manager.disconnect()
      logger.info("wallet removed, disconnected")
    }
  })
}

/** Exposed for manual cleanup — typically on full logout. */
export function shutdownRealtime(): void {
  manager.shutdown()
  initialized = false
}
