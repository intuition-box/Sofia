import { loadDomainIntentions } from "./intentionRanking";
import { setupMessageHandlers } from "./messageHandlers";
import { MessageBus } from "../lib/services/MessageBus";
import { initializeThemeIconManager } from "./themeIconManager";
import "./oauth/index"; // Initialize OAuth service

// Helper pour récupérer l'adresse wallet depuis chrome.storage.session
export async function getWalletAddress(): Promise<string | null> {
  const result = await chrome.storage.session.get('walletAddress')
  return result.walletAddress || null
}

// Exported function to initialize when wallet connects (called from messageHandlers)
export async function initializeSocketsOnWalletConnect(): Promise<void> {
  console.log("🔌 [index.ts] initializeSocketsOnWalletConnect called")
  await init()
}

// Initialize badge count on startup
async function initializeBadgeCount(): Promise<void> {
  try {
    MessageBus.getInstance().sendMessageFireAndForget({ type: 'INITIALIZE_BADGE' })
  } catch (error) {
    console.error('❌ [index.ts] Failed to initialize badge count:', error)
  }
}


async function init(): Promise<void> {
  console.log("🚀 [index.ts] Starting extension initialization...")

  try {
    // Initialize theme-aware icon system
    await initializeThemeIconManager()

    // Setup message handlers (has internal guard against duplicates)
    setupMessageHandlers()

    // Check wallet connection
    const walletAddress = await getWalletAddress()
    if (!walletAddress) {
      console.warn("⚠️ [index.ts] Wallet not connected - Some features may be limited")
      await initializeBadgeCount()
      return
    }

    console.log("✅ [index.ts] Wallet connected:", walletAddress)

    // Load domain intentions
    console.log("🎯 [index.ts] Loading domain intentions...")
    await loadDomainIntentions()

    // Initialize badge count
    console.log("🔔 [index.ts] Initializing badge count...")
    await initializeBadgeCount()

    console.log("✅ [index.ts] Extension initialization completed")
    console.log("📡 [index.ts] All agents use Mastra HTTP - no sockets to initialize")

  } catch (error) {
    console.error("❌ [index.ts] Extension initialization failed:", error)
  }
}

// Listen for wallet connection messages from sidepanel or external auth page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'WALLET_CONNECTED') {
    // Support both formats: message.address (old) and message.walletAddress (new external auth)
    const walletAddress = message.walletAddress || message.data?.walletAddress || message.address
    if (walletAddress) {
      // Store in chrome.storage.session (survives reload, cleared on browser close)
      chrome.storage.session.set({ walletAddress })
      console.log('✅ [index.ts] Wallet connected:', walletAddress)
      // Reinitialize extension with new wallet
      init()
      sendResponse({ success: true })
    } else {
      console.error('❌ [index.ts] WALLET_CONNECTED received but no address provided')
      sendResponse({ success: false, error: 'No wallet address provided' })
    }
    return true
  } else if (message.type === 'WALLET_DISCONNECTED') {
    chrome.storage.session.remove('walletAddress')
    console.log('🔌 [index.ts] Wallet disconnected')
    sendResponse({ success: true })
    return true
  } else if (message.type === "open_sidepanel") {
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
    console.log('🔄 [index.ts] Restoring wallet session:', address)
  } else {
    console.log('🔄 [index.ts] No wallet session, initializing basic handlers only')
  }
  await init()
}

chrome.runtime.onInstalled.addListener(async () => {
  console.log("✅ Tracking enabled - Extension ready");
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

checkExistingConnection();

console.log('🚀 SOFIA Extension - Service Worker ready (Plasmo)');

export { };
