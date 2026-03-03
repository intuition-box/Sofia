import {
  badgeService, pageDataService, pulseService, tripletStorageService,
  groupManager, xpService, XPServiceClass, goldService, getLevelUpCost,
  currencyMigrationService, sessionTracker, levelUpService,
  type TrackedUrl, type DomainCluster
} from "../lib/services"
import type { ChromeMessage, MessageResponse } from "../types/messages"
import { sendMessage, sendThemeExtractionRequest, sendRecommendationRequest } from "./agentRouter"
import { intuitionGraphqlClient } from "../lib/clients/graphql-client"
import { getAddress } from "viem"
import { getAllBookmarks, getAllHistory } from "./messageSenders"
import { initializeOnWalletConnect } from "./index"
import { oauthService } from "./oauth"
import { IntentionGroupsService } from "../lib/database"
import { createServiceLogger } from '../lib/utils/logger'

const logger = createServiceLogger('MessageHandlers')

// Flag to prevent duplicate message handlers registration
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
      logger.info(`Starting ${type} analysis for ${result.urls.length} URLs`)
      const finalResult = await processor(result.urls)
      sendResponse(finalResult)
    } else {
      sendResponse({ success: false, error: result.error })
    }
  } catch (error) {
    logger.error(`${type} extraction error`, error)
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

    logger.info('[messageHandlers] Generating recommendations for wallet', { address: walletData.address })

    // Send request and wait for response (imported at top)
    const recommendationsData = await sendRecommendationRequest(walletData)

    if (!recommendationsData) {
      sendResponse({ success: false, error: "No recommendations received from agent" })
      return
    }

    // Extract recommendations array from response
    const recommendations = recommendationsData.recommendations || []

    logger.info(`[messageHandlers] Received ${recommendations.length} recommendation categories`)
    sendResponse({
      success: true,
      recommendations
    })

  } catch (error) {
    logger.error('[messageHandlers] Recommendation generation failed', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
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
    logger.warn("[messageHandlers] Handlers already registered, skipping")
    return
  }
  handlersRegistered = true
  logger.info("[messageHandlers] Registering message handlers...")

  // Handle external messages from auth page (localhost:3000 or sofia.intuition.box)
  chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    logger.debug('External message received', { type: message.type, origin: sender.origin })

    // SECURITY: Validate origin before processing any external message
    const isAllowedOrigin = sender.origin && ALLOWED_EXTERNAL_ORIGINS.some(
      allowed => sender.origin!.startsWith(allowed)
    )

    if (!isAllowedOrigin) {
      logger.warn('Rejected external message from untrusted origin', { origin: sender.origin })
      sendResponse({ success: false, error: 'Untrusted origin' })
      return true
    }

    if (message.type === 'WALLET_CONNECTED') {
      const walletAddress = message.data?.walletAddress || message.walletAddress
      const walletType = message.data?.walletType || message.walletType || null
      if (walletAddress) {
        (async () => {
          try {
            // Check if wallet changed using persistent lastActiveWallet
            const { lastActiveWallet } = await chrome.storage.local.get('lastActiveWallet')
            if (lastActiveWallet && lastActiveWallet.toLowerCase() !== walletAddress.toLowerCase()) {
              logger.info('[messageHandlers] Wallet changed', { from: lastActiveWallet, to: walletAddress })
              await IntentionGroupsService.clearAll()
            }
            // Update lastActiveWallet
            await chrome.storage.local.set({ lastActiveWallet: walletAddress })
            await chrome.storage.session.set({ walletAddress, walletType })
            // Migrate XP from non-prefixed keys to wallet-prefixed keys (one-time)
            await XPServiceClass.migrateToWalletKeys(walletAddress)
            // Migrate unified XP to dual currency (XP + Gold) — one-time, idempotent
            await currencyMigrationService.migrate(walletAddress)
            logger.info('Wallet connected from external page', { walletAddress, walletType })
            await initializeOnWalletConnect()
            sendResponse({ success: true })
          } catch (error) {
            logger.error('Failed to save wallet', error)
            sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
          }
        })()
      } else {
        sendResponse({ success: false, error: 'No wallet address provided' })
      }
      return true
    }

    if (message.type === 'WALLET_DISCONNECTED') {
      chrome.storage.session.remove(['walletAddress', 'walletType']).then(() => {
        logger.info('Wallet disconnected from external page')
        sendResponse({ success: true })
      }).catch((error) => {
        logger.error('Failed to disconnect wallet', error)
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
        logger.warn('Unsupported OAuth platform', { platform: platformName })
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
          logger.info(`${platformName} OAuth token received and stored`)
          sendResponse({ success: true })
        }).catch((error) => {
          logger.error(`Failed to store ${platformName} token`, error)
          sendResponse({ success: false, error: error.message })
        })
      } else {
        sendResponse({ success: false, error: 'No access token provided' })
      }
      return true
    }

    if (message.type === 'FIRST_CLAIM') {
      const url = message.data?.url || 'https://sofia.intuition.box'
      ;(async () => {
        try {
          await chrome.storage.session.set({
            pending_first_claim: { url }
          })
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
          if (tab?.id) {
            await chrome.sidePanel.open({ tabId: tab.id })
          }
          logger.info('First claim intent stored', { url })
          sendResponse({ success: true })
        } catch (error) {
          logger.error('Failed to handle FIRST_CLAIM', error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
      })()
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
          logger.error("Failed to send chatbot message", error)
          sendResponse({ success: false, error: error.message })
        }
        return true


      case "GET_TRACKING_STATS":
        sendResponse({
          success: true,
          data: { message: "Data sent directly to agent - no local storage" }
        })
        break

      case "CLEAR_TRACKING_DATA":
        sendResponse({ success: true, message: "No local data to clear" })
        break

      case "FETCH_BOOKMARKS":
        // Return bookmarks list without processing (for selection UI)
        try {
          const fetchResult = await getAllBookmarks()
          sendResponse({ success: true, bookmarks: fetchResult.bookmarks || [] })
        } catch (error) {
          logger.error("FETCH_BOOKMARKS error", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "GET_BOOKMARKS":
      case "IMPORT_SELECTED_BOOKMARKS": {
        // GET_BOOKMARKS: fetch all + import (orb button)
        // IMPORT_SELECTED_BOOKMARKS: import only selected bookmarks (onboarding)
        try {
          let bookmarksToImport: { url: string; title: string }[]

          if (message.type === "IMPORT_SELECTED_BOOKMARKS" && message.data?.bookmarks) {
            bookmarksToImport = message.data.bookmarks
          } else {
            const bookmarkResult = await getAllBookmarks()
            if (!bookmarkResult.success || !bookmarkResult.bookmarks) {
              sendResponse({ success: false, error: bookmarkResult.error })
              return true
            }
            bookmarksToImport = bookmarkResult.bookmarks
          }

          // Group bookmarks by domain → DomainCluster[]
          const domainMap = new Map<string, TrackedUrl[]>()
          for (const bm of bookmarksToImport) {
            try {
              const domain = new URL(bm.url).hostname.replace('www.', '')
              if (!domainMap.has(domain)) domainMap.set(domain, [])
              domainMap.get(domain)!.push({
                url: bm.url,
                title: bm.title,
                domain,
                duration: 0,
                visitedAt: Date.now()
              })
            } catch { /* skip invalid URLs */ }
          }

          const clusters: DomainCluster[] = Array.from(domainMap.entries()).map(([domain, urls]) => ({
            domain,
            urls,
            totalDuration: 0
          }))

          await groupManager.processFlush(clusters)

          // Send completion notification to UI
          chrome.runtime.sendMessage({
            type: 'THEME_EXTRACTION_COMPLETE',
            themesExtracted: clusters.length
          }).catch(() => {})

          sendResponse({
            success: true,
            message: `Imported ${bookmarksToImport.length} bookmarks into ${clusters.length} groups`
          })
        } catch (error) {
          logger.error("IMPORT_BOOKMARKS error", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true
      }

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
          logger.error("GET_PAGE_BLOCKCHAIN_DATA error", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "PAGE_ANALYSIS":
        try {
          // Log page analysis data for debugging
          logger.debug("Page analysis received", message.data)
          // This is a fire-and-forget message, no response needed
        } catch (error) {
          logger.error("PAGE_ANALYSIS error", error)
        }
        break

      case "URL_CHANGED":
        try {
          // Log URL change for debugging
          logger.debug("URL changed", message.data)
          // This is a fire-and-forget message, no response needed
        } catch (error) {
          logger.error("URL_CHANGED error", error)
        }
        break

      case "WALLET_DISCONNECTED":
        try {
          await chrome.storage.session.remove(['walletAddress', 'walletType'])
          logger.info("Wallet disconnected")
          sendResponse({ success: true })
        } catch (error) {
          logger.error("WALLET_DISCONNECTED error", error)
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
          logger.error("GET_INTENTION_GROUPS error", error)
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
          logger.error("GET_GROUP_DETAILS error", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "GET_USER_XP":
        try {
          const { lastActiveWallet: xpWallet } = await chrome.storage.local.get('lastActiveWallet')
          const xpStats = await xpService.getStats(xpWallet || '')
          const goldStats = await goldService.getStats(xpWallet || '')
          sendResponse({ success: true, xp: xpStats, gold: goldStats })
        } catch (error) {
          logger.error("GET_USER_XP error", error)
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
          sendResponse({ success: certResult.success, goldGained: certResult.goldGained, error: certResult.error })
        } catch (error) {
          logger.error("CERTIFY_URL error", error)
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
          logger.error("REMOVE_URL_FROM_GROUP error", error)
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
          logger.error("DELETE_GROUP error", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "UPDATE_GROUP_LEVEL":
        // Restore level from on-chain data (used when local cache is stale)
        try {
          const { groupId: updateLvlGroupId, level: newLevel, certifiedCount } = message.data || message
          if (!updateLvlGroupId || !newLevel) {
            sendResponse({ success: false, error: "groupId and level required" })
            return true
          }
          const groupToUpdate = await groupManager.getGroup(updateLvlGroupId)
          if (!groupToUpdate) {
            sendResponse({ success: false, error: "Group not found" })
            return true
          }
          // Allow both upgrades and downgrades (sync with on-chain)
          if (newLevel !== groupToUpdate.level) {
            groupToUpdate.level = newLevel
            if (certifiedCount) {
              groupToUpdate.totalCertifications = certifiedCount
            }
            groupToUpdate.updatedAt = Date.now()
            await IntentionGroupsService.saveGroup(groupToUpdate)
            logger.info(`[messageHandlers] Updated level for ${updateLvlGroupId}: ${newLevel}`)
          }
          sendResponse({ success: true })
        } catch (error) {
          logger.error("UPDATE_GROUP_LEVEL error", error)
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
          const { lastActiveWallet: lvlWallet } = await chrome.storage.local.get('lastActiveWallet')
          const goldStats = await goldService.getStats(lvlWallet || '')
          sendResponse({
            success: true,
            cost,
            currentLevel: lvlGroup.level,
            availableGold: goldStats.totalGold,
            canAfford: goldStats.totalGold >= cost
          })
        } catch (error) {
          logger.error("GET_LEVEL_UP_COST error", error)
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
          logger.error("TRACK_URL error", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "FORCE_FLUSH_TRACKER":
        try {
          const clusters = await sessionTracker.forceFlush()
          sendResponse({ success: true, clustersCount: clusters.length })
        } catch (error) {
          logger.error("FORCE_FLUSH_TRACKER error", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "LEVEL_UP_GROUP":
        try {
          const { groupId: levelUpGroupId, certificationBreakdown, targetLevel } = message.data || message
          if (!levelUpGroupId) {
            sendResponse({ success: false, error: "groupId required" })
            return true
          }
          logger.info(`[messageHandlers] Level up request for group: ${levelUpGroupId}`, { targetLevel })
          const levelUpResult = await levelUpService.levelUp(levelUpGroupId, certificationBreakdown, targetLevel)
          sendResponse({
            success: levelUpResult.success,
            ...levelUpResult
          })
        } catch (error) {
          logger.error("LEVEL_UP_GROUP error", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "PREVIEW_LEVEL_UP":
        try {
          const { groupId: previewGroupId, targetLevel: previewTargetLevel } = message.data || message
          if (!previewGroupId) {
            sendResponse({ success: false, error: "groupId required" })
            return true
          }
          const preview = await levelUpService.previewLevelUp(previewGroupId, previewTargetLevel)
          if (preview) {
            sendResponse({ success: true, ...preview })
          } else {
            sendResponse({ success: false, error: "Group not found" })
          }
        } catch (error) {
          logger.error("PREVIEW_LEVEL_UP error", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      // =====================================================
      // DEEP LINK: Share page → UserProfilePage
      // =====================================================

      case "DEEP_LINK_PROFILE":
        try {
          const { wallet, name } = message.data || {}
          if (!wallet) {
            sendResponse({ success: false, error: "wallet required" })
            return true
          }

          // Resolve Account atom termId from wallet address
          const checksumAddress = getAddress(wallet)
          const lowercaseAddress = checksumAddress.toLowerCase()

          const FIND_ACCOUNT_ATOM = `
            query FindAccountAtom($address: String!) {
              atoms(where: { _and: [{ data: { _ilike: $address } }, { type: { _eq: "Account" } }] }, limit: 1) {
                term_id
              }
            }
          `

          const atomResponse = await intuitionGraphqlClient.request(FIND_ACCOUNT_ATOM, {
            address: `%${lowercaseAddress}%`
          })

          const termId = atomResponse?.atoms?.[0]?.term_id || ""

          // Store navigation intent in session storage
          await chrome.storage.session.set({
            pending_profile_view: {
              termId,
              label: name || `${wallet.slice(0, 6)}...${wallet.slice(-4)}`,
              walletAddress: checksumAddress,
            }
          })

          logger.info("[Deep Link] Profile intent stored for " + checksumAddress.slice(0, 8) + "...")
          sendResponse({ success: true })
        } catch (error) {
          logger.error("DEEP_LINK_PROFILE error", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

    }

    sendResponse({ success: false, error: 'Unknown message type: ' + message.type })
    })().catch(error => {
      logger.error("Message handler error", error)
      sendResponse({ success: false, error: error.message })
    })
    return true
  })
}