import {
  badgeService, pageDataService,
  groupManager, XPServiceClass,
  sessionTracker, levelUpService,
  browsingNudgeService,
  type TrackedUrl, type DomainCluster
} from "../lib/services"
import type { ChromeMessage, MessageResponse } from "../types/messages"
import { sendMessage } from "./agentRouter"
import { intuitionGraphqlClient } from "../lib/clients/graphql-client"
import { getAddress, recoverMessageAddress } from "viem"
import { getAllBookmarks } from "./messageSenders"
import { initializeOnWalletConnect } from "./index"
import { oauthService } from "./oauth"
import { IntentionGroupsService } from "../lib/database"
import { createServiceLogger } from '../lib/utils/logger'

const logger = createServiceLogger('MessageHandlers')

// SIWE proofs older than this window are rejected (anti-replay).
const SIWE_MAX_AGE_MS = 5 * 60 * 1000  // 5 minutes

/**
 * Verify a Sign-In With Ethereum (EIP-4361) proof for a WALLET_CONNECTED
 * message. Returns null on success, or an error string describing why the
 * proof was rejected.
 *
 * The extension trusts the rejected origin (already gated by
 * ALLOWED_EXTERNAL_ORIGINS) but does NOT trust that the page knows the
 * wallet's private key without a signature, otherwise an XSS on the landing
 * could persist any wallet address in chrome.storage.session and phish
 * the user inside Sofia.
 */
async function verifySiweProof(args: {
  walletAddress: string
  siweMessage: string
  siweSignature: string
  expectedDomain: string | undefined
}): Promise<string | null> {
  const { walletAddress, siweMessage, siweSignature, expectedDomain } = args

  if (!siweMessage || !siweSignature) {
    return 'Missing SIWE proof'
  }

  // Domain check: the message MUST start with the origin we accepted the
  // payload from (defence against a SIWE generated for another dApp).
  if (expectedDomain) {
    const stripped = expectedDomain.replace(/^https?:\/\//, '')
    if (!siweMessage.startsWith(`${stripped} wants you to sign in with your Ethereum account:`)) {
      return `SIWE domain mismatch (expected ${stripped})`
    }
  }

  // Anti-replay: parse `Issued At:` line and reject messages older than the
  // window (also reject far-future timestamps to defend against clock skew).
  const issuedAtMatch = siweMessage.match(/^Issued At: (.+)$/m)
  if (!issuedAtMatch) {
    return 'SIWE missing Issued At'
  }
  const issuedAt = Date.parse(issuedAtMatch[1])
  if (Number.isNaN(issuedAt)) {
    return 'SIWE Issued At not parseable'
  }
  const now = Date.now()
  if (Math.abs(now - issuedAt) > SIWE_MAX_AGE_MS) {
    return `SIWE expired (issued ${Math.round((now - issuedAt) / 1000)}s ago)`
  }

  // Signature check: the recovered address MUST equal the claimed wallet.
  let recovered: string
  try {
    recovered = await recoverMessageAddress({
      message: siweMessage,
      signature: siweSignature as `0x${string}`
    })
  } catch (err) {
    return `Signature recover failed: ${err instanceof Error ? err.message : 'unknown'}`
  }

  if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
    return `Signature does not match claimed address (recovered ${recovered})`
  }

  return null
}

// Flag to prevent duplicate message handlers registration
let handlersRegistered = false


// Allowed origins for external messages (security).
// `localhost:3000` is filtered out at runtime in mainnet builds (defence in
// depth on top of the post-build manifest stripping in scripts/post-build.js).
const ALLOWED_EXTERNAL_ORIGINS = (() => {
  const origins = ['https://doc.sofia.intuition.box', 'http://localhost:3000']
  if (process.env.PLASMO_PUBLIC_NETWORK === 'mainnet') {
    return origins.filter((o) => !/^https?:\/\/localhost(:\d+)?$/i.test(o))
  }
  return origins
})()

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
      const siweMessage =
        message.data?.siweMessage || message.siweMessage || ''
      const siweSignature =
        message.data?.siweSignature || message.siweSignature || ''
      if (walletAddress) {
        (async () => {
          try {
            // SIWE proof verification: prove the page actually controls the
            // wallet's private key, not just that it can claim an address.
            const siweError = await verifySiweProof({
              walletAddress,
              siweMessage,
              siweSignature,
              expectedDomain: sender.origin
            })
            if (siweError) {
              logger.warn('Rejected WALLET_CONNECTED: invalid SIWE proof', {
                origin: sender.origin,
                walletAddress,
                reason: siweError
              })
              sendResponse({ success: false, error: siweError })
              return
            }

            // Check if wallet changed using persistent lastActiveWallet
            const { lastActiveWallet } = await chrome.storage.local.get('lastActiveWallet')
            if (lastActiveWallet && lastActiveWallet.toLowerCase() !== walletAddress.toLowerCase()) {
              logger.info('[messageHandlers] Wallet changed', { from: lastActiveWallet, to: walletAddress })
              await IntentionGroupsService.clearAll()
            }
            // Update lastActiveWallet
            await chrome.storage.local.set({ lastActiveWallet: walletAddress })
            await chrome.storage.session.set({ walletAddress, walletType, pending_external_auth: true })
            // Migrate XP from non-prefixed keys to wallet-prefixed keys (one-time)
            await XPServiceClass.migrateToWalletKeys(walletAddress)
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
      const url = message.data?.url || 'https://doc.sofia.intuition.box'
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

      case "TRIPLET_PUBLISHED":
        badgeService.handleBadgeUpdate(sendResponse)
        return true

      case "INITIALIZE_BADGE":
        badgeService.handleBadgeUpdate(sendResponse)
        return true

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

      case "TRACK_URL":
        try {
          const { url: trackUrl, title: trackTitle, duration, favicon } = message.data || message
          if (!trackUrl) {
            sendResponse({ success: false, error: "url required" })
            return true
          }
          sessionTracker.trackUrl({ url: trackUrl, title: trackTitle || trackUrl, duration, favicon })
          browsingNudgeService.incrementAndCheck()
          sendResponse({ success: true })
        } catch (error) {
          logger.error("TRACK_URL error", error)
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
        return true

      case "NUDGE_DISMISSED":
        browsingNudgeService.resetCounter()
        sendResponse({ success: true })
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