import { connectToMetamask, getMetamaskConnection } from "./metamask"
import { MessageBus } from "../lib/services/MessageBus"
import type { ChromeMessage, MessageResponse } from "../types/messages"
import { sendMessage, sendThemeExtractionRequest, sendRecommendationRequest } from "./agentRouter"
import { getAllBookmarks, getAllHistory } from "./messageSenders"
import { badgeService } from "../lib/services/BadgeService"
import { pageDataService } from "../lib/services/PageDataService"
import { pulseService } from "../lib/services/PulseService"
import { tripletStorageService } from "../lib/services/TripletStorageService"
import { initializeSocketsOnWalletConnect } from "./index"
import { oauthService } from "./oauth"
import { groupManager } from "../lib/services/GroupManager"
import { xpService, getLevelUpCost } from "../lib/services/XPService"
import { sessionTracker } from "../lib/services/SessionTracker"
import { levelUpService } from "../lib/services/LevelUpService"

// 🔥 FIX: Flag to prevent duplicate message handlers registration
let handlersRegistered = false



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


// Handle recommendation generation via RecommendationAgent
async function handleRecommendationGeneration(message: ChromeMessage, sendResponse: (response: MessageResponse) => void): Promise<void> {
  try {
    const walletData = message.data
    if (!walletData || !walletData.address) {
      sendResponse({ success: false, error: "Wallet data required" })
      return
    }

    console.log('💎 [messageHandlers] Generating recommendations for wallet:', walletData.address)

    // Send request and wait for response (imported at top)
    const recommendationsData = await sendRecommendationRequest(walletData)

    if (!recommendationsData) {
      sendResponse({ success: false, error: "No recommendations received from agent" })
      return
    }

    // Extract recommendations array from response
    const recommendations = recommendationsData.recommendations || []

    console.log('✅ [messageHandlers] Received', recommendations.length, 'recommendation categories')
    sendResponse({
      success: true,
      recommendations
    })

  } catch (error) {
    console.error('❌ [messageHandlers] Recommendation generation failed:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Enhanced Ollama request handler with better error handling
async function handleOllamaRequest(payload: any, sendResponse: (response: MessageResponse) => void): Promise<void> {
  try {
    const url = "http://127.0.0.1:11434/api/chat";
    
    // Enhanced logging
    console.log('[BG→Ollama] POST', url, {
      model: payload.model,
      stream: payload.stream,
      messagesCount: Array.isArray(payload.messages) ? payload.messages.length : 0
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: payload.model ?? "llama3:latest",
        messages: payload.messages ?? [],
        stream: Boolean(payload.stream)
      })
    });

    // Enhanced response handling with fallback parsing
    const text = await response.text();
    let data: any;
    try { 
      data = JSON.parse(text); 
    } catch { 
      data = { raw: text }; 
    }

    // Debug CORS headers
    console.log('[BG→Ollama] status:', response.status,
      'ACAO:', response.headers.get("access-control-allow-origin"),
      'Vary:', response.headers.get("vary"));

    if (!response.ok) {
      console.log('❌ [Background] Ollama error:', response.status, response.statusText);
      sendResponse({ 
        success: false, 
        status: response.status,
        error: data?.error || text 
      });
      return;
    }

    console.log('✅ [Background] Ollama success');
    sendResponse({ 
      success: true, 
      status: response.status,
      data 
    });
    
  } catch (error) {
    console.error('[BG→Ollama] fetch error:', error);
    sendResponse({ 
      success: false, 
      error: String(error) 
    });
  }
}


// Allowed origins for external messages (security)
const ALLOWED_EXTERNAL_ORIGINS = [
  'https://sofia.intuition.box',
  'http://localhost:3000' // For development only
]

// Supported OAuth platforms
const SUPPORTED_OAUTH_PLATFORMS = ['twitter', 'youtube', 'spotify', 'discord', 'twitch']

export function setupMessageHandlers(): void {
  // 🔥 FIX: Prevent duplicate handler registration
  if (handlersRegistered) {
    console.log("⚠️ [messageHandlers] Handlers already registered, skipping")
    return
  }
  handlersRegistered = true
  console.log("📨 [messageHandlers] Registering message handlers...")

  // Handle external messages from auth page (localhost:3000 or sofia.intuition.box)
  chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    console.log('📨 External message received:', message.type, 'from:', sender.origin)

    // SECURITY: Validate origin before processing any external message
    const isAllowedOrigin = sender.origin && ALLOWED_EXTERNAL_ORIGINS.some(
      allowed => sender.origin!.startsWith(allowed)
    )

    if (!isAllowedOrigin) {
      console.warn('⚠️ Rejected external message from untrusted origin:', sender.origin)
      sendResponse({ success: false, error: 'Untrusted origin' })
      return true
    }

    if (message.type === 'WALLET_CONNECTED') {
      const walletAddress = message.data?.walletAddress || message.walletAddress
      if (walletAddress) {
        chrome.storage.session.set({ walletAddress }).then(async () => {
          console.log('✅ Wallet connected from external page:', walletAddress)
          // Initialize sockets now that wallet is connected
          await initializeSocketsOnWalletConnect()
          sendResponse({ success: true })
        }).catch((error) => {
          console.error('❌ Failed to save wallet:', error)
          sendResponse({ success: false, error: error.message })
        })
      } else {
        sendResponse({ success: false, error: 'No wallet address provided' })
      }
      return true
    }

    if (message.type === 'WALLET_DISCONNECTED') {
      chrome.storage.session.remove('walletAddress').then(() => {
        console.log('✅ Wallet disconnected from external page')
        sendResponse({ success: true })
      }).catch((error) => {
        console.error('❌ Failed to disconnect wallet:', error)
        sendResponse({ success: false, error: error.message })
      })
      return true
    }

    // Handle OAuth token from landing page (generic handler for all platforms)
    if (message.type === 'OAUTH_TOKEN_SUCCESS' || message.type === 'TWITTER_OAUTH_SUCCESS') {
      const { platform, accessToken, refreshToken, expiresIn } = message

      // Validate platform
      const platformName = platform || 'twitter'
      if (!SUPPORTED_OAUTH_PLATFORMS.includes(platformName)) {
        console.warn('⚠️ Unsupported OAuth platform:', platformName)
        sendResponse({ success: false, error: `Unsupported platform: ${platformName}` })
        return true
      }

      if (accessToken) {
        oauthService.handleExternalOAuthToken(
          platformName,
          accessToken,
          refreshToken,
          expiresIn
        ).then(() => {
          console.log(`✅ ${platformName} OAuth token received and stored`)
          sendResponse({ success: true })
        }).catch((error) => {
          console.error(`❌ Failed to store ${platformName} token:`, error)
          sendResponse({ success: false, error: error.message })
        })
      } else {
        sendResponse({ success: false, error: 'No access token provided' })
      }
      return true
    }

    sendResponse({ success: false, error: 'Unknown message type' })
    return true
  })

  chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, sendResponse) => {
    // Handle async operations
    (async () => {
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


      case "SEND_CHATBOT_MESSAGE":
        // Handle chatbot message from sidepanel (ChatPage)
        // Socket runs in service worker context, not in sidepanel context
        try {
          await sendMessage('CHATBOT', message.text)
          sendResponse({ success: true })
        } catch (error) {
          console.error("❌ Failed to send chatbot message:", error)
          sendResponse({ success: false, error: error.message })
        }
        return true

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
        handleDataExtraction('bookmarks', getAllBookmarks, async (urls: string[]) => {
          const themes = await sendThemeExtractionRequest(urls)

          // Send completion notification to UI
          chrome.runtime.sendMessage({
            type: 'THEME_EXTRACTION_COMPLETE',
            themesExtracted: themes?.length || 0
          }).catch(() => {}) // Ignore if no listener

          return {
            success: true,
            message: 'Bookmark analysis completed',
            themesExtracted: themes?.length || 0,
            triplesProcessed: true
          }
        }, sendResponse)
        return true

      case "GET_HISTORY":
        handleDataExtraction('history', getAllHistory, async (urls: string[]) => {
          const themes = await sendThemeExtractionRequest(urls)
          return {
            success: true,
            message: 'History analysis completed',
            themesExtracted: themes?.length || 0,
            triplesProcessed: true
          }
        }, sendResponse)
        return true

      case "STORE_BOOKMARK_TRIPLETS":
        tripletStorageService.handleStoreBookmarkTriplets(message, sendResponse)
        return true

      case "STORE_DETECTED_TRIPLETS":
        tripletStorageService.handleStoreDetectedTriplets(message, sendResponse)
        return true

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

      case "OLLAMA_REQUEST":
        handleOllamaRequest(message.payload, sendResponse)
        return true

      case "GENERATE_RECOMMENDATIONS":
        handleRecommendationGeneration(message, sendResponse)
        return true

      case "GET_PAGE_BLOCKCHAIN_DATA":
        try {
          const url = message.data?.url
          if (!url) {
            sendResponse({ success: false, error: "URL parameter required" })
            return true
          }
          // For now, just return success - the actual GraphQL query is handled in the frontend
          sendResponse({ success: true, data: { url } })
        } catch (error) {
          console.error("❌ GET_PAGE_BLOCKCHAIN_DATA error:", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "PAGE_ANALYSIS":
        try {
          // Log page analysis data for debugging
          console.log("📋 Page analysis received:", message.data)
          // This is a fire-and-forget message, no response needed
        } catch (error) {
          console.error("❌ PAGE_ANALYSIS error:", error)
        }
        break

      case "URL_CHANGED":
        try {
          // Log URL change for debugging
          console.log("🔗 URL changed:", message.data)
          // This is a fire-and-forget message, no response needed
        } catch (error) {
          console.error("❌ URL_CHANGED error:", error)
        }
        break

      case "WALLET_CONNECTED":
        try {
          const walletAddress = message.data?.walletAddress || message.walletAddress
          if (walletAddress) {
            await chrome.storage.session.set({ walletAddress })
            console.log("✅ Wallet connected:", walletAddress)
            sendResponse({ success: true })
          } else {
            sendResponse({ success: false, error: "No wallet address provided" })
          }
        } catch (error) {
          console.error("❌ WALLET_CONNECTED error:", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "WALLET_DISCONNECTED":
        try {
          await chrome.storage.session.remove('walletAddress')
          console.log("✅ Wallet disconnected")
          sendResponse({ success: true })
        } catch (error) {
          console.error("❌ WALLET_DISCONNECTED error:", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      // =====================================================
      // 🆕 INTENTION GROUPS HANDLERS
      // =====================================================

      case "GET_INTENTION_GROUPS":
        try {
          const groups = await groupManager.getAllGroups()
          sendResponse({ success: true, groups })
        } catch (error) {
          console.error("❌ GET_INTENTION_GROUPS error:", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "GET_GROUP_DETAILS":
        try {
          const groupId = message.groupId || message.data?.groupId
          if (!groupId) {
            sendResponse({ success: false, error: "Group ID required" })
            return true
          }
          const group = await groupManager.getGroup(groupId)
          if (group) {
            const stats = groupManager.getGroupStats(group)
            sendResponse({ success: true, group, stats })
          } else {
            sendResponse({ success: false, error: "Group not found" })
          }
        } catch (error) {
          console.error("❌ GET_GROUP_DETAILS error:", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "GET_USER_XP":
        try {
          const xpStats = await xpService.getStats()
          sendResponse({ success: true, ...xpStats })
        } catch (error) {
          console.error("❌ GET_USER_XP error:", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "CERTIFY_URL":
        try {
          const { groupId: certGroupId, url: certUrl, certification } = message.data || message
          if (!certGroupId || !certUrl || !certification) {
            sendResponse({ success: false, error: "groupId, url, and certification required" })
            return true
          }
          const certResult = await groupManager.certifyUrl(certGroupId, certUrl, certification)
          sendResponse({ success: certResult.success, xpGained: certResult.xpGained, error: certResult.error })
        } catch (error) {
          console.error("❌ CERTIFY_URL error:", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "REMOVE_URL_FROM_GROUP":
        try {
          const { groupId: removeGroupId, url: removeUrl } = message.data || message
          if (!removeGroupId || !removeUrl) {
            sendResponse({ success: false, error: "groupId and url required" })
            return true
          }
          const removed = await groupManager.removeUrl(removeGroupId, removeUrl)
          sendResponse({ success: removed })
        } catch (error) {
          console.error("❌ REMOVE_URL_FROM_GROUP error:", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "DELETE_GROUP":
        try {
          const { groupId: deleteGroupId } = message.data || message
          if (!deleteGroupId) {
            sendResponse({ success: false, error: "groupId required" })
            return true
          }
          await groupManager.deleteGroup(deleteGroupId)
          sendResponse({ success: true })
        } catch (error) {
          console.error("❌ DELETE_GROUP error:", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "GET_LEVEL_UP_COST":
        try {
          const { groupId: lvlGroupId } = message.data || message
          if (!lvlGroupId) {
            sendResponse({ success: false, error: "groupId required" })
            return true
          }
          const lvlGroup = await groupManager.getGroup(lvlGroupId)
          if (!lvlGroup) {
            sendResponse({ success: false, error: "Group not found" })
            return true
          }
          const cost = getLevelUpCost(lvlGroup.level)
          const xpStats = await xpService.getStats()
          sendResponse({
            success: true,
            cost,
            currentLevel: lvlGroup.level,
            availableXP: xpStats.totalXP,
            canAfford: xpStats.totalXP >= cost
          })
        } catch (error) {
          console.error("❌ GET_LEVEL_UP_COST error:", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "TRACK_URL":
        try {
          const { url: trackUrl, title: trackTitle, duration, favicon } = message.data || message
          if (!trackUrl) {
            sendResponse({ success: false, error: "url required" })
            return true
          }
          sessionTracker.trackUrl({ url: trackUrl, title: trackTitle || trackUrl, duration, favicon })
          sendResponse({ success: true })
        } catch (error) {
          console.error("❌ TRACK_URL error:", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "FORCE_FLUSH_TRACKER":
        try {
          const clusters = await sessionTracker.forceFlush()
          sendResponse({ success: true, clustersCount: clusters.length })
        } catch (error) {
          console.error("❌ FORCE_FLUSH_TRACKER error:", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "LEVEL_UP_GROUP":
        try {
          const { groupId: levelUpGroupId } = message.data || message
          if (!levelUpGroupId) {
            sendResponse({ success: false, error: "groupId required" })
            return true
          }
          console.log(`🎮 [messageHandlers] Level up request for group: ${levelUpGroupId}`)
          const levelUpResult = await levelUpService.levelUp(levelUpGroupId)
          sendResponse({
            success: levelUpResult.success,
            ...levelUpResult
          })
        } catch (error) {
          console.error("❌ LEVEL_UP_GROUP error:", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "PREVIEW_LEVEL_UP":
        try {
          const { groupId: previewGroupId } = message.data || message
          if (!previewGroupId) {
            sendResponse({ success: false, error: "groupId required" })
            return true
          }
          const preview = await levelUpService.previewLevelUp(previewGroupId)
          if (preview) {
            sendResponse({ success: true, ...preview })
          } else {
            sendResponse({ success: false, error: "Group not found" })
          }
        } catch (error) {
          console.error("❌ PREVIEW_LEVEL_UP error:", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

    }

    sendResponse({ success: true })
    })().catch(error => {
      console.error("❌ Message handler error:", error)
      sendResponse({ success: false, error: error.message })
    })
    return true
  })
}