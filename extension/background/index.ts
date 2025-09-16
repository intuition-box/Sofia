import { initializeChatbotSocket , initializeSofiaSocket, initializeThemeExtractorSocket, initializePulseSocket} from "./websocket";
import { loadDomainIntentions } from "./intentionRanking";
import { setupMessageHandlers } from "./messageHandlers";

// Initialize badge count on startup
async function initializeBadgeCount(): Promise<void> {
  try {
    // Send message to messageHandlers to count and update badge
    chrome.runtime.sendMessage({ type: 'INITIALIZE_BADGE' })
  } catch (error) {
    console.error('❌ [index.ts] Failed to initialize badge count:', error)
  }
}


async function init(): Promise<void> {
  console.log("🚀 [index.ts] Starting extension initialization...")
  console.log("🎯 [index.ts] Loading domain intentions...")
  await loadDomainIntentions();
  console.log("📚 [index.ts] Initializing SofIA socket...")
  initializeSofiaSocket();
  console.log("🤖 [index.ts] Initializing Chatbot socket...")
  initializeChatbotSocket()
  console.log("🎨 [index.ts] Initializing ThemeExtractor socket...")
  initializeThemeExtractorSocket()
  console.log("🫀 [index.ts] Initializing PulseAgent socket...")
  initializePulseSocket()
  console.log("📨 [index.ts] Setting up message handlers...");
  setupMessageHandlers();
  console.log("🔔 [index.ts] Initializing badge count...");
  await initializeBadgeCount();
  console.log("✅ [index.ts] Extension initialization completed")

}

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "open_sidepanel") {
    const tabId = sender.tab?.id
    const windowId = sender.tab?.windowId

    if (!tabId || !windowId) return

    chrome.sidePanel.open({ tabId, windowId })
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log("✅ Tracking enabled - Extension ready");
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

init();

console.log('🚀 SOFIA Extension - Service Worker ready (Plasmo)');

export { };