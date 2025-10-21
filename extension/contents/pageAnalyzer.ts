import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

// Simple URL cleaning function
function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    
    // Remove common tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'mc_eid', 'mc_cid', '_ga', 'ref', 'source'
    ]
    
    trackingParams.forEach(param => urlObj.searchParams.delete(param))
    
    return urlObj.toString()
  } catch {
    return url
  }
}

// Listen for page analysis requests from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("🔍 [Page Analyzer] Received message:", message.type)
  
  if (message.type === "GET_CLEAN_URL") {
    const cleanUrl = sanitizeUrl(window.location.href)
    console.log("🔍 [Page Analyzer] Returning clean URL:", cleanUrl)
    sendResponse({ success: true, url: cleanUrl })
    return true
  }
  
  if (message.type === "GET_PAGE_DATA") {
    const pageData = {
      rawUrl: window.location.href,
      cleanUrl: sanitizeUrl(window.location.href),
      domain: window.location.hostname,
      title: document.title || ""
    }
    console.log("🔍 [Page Analyzer] Returning page data:", pageData)
    sendResponse({ success: true, data: pageData })
    return true
  }
})

// Track URL changes for SPAs
let lastUrl = window.location.href

// Function to notify extension of URL changes
function notifyUrlChange() {
  const currentUrl = window.location.href
  if (currentUrl !== lastUrl) {
    console.log("🔍 [Page Analyzer] URL changed from", lastUrl, "to", currentUrl)
    lastUrl = currentUrl
    
    // Notify the extension
    chrome.runtime.sendMessage({
      type: "URL_CHANGED",
      data: { 
        oldUrl: lastUrl,
        newUrl: currentUrl,
        timestamp: Date.now()
      }
    }).catch(() => {
      // Ignore errors if extension is not ready
    })
  }
}

// Listen for SPA navigation (pushState/replaceState)
const originalPushState = history.pushState
const originalReplaceState = history.replaceState

history.pushState = function() {
  originalPushState.apply(history, arguments)
  setTimeout(notifyUrlChange, 100)
}

history.replaceState = function() {
  originalReplaceState.apply(history, arguments)
  setTimeout(notifyUrlChange, 100)
}

// Listen for popstate (back/forward buttons)
window.addEventListener('popstate', () => {
  setTimeout(notifyUrlChange, 100)
})

// Periodic check for URL changes (fallback)
setInterval(notifyUrlChange, 2000)

console.log("🔍 [Page Analyzer] Content script loaded for:", window.location.href)