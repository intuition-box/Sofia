import { connectToMetamask, getMetamaskConnection } from "./metamask"
import { MessageBus } from "../lib/services/MessageBus"
import type { ChromeMessage, MessageResponse } from "../types/messages"
import { recordScroll } from "./behavior"
import { processBookmarksWithThemeAnalysis, processHistoryWithThemeAnalysis } from "./websocket"
import { getAllBookmarks, getAllHistory } from "./messageSenders"
import { 
  recordUserPredicate, 
  getTopIntentions, 
  getDomainIntentionStats,
  getPredicateUpgradeSuggestions,
  getIntentionGlobalStats
} from "./intentionRanking"
import { badgeService } from "../lib/services/BadgeService"
import { pageDataService } from "../lib/services/PageDataService"
import { pulseService } from "../lib/services/PulseService"
import { tripletStorageService } from "../lib/services/TripletStorageService"
// Discord and X/Twitter OAuth removed - not needed



// Generic handler for data extraction (bookmarks/history)
async function handleDataExtraction(
  type: string,
  dataFetcher: () => Promise<{ success: boolean; urls?: string[]; error?: string }>,
  processor: (urls: string[]) => Promise<{ success: boolean; message: string; themesExtracted?: number; triplesProcessed?: boolean; themes?: any[] }>,
  sendResponse: (response: MessageResponse) => void
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




export function setupMessageHandlers(): void {
  chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, sendResponse) => {
    switch (message.type) {
      case "GET_TAB_ID":
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0]
          sendResponse({ tabId: activeTab?.id })
        })
        return true

      case "PAGE_DATA":
        pageDataService.handlePageData(message)
        break

      case "PAGE_DURATION":
        pageDataService.handlePageDuration(message)
        break

      case "SCROLL_DATA":
        pageDataService.handleScrollData(message)
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
        tripletStorageService.handleStoreBookmarkTriplets(message, sendResponse)
        return true

      case "STORE_DETECTED_TRIPLETS":
        tripletStorageService.handleStoreDetectedTriplets(message, sendResponse)
        return true


      case "GET_INTENTION_RANKING":
        try {
          const limit = message.data?.limit || 10
          const rankings = getTopIntentions(limit)
          sendResponse({ success: true, data: rankings })
        } catch (error) {
          console.error("❌ GET_INTENTION_RANKING error:", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
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
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
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
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
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
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      // Discord and X/Twitter OAuth removed - not needed

      case "START_PULSE_ANALYSIS":
        pulseService.handlePulseAnalysis(sendResponse)
        return true


      case "UPDATE_ECHO_BADGE":
        badgeService.handleBadgeUpdate(sendResponse)
        return true

      case "TRIPLET_PUBLISHED":
        badgeService.handleBadgeUpdate(sendResponse)
        return true

      case "TRIPLETS_DELETED":
        badgeService.handleBadgeUpdate(sendResponse)
        return true

      case "INITIALIZE_BADGE":
        badgeService.handleBadgeUpdate(sendResponse)
        return true
        
    }

    sendResponse({ success: true })
    return true
  })
}