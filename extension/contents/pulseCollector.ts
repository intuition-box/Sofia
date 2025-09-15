import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false // Only main frames to avoid duplicates
}

// Collect pulse data from current tab
function collectPulseData() {
  const title = document.title || ""
  const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute("content") || ""
  const description = document.querySelector('meta[name="description"]')?.getAttribute("content") || ""
  const url = window.location.href

  // Extract keywords from content if meta keywords not available
  let extractedKeywords = keywords
  if (!extractedKeywords) {
    // Simple keyword extraction from title and h1-h3 tags
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map(h => h.textContent?.trim())
      .filter(Boolean)
      .join(' ')
    
    const allText = `${title} ${headings}`.toLowerCase()
    
    // Basic keyword extraction (words > 4 chars, excluding common words)
    const commonWords = ['this', 'that', 'with', 'from', 'they', 'been', 'have', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'would', 'there', 'could', 'other', 'after', 'first', 'well', 'water', 'been', 'call', 'who', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']
    
    extractedKeywords = allText
      .split(/\s+/)
      .filter(word => word.length > 4 && !commonWords.includes(word))
      .slice(0, 10) // Top 10 keywords
      .join(', ')
  }

  return {
    url,
    title,
    keywords: extractedKeywords,
    description,
    timestamp: Date.now(),
    tabId: undefined // Will be set by background script
  }
}

// Listen for pulse collection requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "COLLECT_PULSE_DATA") {
    const pulseData = collectPulseData()
    sendResponse({ success: true, data: pulseData })
    return true
  }
})

console.log("🫀 [Pulse Collector] Content script loaded for:", window.location.href)