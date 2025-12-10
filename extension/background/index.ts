import {
  initializeChatbotSocket,
  initializeSofiaSocket,
  initializeThemeExtractorSocket,
  initializePulseSocket,
  initializeRecommendationSocket,
  initializeUserAgentIds
} from "./websocket";
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

    // 1️⃣ IMPORTANT : Vérifier que le wallet est connecté
    const walletAddress = await getWalletAddress()
    if (!walletAddress) {
      console.warn("⚠️ [index.ts] Wallet non connecté - Initialisation des agents reportée")
      console.warn("⚠️ [index.ts] L'utilisateur doit connecter son wallet pour utiliser SofIA")
      // Setup message handlers anyway for UI to work
      setupMessageHandlers()
      await initializeBadgeCount()
      return
    }

    console.log("✅ [index.ts] Wallet connecté:", walletAddress)

    // 2️⃣ Initialiser les IDs utilisateur (DOIT être fait en premier)
    console.log("🔑 [index.ts] Initializing user agent IDs...")
    await initializeUserAgentIds()
    console.log("✅ [index.ts] User agent IDs initialized")

    // 3️⃣ Charger les domaines d'intention
    console.log("🎯 [index.ts] Loading domain intentions...")
    await loadDomainIntentions()

    // 4️⃣ Initialiser les websockets (maintenant que les IDs sont prêts)
    console.log("📚 [index.ts] Initializing SofIA socket...")
    await initializeSofiaSocket()
    console.log("🤖 [index.ts] Initializing Chatbot socket...")
    await initializeChatbotSocket()
    console.log("🎨 [index.ts] Initializing ThemeExtractor socket...")
    await initializeThemeExtractorSocket()
    console.log("🫀 [index.ts] Initializing PulseAgent socket...")
    await initializePulseSocket()
    console.log("💎 [index.ts] Initializing RecommendationAgent socket...")
    await initializeRecommendationSocket()

    // 5️⃣ Setup message handlers
    console.log("📨 [index.ts] Setting up message handlers...")
    setupMessageHandlers()

    // 6️⃣ Initialize badge count
    console.log("🔔 [index.ts] Initializing badge count...")
    await initializeBadgeCount()

    console.log("✅ [index.ts] Extension initialization completed")

  } catch (error) {
    console.error("❌ [index.ts] Extension initialization failed:", error)
    console.error("❌ [index.ts] This may be due to missing wallet connection")
  }
}

// Listen for wallet connection messages from sidepanel (Privy)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'WALLET_CONNECTED') {
    // Store in chrome.storage.session (survives reload, cleared on browser close)
    chrome.storage.session.set({ walletAddress: message.address })
    console.log('✅ [index.ts] Wallet connected via Privy:', message.address)
    // Reinitialize extension with new wallet
    init()
    sendResponse({ success: true })
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
    init()
  } else {
    // No wallet, but initialize basic handlers
    setupMessageHandlers()
    await initializeBadgeCount()
  }
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