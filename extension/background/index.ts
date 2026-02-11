import { setupMessageHandlers } from "./messageHandlers";
import { MessageBus } from "../lib/services/MessageBus";
import { initializeThemeIconManager } from "./themeIconManager";
import { createServiceLogger } from '../lib/utils/logger'
import "./oauth/index"; // Initialize OAuth service

const logger = createServiceLogger('ServiceWorker')

// Helper pour récupérer l'adresse wallet depuis chrome.storage.session
export async function getWalletAddress(): Promise<string | null> {
  const result = await chrome.storage.session.get('walletAddress')
  return result.walletAddress || null
}

// Exported function to initialize when wallet connects (called from messageHandlers)
export async function initializeOnWalletConnect(): Promise<void> {
  logger.info("initializeOnWalletConnect called")
  await init()
}

// Initialize badge count on startup
async function initializeBadgeCount(): Promise<void> {
  try {
    MessageBus.getInstance().sendMessageFireAndForget({ type: 'INITIALIZE_BADGE' })
  } catch (error) {
    logger.error('Failed to initialize badge count', error)
  }
}


async function init(): Promise<void> {
  logger.info("Starting extension initialization")

  try {
    // Initialize theme-aware icon system
    await initializeThemeIconManager()

    // Setup message handlers (has internal guard against duplicates)
    setupMessageHandlers()

    // Check wallet connection
    const walletAddress = await getWalletAddress()
    if (!walletAddress) {
      logger.warn("Wallet not connected - Some features may be limited")
      await initializeBadgeCount()
      return
    }

    logger.info("Wallet connected", { walletAddress })

    // Initialize badge count
    logger.debug("Initializing badge count")
    await initializeBadgeCount()

    logger.info("Extension initialization completed")

  } catch (error) {
    logger.error("Extension initialization failed", error)
  }
}

// Listen for open_sidepanel messages
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "open_sidepanel") {
    const tabId = sender.tab?.id
    const windowId = sender.tab?.windowId

    if (!tabId || !windowId) return

    chrome.sidePanel.open({ tabId, windowId })
  }
})

// On startup, check if already connected (after extension reload)
async function checkExistingConnection() {
  const address = await getWalletAddress()
  if (address) {
    logger.info('Restoring wallet session', { address })
  } else {
    logger.debug('No wallet session, initializing basic handlers only')
  }
  await init()
}

chrome.runtime.onInstalled.addListener(async () => {
  logger.info("Tracking enabled - Extension ready");
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

checkExistingConnection();

logger.info('Service Worker ready (Plasmo)');

export { };
