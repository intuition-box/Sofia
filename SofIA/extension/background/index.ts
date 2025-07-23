import { HistoryManager } from "~lib/history";
import { cleanOldBehaviors } from "./behavior";
import { initializeWebSocket } from "./websocket";
import { setupMessageHandlers } from "./messages";

const historyManager = new HistoryManager({ batchWrites: true });

function init(): void {
  cleanOldBehaviors();
  initializeWebSocket();
  setupMessageHandlers(historyManager);
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
  console.log("✅ Tracking activé - Extension prête");
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

init();

console.log('🚀 SOFIA Extension - Service Worker prêt (Plasmo)');

export { };