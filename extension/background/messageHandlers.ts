import { connectToMetamask, getMetamaskConnection } from "./metamask"
import { sanitizeUrl, isSensitiveUrl } from "./utils/url"
import { sendToAgent, clearOldSentMessages } from "./utils/buffer"
import { EXCLUDED_URL_PATTERNS } from "./constants"
import { messageBus } from "~lib/MessageBus"
import type { ChromeMessage, PageData } from "./types"
import { recordScroll, getScrollStats, clearScrolls } from "./behavior"
import { getAllBookmarks, sendBookmarksToAgent } from "./websocket"
import { elizaDataService } from "../lib/indexedDB-methods"
import { 
  recordPageForIntention, 
  recordUserPredicate, 
  getTopIntentions, 
  getDomainIntentionStats,
  getPredicateUpgradeSuggestions,
  getIntentionGlobalStats,
  loadDomainIntentions
} from "./intentionRanking"
import { handleDiscordOAuth, handleXOAuth } from "./oauth"


// Buffer temporaire de pageData par tabId
const pageDataBufferByTabId = new Map<number, { data: PageData; loadTime: number }>()

async function handlePageDataInline(data: any, pageLoadTime: number): Promise<void> {

  let parsedData: PageData
  let attentionText = ""

  try {
    parsedData = typeof data === "string" ? JSON.parse(data) : data

    if (typeof parsedData.attentionScore === "number") {
      attentionText = `Attention: ${parsedData.attentionScore.toFixed(2)}`
    }
    parsedData.timestamp ??= pageLoadTime
    parsedData.ogType ??= "website"
    parsedData.title ??= "Non défini"
    parsedData.keywords ??= ""
    parsedData.description ??= ""
    parsedData.h1 ??= ""
  } catch (err) {
    console.error("❌ Unable to parse PAGE_DATA:", err, data)
    return
  }

  if (EXCLUDED_URL_PATTERNS.some(str => parsedData.url.toLowerCase().includes(str))) return
  if (isSensitiveUrl(parsedData.url)) {
    console.log("🔒 Sensitive URL ignored:", parsedData.url)
    return
  }

  const scrollStats = getScrollStats(parsedData.url)

  // Format pour correspondre exactement aux exemples de SofIA.json
  const domain = new URL(parsedData.url).hostname.replace('www.', '')
  const domainStats = getDomainIntentionStats(domain)
  
  let message = `URL: ${sanitizeUrl(parsedData.url)}\nTitle: ${parsedData.title.slice(0, 50)}`
  
  // Ajouter description si disponible
  if (parsedData.description) {
    message += `\nDescription: ${parsedData.description.slice(0, 100)}`
  }
  
  // Format temps comme dans les exemples (00:01:20 format)
  if (parsedData.duration && parsedData.duration > 1000) {
    const minutes = Math.floor(parsedData.duration / 60000)
    const seconds = Math.floor((parsedData.duration % 60000) / 1000)
    message += `\nTime: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    message += `\nTime: 00:00:30`
  }
  
  // Calculate Attention Score based on visits to trigger SofIA rules
  let finalAttentionScore = 0.3
  if (domainStats) {
    // Map visitCount to Attention Score according to SofIA rules
    let calculatedScore = 0.3
    if (domainStats.visitCount >= 25) calculatedScore = 0.9  // → trust
    else if (domainStats.visitCount >= 15) calculatedScore = 0.8  // → love  
    else if (domainStats.visitCount >= 5) calculatedScore = 0.75  // → like
    else if (domainStats.visitCount >= 3) calculatedScore = 0.4   // → interested
    
    // Take the max between calculated score and real attention
    finalAttentionScore = Math.max(calculatedScore, domainStats.maxAttentionScore)
    
    console.log(`🎯 [SofIA Score] Domain: ${domain}, visits: ${domainStats.visitCount}, calculated: ${calculatedScore}, real: ${domainStats.maxAttentionScore}, final: ${finalAttentionScore}`)
  }
  
  message += `\nAttention Score: ${finalAttentionScore.toFixed(2)}`

  console.log("🧠 Page captured:", parsedData.url)

  clearScrolls(parsedData.url)
  sendToAgent(message)
  clearOldSentMessages()
  
  // Record page for intention ranking system
  recordPageForIntention(parsedData)
}

// Separate handler for STORE_BOOKMARK_TRIPLETS
async function handleStoreBookmarkTriplets(message: any, sendResponse: (response: any) => void): Promise<void> {
  console.log('💾 [messageHandlers.ts] STORE_BOOKMARK_TRIPLETS request received')
  try {
    // Stocker le JSON de triplets directement dans IndexedDB (comme SofIA)
    const newMessage = {
      id: `bookmark_${message.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      content: { text: message.text },
      created_at: message.timestamp,
      processed: false
    }
    
    await elizaDataService.storeMessage(newMessage, newMessage.id)
    console.log('✅ [messageHandlers.ts] Bookmark triplets stored in IndexedDB:', { id: newMessage.id })
    
    sendResponse({ success: true, id: newMessage.id })
  } catch (error) {
    console.error("❌ [messageHandlers.ts] Failed to store bookmark triplets:", error)
    sendResponse({ success: false, error: error.message })
  }
}

export function setupMessageHandlers(): void {
  chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, sendResponse) => {
    switch (message.type) {
      case "GET_TAB_ID":
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0]
          sendResponse({ tabId: activeTab?.id })
        })
        return true

      case "PAGE_DATA": {
        const tabId = "tabId" in message && typeof message.tabId === "number" ? message.tabId : -1
        if (tabId === -1) {
          console.warn("❗ PAGE_DATA sans tabId")
          break
        }
        const loadTime = message.pageLoadTime || Date.now()
        pageDataBufferByTabId.set(tabId, { data: message.data, loadTime })
        console.log(`📥 PAGE_DATA buffered for tabId ${tabId}`)
        break
      }

      case "PAGE_DURATION": {
        const tabId = "tabId" in message && typeof message.tabId === "number" ? message.tabId : -1
        const duration = message.data.duration
        if (tabId === -1 || !pageDataBufferByTabId.has(tabId)) {
          console.warn("⚠️ PAGE_DURATION without associated PAGE_DATA or missing tabId")
          break
        }
        const buffered = pageDataBufferByTabId.get(tabId)!
        buffered.data.duration = duration
        console.log(`📤 Merging PAGE_DATA + PAGE_DURATION for tabId ${tabId}`)
        handlePageDataInline(buffered.data, buffered.loadTime)
        pageDataBufferByTabId.delete(tabId)
        break
      }

      case "SCROLL_DATA":
        recordScroll(message.data.url, message.data.timestamp)
        break


      case "CONNECT_TO_METAMASK":
        connectToMetamask()
          .then(result => messageBus.sendMetamaskResult(result))
          .catch(error => {
            console.error("MetaMask error:", error)
            messageBus.sendMetamaskResult({ success: false, error: error.message })
          })
        break

      case "GET_METAMASK_ACCOUNT": {
        const connection = getMetamaskConnection()
        sendResponse(
          connection?.account
            ? { success: true, account: connection.account, chainId: connection.chainId }
            : { success: false, error: "No MetaMask connection found" }
        )
        break
      }

      case "GET_TRACKING_STATS":
        sendResponse({
          success: true,
          data: { message: "Data sent directly to agent - no local storage" }
        })
        break

      case "CLEAR_TRACKING_DATA":
        sendResponse({ success: true, message: "No local data to clear" })
        break

      case "GET_BOOKMARKS":
        getAllBookmarks()
          .then(async result => {
            if (result.success && result.urls) {
              try {
                const finalResult = await sendBookmarksToAgent(result.urls)
                sendResponse(finalResult)
              } catch (error) {
                console.error("❌ sendBookmarksToAgent error:", error)
                sendResponse({ success: false, error: error.message })
              }
            } else {
              sendResponse({ success: false, error: result.error })
            }
          })
          .catch(error => {
            console.error("❌ GET_BOOKMARKS error:", error)
            sendResponse({ success: false, error: error.message })
          })
        return true

      case "STORE_BOOKMARK_TRIPLETS":
        handleStoreBookmarkTriplets(message, sendResponse)
        return true

      case "GET_INTENTION_RANKING":
        try {
          const limit = message.data?.limit || 10
          const rankings = getTopIntentions(limit)
          sendResponse({ success: true, data: rankings })
        } catch (error) {
          console.error("❌ GET_INTENTION_RANKING error:", error)
          sendResponse({ success: false, error: error.message })
        }
        return true

      case "GET_DOMAIN_INTENTIONS":
        try {
          const domain = message.data?.domain
          if (!domain) {
            sendResponse({ success: false, error: "Domain parameter required" })
            return true
          }
          const stats = getDomainIntentionStats(domain)
          sendResponse({ success: true, data: stats })
        } catch (error) {
          console.error("❌ GET_DOMAIN_INTENTIONS error:", error)
          sendResponse({ success: false, error: error.message })
        }
        return true

      case "RECORD_PREDICATE":
        try {
          const { url, predicate } = message.data || {}
          if (!url || !predicate) {
            sendResponse({ success: false, error: "URL and predicate parameters required" })
            return true
          }
          recordUserPredicate(url, predicate)
          console.log(`🎯 [messageHandlers] Predicate "${predicate}" recorded for ${url}`)
          sendResponse({ success: true })
        } catch (error) {
          console.error("❌ RECORD_PREDICATE error:", error)
          sendResponse({ success: false, error: error.message })
        }
        return true

      case "GET_UPGRADE_SUGGESTIONS":
        try {
          const minConfidence = message.data?.minConfidence || 0.7
          const suggestions = getPredicateUpgradeSuggestions(minConfidence)
          const globalStats = getIntentionGlobalStats()
          sendResponse({ 
            success: true, 
            data: { 
              suggestions, 
              globalStats 
            }
          })
        } catch (error) {
          console.error("❌ GET_UPGRADE_SUGGESTIONS error:", error)
          sendResponse({ success: false, error: error.message })
        }
        return true

      case "CONNECT_DISCORD":
        handleDiscordOAuth(message.clientId, sendResponse)
        return true

      case "CONNECT_X":
        handleXOAuth(message.clientId, sendResponse)
        return true
    }

    sendResponse({ success: true })
    return true
  })
}