import { connectToMetamask, getMetamaskConnection } from "./metamask"
import { sanitizeUrl, isSensitiveUrl } from "./utils/url"
import { sendToAgent, clearOldSentMessages } from "./utils/buffer"
import { EXCLUDED_URL_PATTERNS } from "./constants"
import { MessageBus } from "../lib/services/MessageBus"
import type { ChromeMessage, PageData } from "./types"
import { recordScroll, getScrollStats, clearScrolls } from "./behavior"
import { processBookmarksWithThemeAnalysis, processHistoryWithThemeAnalysis, getPulseSocket } from "./websocket"
import { getAllBookmarks, getAllHistory, sendMessageToPulse } from "./messageSenders"
import { elizaDataService } from "../lib/database/indexedDB-methods"
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

// Badge management for pending echoes count
async function updateEchoBadge(count: number) {
  try {
    if (count > 0) {
      await chrome.action.setBadgeText({ text: count.toString() })
      await chrome.action.setBadgeBackgroundColor({ color: '#dc3545' })
    } else {
      await chrome.action.setBadgeText({ text: '' })
    }
    console.log('🔔 [Badge] Updated echo count:', count)
  } catch (error) {
    console.error('❌ Failed to update badge:', error)
  }
}

// Buffer temporaire pour synchroniser PAGE_DATA et PAGE_DURATION
const pageDataBuffer = new Map<string, { data: PageData; loadTime: number }>()

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

  // Format pour correspondre exactement aux exemples de SofIA.json
  const domain = new URL(parsedData.url).hostname.replace('www.', '')
  const domainStats = getDomainIntentionStats(domain)
  
  let message = `URL: ${sanitizeUrl(parsedData.url)}\nTitle: ${parsedData.title.slice(0, 50)}`
  
  // Ajouter description si disponible
  if (parsedData.description) {
    message += `\nDescription: ${parsedData.description.slice(0, 100)}`
  }
  
  // Calculate Attention Score and get suggested predicate from intentionRanking
  let finalAttentionScore = 0.3
  let suggestedPredicate = "have visited"
  
  if (domainStats) {
    // Map visitCount to Attention Score according to SofIA rules
    let calculatedScore = 0.3
    if (domainStats.visitCount >= 25) calculatedScore = 0.9  // → trust
    else if (domainStats.visitCount >= 15) calculatedScore = 0.8  // → love  
    else if (domainStats.visitCount >= 5) calculatedScore = 0.75  // → like
    else if (domainStats.visitCount >= 3) calculatedScore = 0.4   // → interested
    
    // Take the max between calculated score and real attention
    finalAttentionScore = Math.max(calculatedScore, domainStats.maxAttentionScore)
    
    // Get suggested predicate from intentionRanking system
    if (domainStats.suggestedUpgrade?.toPredicate) {
      suggestedPredicate = domainStats.suggestedUpgrade.toPredicate
    } else {
      // Fallback based on visit patterns if no suggestion
      if (domainStats.visitCount >= 25 && finalAttentionScore > 0.7) suggestedPredicate = "trust"
      else if (domainStats.visitCount >= 15 && finalAttentionScore > 0.7) suggestedPredicate = "love"
      else if (domainStats.visitCount >= 8) suggestedPredicate = "like"
      else if (domainStats.visitCount >= 4) suggestedPredicate = "are interested by"
    }
    
    console.log(`🎯 [SofIA] Domain: ${domain}, visits: ${domainStats.visitCount}, score: ${finalAttentionScore}, suggested: ${suggestedPredicate}`)
  }
  
  message += `\nAttention Score: ${finalAttentionScore.toFixed(2)}`
  message += `\nSuggested Predicate: ${suggestedPredicate}`

  console.log("🧠 Page captured:", parsedData.url)

  clearScrolls(parsedData.url)
  sendToAgent(message)
  clearOldSentMessages()
  
  // Record page for intention ranking system
  recordPageForIntention(parsedData)
}

// Generic handler for data extraction (bookmarks/history)
async function handleDataExtraction(
  type: string,
  dataFetcher: () => Promise<{ success: boolean; urls?: string[]; error?: string }>,
  processor: (urls: string[]) => Promise<any>,
  sendResponse: (response: any) => void
): Promise<void> {
  try {
    const result = await dataFetcher()
    if (result.success && result.urls) {
      console.log(`🔄 Starting ${type} analysis for`, result.urls.length, 'URLs')
      const finalResult = await processor(result.urls)
      sendResponse(finalResult)
    } else {
      sendResponse({ success: false, error: result.error })
    }
  } catch (error) {
    console.error(`❌ ${type} extraction error:`, error)
    sendResponse({ success: false, error: error.message })
  }
}

// Pulse analysis handler
async function handlePulseAnalysis(sendResponse: (response: any) => void): Promise<void> {
  try {
    console.log("🫀 [Pulse] Starting pulse analysis of all tabs")
    
    // Get all tabs
    const tabs = await chrome.tabs.query({})
    console.log(`🫀 [Pulse] Found ${tabs.length} tabs to analyze`)
    
    const pulseData: any[] = []
    let processedTabs = 0
    
    // Collect data directly from tabs using Chrome API - much more reliable
    for (const tab of tabs) {
      if (!tab.id || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        continue
      }
      
      try {
        console.log(`🫀 [Pulse] Collecting from tab ${tab.id}: ${tab.url}`)
        
        // Extract data directly from tab object - no content script needed
        const tabData = {
          url: tab.url,
          title: tab.title || '',
          keywords: '', // Can't get meta keywords without content script, but URL analysis is often sufficient
          description: '',
          timestamp: Date.now(),
          tabId: tab.id,
          favIconUrl: tab.favIconUrl
        }
        
        pulseData.push(tabData)
        console.log(`🫀 [Pulse] Collected data from: ${tabData.title}`)
        processedTabs++
        
      } catch (error) {
        console.log(`🫀 [Pulse] Skipped tab ${tab.id}:`, error.message)
      }
    }
    
    console.log(`🫀 [Pulse] Collected data from ${pulseData.length} tabs`)
    
    if (pulseData.length === 0) {
      sendResponse({ 
        success: false, 
        error: "No tabs found for pulse analysis." 
      })
      return
    }
    
    // Send to PulseAgent
    const result = await sendPulseDataToAgent(pulseData)
    sendResponse(result)
    
  } catch (error) {
    console.error("❌ [Pulse] Analysis failed:", error)
    sendResponse({ success: false, error: error.message })
  }
}

// Function to send pulse data to PulseAgent
async function sendPulseDataToAgent(pulseData: any[]): Promise<{success: boolean, message: string}> {
  // Clean data to avoid cyclic references
  const cleanData = pulseData.map(data => ({
    url: data.url || '',
    title: data.title || '',
    keywords: data.keywords || '',
    description: data.description || '',
    timestamp: data.timestamp || Date.now()
  }))

  console.log("🫀 [Pulse] Sending to PulseAgent:", {
    totalTabs: cleanData.length,
    data: cleanData.map(d => ({
      url: d.url,
      title: d.title.slice(0, 30),
      keywordsCount: d.keywords.length
    }))
  })
  
  try {
    const pulseSocket = getPulseSocket()
    
    if (!pulseSocket?.connected) {
      console.warn("⚠️ PulseAgent socket not connected")
      return {
        success: false,
        message: "❌ PulseAgent not connected. Make sure PulseAgent is running."
      }
    }
    
    // Send to PulseAgent via WebSocket
    sendMessageToPulse(pulseSocket, cleanData)
    
    return {
      success: true,
      message: `✅ Pulse analysis completed! Collected data from ${cleanData.length} tabs and sent to PulseAgent.`
    }
    
  } catch (error) {
    console.error("❌ [Pulse] Failed to send to PulseAgent:", error)
    return {
      success: false,
      message: `❌ Failed to send pulse data: ${error.message}`
    }
  }
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

// Handler for STORE_DETECTED_TRIPLETS
async function handleStoreDetectedTriplets(message: any, sendResponse: (response: any) => void): Promise<void> {
  console.log('🔍 [messageHandlers.ts] STORE_DETECTED_TRIPLETS request received')
  try {
    const { triplets, metadata } = message
    
    // Format triplets as text for storage
    const tripletsText = JSON.stringify({
      triplets: triplets,
      metadata: metadata,
      type: 'detected_triplets'
    })
    
    // Store in IndexedDB
    const newMessage = {
      id: `detected_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: { text: tripletsText },
      created_at: Date.now(),
      processed: false
    }
    
    await elizaDataService.storeMessage(newMessage, newMessage.id)
    console.log('✅ [messageHandlers.ts] Detected triplets stored:', { 
      id: newMessage.id, 
      count: triplets.length,
      platform: metadata.hostname 
    })
    
    sendResponse({ success: true, id: newMessage.id, count: triplets.length })
  } catch (error) {
    console.error("❌ [messageHandlers.ts] Failed to store detected triplets:", error)
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
        const url = message.data?.url
        if (!url) {
          console.warn("❗ PAGE_DATA sans URL")
          break
        }
        const loadTime = message.pageLoadTime || Date.now()
        pageDataBuffer.set(url, { data: message.data, loadTime })
        break
      }

      case "PAGE_DURATION": {
        const url = message.data?.url
        const duration = message.data?.duration
        if (!url || !pageDataBuffer.has(url)) {
          console.warn("⚠️ PAGE_DURATION without PAGE_DATA for:", url)
          break
        }
        const buffered = pageDataBuffer.get(url)!
        buffered.data.duration = duration
        handlePageDataInline(buffered.data, buffered.loadTime)
        pageDataBuffer.delete(url)
        break
      }

      case "SCROLL_DATA":
        recordScroll(message.data.url, message.data.timestamp)
        break


      case "CONNECT_TO_METAMASK":
        connectToMetamask()
          .then(result => MessageBus.getInstance().sendMetamaskResult(result))
          .catch(error => {
            console.error("MetaMask error:", error)
            MessageBus.getInstance().sendMetamaskResult({ success: false, error: error.message })
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
        handleDataExtraction('bookmarks', getAllBookmarks, processBookmarksWithThemeAnalysis, sendResponse)
        return true

      case "GET_HISTORY":
        handleDataExtraction('history', getAllHistory, processHistoryWithThemeAnalysis, sendResponse)
        return true

      case "STORE_BOOKMARK_TRIPLETS":
        handleStoreBookmarkTriplets(message, sendResponse)
        return true

      case "STORE_DETECTED_TRIPLETS":
        handleStoreDetectedTriplets(message, sendResponse)
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

      case "START_PULSE_ANALYSIS":
        handlePulseAnalysis(sendResponse)
        return true


      case "UPDATE_ECHO_BADGE":
        const count = message.data?.count || 0
        updateEchoBadge(count)
        sendResponse({ success: true })
        return true
        
    }

    sendResponse({ success: true })
    return true
  })
}