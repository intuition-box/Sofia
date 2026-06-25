// Background service worker — registers the single "Share in Sofia" context-menu
// item and, on click, tells the page's content script to open the qualification
// modal for the target URL (the right-clicked link, or the page itself).

const MENU_ID = "share-in-sofia"
const CONTEXTS: chrome.contextMenus.ContextType[] = ["page", "link", "selection"]

function buildMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "Share in Sofia",
      contexts: CONTEXTS
    })
  })
}

chrome.runtime.onInstalled.addListener(buildMenu)
chrome.runtime.onStartup.addListener(buildMenu)

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
