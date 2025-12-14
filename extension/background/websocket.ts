import { io, Socket } from "socket.io-client"
import { CHATBOT_BASE_IDS } from "./constants"
import { getUserAgentIds, getWalletAddress, type AgentIds } from "../lib/services/UserSessionManager"
import { agentChannelsService } from "../lib/database/indexedDB-methods"
import { sofiaDB, STORES } from "../lib/database/indexedDB"
import { SOFIA_SERVER_URL } from "../config"
import {
  sendThemeExtractionToMastra,
  sendPulseToMastra,
  sendRecommendationToMastra,
  sendSofiaToMastra
} from "./mastraClient"

/**
 * Extract text from ElizaOS message with fallback chain
 * Handles different message formats from ElizaOS server
 */
function extractMessageText(data: any): string {
  return (
    data.text ||
    data.content?.text ||
    data.payload?.content?.text ||
    data.message ||
    data.payload?.message ||
    ""
  )
}

/**
 * Check if a messageBroadcast is from the expected agent in the expected channel
 * Handles both channelId and roomId (ElizaOS may send either)
 */
function isMessageFromAgent(data: any, agentIds: AgentIds): boolean {
  const channelMatch = (data.channelId === agentIds.CHANNEL_ID || data.roomId === agentIds.CHANNEL_ID)
  const isFromAgent = (data.senderId === agentIds.AGENT_ID)
  return channelMatch && isFromAgent
}

/**
 * Unified function to handle messageBroadcast from agents
 * Used by ChatBot to process incoming messages
 */
async function handleAgentMessage(
  data: any,
  agentIds: AgentIds,
  agentName: string,
  customHandler?: (messageText: string) => Promise<void>
): Promise<void> {
  console.log(`📡 [${agentName}] messageBroadcast received:`, {
    channelId: data.channelId,
    roomId: data.roomId,
    senderId: data.senderId,
    expectedChannelId: agentIds.CHANNEL_ID,
    expectedAgentId: agentIds.AGENT_ID,
    isFromAgent: isMessageFromAgent(data, agentIds)
  })

  if (isMessageFromAgent(data, agentIds)) {
    console.log(`✅ [${agentName}] Agent response matched! Processing...`)

    try {
      const messageText = extractMessageText(data)
      console.log(`📝 [${agentName}] Raw message (full):`, messageText)

      if (customHandler) {
        await customHandler(messageText)
      }
    } catch (error) {
      console.error(`❌ [${agentName}] Failed to process message:`, error)
    }
  } else {
    console.log(`⏭️ [${agentName}] Message not for us (from user or different channel)`)
  }
}

/**
 * Unified function to handle channel retrieval/creation and ROOM_JOINING
 * Used by ChatBot for ElizaOS WebSocket communication
 */
async function setupAgentChannel(
  socket: Socket,
  agentIds: AgentIds,
  agentName: string,
  onReady?: () => void
): Promise<void> {
  try {
    const walletAddress = await getWalletAddress()
    const storedChannelId = await agentChannelsService.getStoredChannelId(walletAddress, agentName)

    if (storedChannelId) {
      agentIds.ROOM_ID = storedChannelId
      agentIds.CHANNEL_ID = storedChannelId
      console.log(`♻️ [${agentName}] Reusing existing channel: ${storedChannelId}`)

      socket.emit("message", {
        type: 1,  // ROOM_JOINING
        payload: {
          roomId: storedChannelId,
          entityId: agentIds.AUTHOR_ID,
          metadata: { channelType: "DM" }
        }
      })
      console.log(`📨 [${agentName}] Sent ROOM_JOINING for existing channel: ${storedChannelId}`)

      if (onReady) onReady()
      return
    }

    console.log(`🔧 [${agentName}] No existing channel, creating new one via REST API...`)
    const response = await fetch(`${SOFIA_SERVER_URL}/api/messaging/central-channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `DM-${agentName}-${Date.now()}`,
        type: 2,
        server_id: agentIds.SERVER_ID,
        participantCentralUserIds: [agentIds.AUTHOR_ID, agentIds.AGENT_ID],
        metadata: {
          isDm: true,
          source: "extension",
          createdAt: new Date().toISOString()
        }
      })
    })

    if (response.ok) {
      const result = await response.json()
      const channelData = result.data || result
      console.log(`✅ [${agentName}] DM channel created via REST API:`, channelData)

      if (channelData.id) {
        agentIds.ROOM_ID = channelData.id
        agentIds.CHANNEL_ID = channelData.id
        console.log(`💾 [${agentName}] Updated ROOM_ID and CHANNEL_ID to use real channel ID: ${agentIds.ROOM_ID}`)

        await agentChannelsService.storeChannelId(walletAddress, agentName, channelData.id, agentIds.AGENT_ID)
        console.log(`💾 [${agentName}] Channel ID persisted to IndexedDB`)

        try {
          const addAgentResponse = await fetch(
            `${SOFIA_SERVER_URL}/api/messaging/central-channels/${channelData.id}/agents`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ agentId: agentIds.AGENT_ID })
            }
          )

          if (addAgentResponse.ok) {
            console.log(`✅ [${agentName}] Agent added to channel successfully`)
          } else {
            const errorText = await addAgentResponse.text()
            console.warn(`⚠️ [${agentName}] Could not add agent: ${addAgentResponse.status} ${errorText}`)
          }
        } catch (addError) {
          console.error(`❌ [${agentName}] Error adding agent to channel:`, addError)
        }

        socket.emit("message", {
          type: 1,  // ROOM_JOINING
          payload: {
            roomId: channelData.id,
            entityId: agentIds.AUTHOR_ID,
            metadata: { isDm: true, channelType: "DM" }
          }
        })
        console.log(`📨 [${agentName}] Sent ROOM_JOINING for new channel: ${channelData.id}`)

        if (onReady) onReady()
      }
    } else {
      const errorText = await response.text()
      console.error(`❌ [${agentName}] Failed to create DM channel:`, errorText)
    }
  } catch (error) {
    console.error(`❌ [${agentName}] Error in setupAgentChannel:`, error)
  }
}

// Only ChatBot socket is needed (WebSocket for real-time chat)
let socketBot: Socket

// Cache des IDs utilisateur (only chatbot now)
let userAgentIds: {
  chatbot: AgentIds
} | null = null

/**
 * Initialize user agent IDs (called once at extension startup)
 * Only ChatBot uses ElizaOS WebSocket now
 */
export async function initializeUserAgentIds(): Promise<void> {
  userAgentIds = {
    chatbot: await getUserAgentIds("ChatBot", CHATBOT_BASE_IDS.AGENT_ID)
  }

  console.log("✅ User agent IDs initialized (ChatBot only):", userAgentIds)
}

/**
 * Export pour utilisation dans d'autres fichiers
 */
export function getUserAgentIdsCache() {
  return userAgentIds
}

// Export socket for direct access (ChatBot only)
export function getChatbotSocket(): Socket { return socketBot }

// Common WebSocket configuration
const commonSocketConfig = {
  transports: ["websocket"],
  path: "/socket.io",
  reconnection: true,
  reconnectionDelay: 5000,
  reconnectionDelayMax: 30000,
  reconnectionAttempts: Infinity,
  timeout: 20000
}

// === ChatBot WebSocket (kept for real-time chat) ===
export async function initializeChatbotSocket(onReady?: () => void): Promise<void> {
  if (!userAgentIds) {
    await initializeUserAgentIds()
  }

  const chatbotIds = userAgentIds!.chatbot

  if (socketBot?.connected) {
    console.log("⚠️ Chatbot socket already connected, skipping re-initialization")
    if (typeof onReady === "function") {
      onReady()
    }
    return
  }
  if (socketBot) {
    socketBot.removeAllListeners()
    socketBot.disconnect()
  }

  socketBot = io(SOFIA_SERVER_URL, commonSocketConfig)

  socketBot.on("connect", async () => {
    console.log("🤖 Connected to Chatbot, socket ID:", socketBot.id)
    console.log("🔑 Using user-specific IDs:", chatbotIds)

    await setupAgentChannel(socketBot, chatbotIds, "ChatBot", onReady)
  })

  socketBot.on("messageBroadcast", async (data) => {
    await handleAgentMessage(data, chatbotIds, "ChatBot", async (messageText) => {
      chrome.runtime.sendMessage({
        type: "CHATBOT_RESPONSE",
        text: messageText
      }).catch((error) => {
        console.warn("⚠️ [Chatbot] Error sending CHATBOT_RESPONSE:", error)
      })
      console.log("✅ [Chatbot] Response sent to UI:", messageText.substring(0, 50))
    })
  })

  socketBot.on("disconnect", (reason) => {
    console.warn("🔌 Chatbot socket disconnected:", reason)
  })
}

// === Mastra HTTP functions (replacing WebSocket for SofIA, ThemeExtractor, Pulse, Recommendation) ===

/**
 * Send theme extraction request to Mastra ThemeExtractor agent
 * @param urls - Array of URLs to analyze for themes
 * @returns Promise resolving to extracted themes
 */
export async function sendThemeExtractionRequest(urls: string[]): Promise<any[]> {
  console.log(`🎨 [ThemeExtractor] Sending ${urls.length} URLs to Mastra`)

  try {
    const triplets = await sendThemeExtractionToMastra(urls)

    // Store triplets in IndexedDB for EchoesTab
    if (Array.isArray(triplets) && triplets.length > 0) {
      const enrichedTriplets = triplets.map((t: any) => ({
        subject: t.subject || "User",
        predicate: t.predicate,
        object: t.object,
        objectUrl: t.objectUrl || (t.urls && t.urls.length > 0 ? t.urls[0] : '')
      }))

      const parsedRecord = {
        messageId: `theme_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        content: {
          triplets: enrichedTriplets,
          intention: `Extracted from bookmarks`
        },
        timestamp: Date.now(),
        type: 'parsed_message'
      }

      await sofiaDB.put(STORES.ELIZA_DATA, parsedRecord)
      console.log("✅ [ThemeExtractor] Triplets stored in IndexedDB:", { count: enrichedTriplets.length })

      try {
        chrome.runtime.sendMessage({ type: "ECHOES_UPDATED" })
      } catch (e) {
        console.warn("⚠️ [ThemeExtractor] Could not notify UI:", e)
      }
    }

    return triplets
  } catch (error) {
    console.error("❌ [ThemeExtractor] Mastra request failed:", error)
    return []
  }
}

/**
 * Send recommendation request to Mastra RecommendationAgent
 * @param walletData - Wallet data and user interests
 * @returns Promise resolving to recommendations
 */
export async function sendRecommendationRequest(walletData: any): Promise<any> {
  console.log(`💎 [Recommendation] Sending request to Mastra`)

  try {
    const recommendations = await sendRecommendationToMastra(walletData)
    console.log("✅ [Recommendation] Received from Mastra:", recommendations)
    return recommendations
  } catch (error) {
    console.error("❌ [Recommendation] Mastra request failed:", error)
    return null
  }
}

/**
 * Send a message to a specific agent
 * ChatBot uses WebSocket, others use Mastra HTTP
 * @param agentType - Which agent to send to
 * @param text - Message text to send
 */
export async function sendMessage(agentType: 'SOFIA' | 'CHATBOT' | 'THEMEEXTRACTOR' | 'PULSEAGENT' | 'RECOMMENDATION', text: string): Promise<any> {
  // Ensure IDs are initialized for ChatBot
  if (!userAgentIds) {
    await initializeUserAgentIds()
  }

  switch (agentType) {
    case 'CHATBOT':
      // ChatBot uses WebSocket (real-time)
      if (!socketBot || !socketBot.connected) {
        throw new Error(`Socket for CHATBOT is not connected`)
      }

      const chatbotIds = userAgentIds!.chatbot
      console.log(`📤 [CHATBOT] Sending message via WebSocket:`, text.substring(0, 100))

      const payload = {
        type: 2,  // SEND_MESSAGE
        payload: {
          channelId: chatbotIds.CHANNEL_ID,
          serverId: chatbotIds.SERVER_ID,
          senderId: chatbotIds.AUTHOR_ID,
          message: text,
          metadata: {
            source: "extension",
            timestamp: Date.now(),
            user_display_name: "User",
            isDm: true,
            channelType: "DM"
          }
        }
      }

      socketBot.emit("message", payload)
      console.log(`✅ [CHATBOT] Message sent via Socket.IO to channel ${chatbotIds.CHANNEL_ID}`)
      return

    case 'SOFIA':
      // SofIA uses Mastra HTTP - parse the text to extract fields
      console.log(`🧠 [SOFIA] Sending to Mastra:`, text.substring(0, 100))
      // For SofIA, the text format is: "URL: ...\nTitle: ...\nDescription: ...\nAttention Score: ...\nVisits: ..."
      const urlMatch = text.match(/URL:\s*(.+)/i)
      const titleMatch = text.match(/Title:\s*(.+)/i)
      const descMatch = text.match(/Description:\s*(.*)/i)
      const attentionMatch = text.match(/Attention\s*Score:\s*([\d.]+)/i)
      const visitsMatch = text.match(/Visits:\s*(\d+)/i)

      try {
        const sofiaResult = await sendSofiaToMastra(
          urlMatch?.[1]?.trim() || '',
          titleMatch?.[1]?.trim() || '',
          descMatch?.[1]?.trim() || '',
          parseFloat(attentionMatch?.[1] || '0'),
          parseInt(visitsMatch?.[1] || '0', 10)
        )

        // Store SofIA triplets in IndexedDB
        if (sofiaResult && sofiaResult.triplets && sofiaResult.triplets.length > 0) {
          const sofiaRecord = {
            messageId: `sofia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: {
              triplets: sofiaResult.triplets,
              intention: `Analyzed: ${titleMatch?.[1]?.trim() || urlMatch?.[1]?.trim() || 'page'}`
            },
            timestamp: Date.now(),
            type: 'parsed_message'
          }
          await sofiaDB.put(STORES.ELIZA_DATA, sofiaRecord)
          console.log("✅ [SofIA] Triplets stored in IndexedDB:", { id: sofiaRecord.messageId, count: sofiaResult.triplets.length })

          // Notify UI that new echoes are available
          try {
            chrome.runtime.sendMessage({ type: "ECHOES_UPDATED" })
          } catch (e) {
            console.warn("⚠️ [SofIA] Could not notify UI:", e)
          }
        }

        return sofiaResult
      } catch (sofiaError) {
        console.error("❌ [SOFIA] Failed to process:", sofiaError)
        return null
      }

    case 'THEMEEXTRACTOR':
      // ThemeExtractor uses Mastra HTTP
      console.log(`🎨 [THEMEEXTRACTOR] Sending to Mastra`)
      // Extract URLs from the text
      const urls = text.split('\n').filter(line => line.startsWith('http'))
      try {
        const themeResult = await sendThemeExtractionToMastra(urls)

        // Store ThemeExtractor triplets in IndexedDB
        if (themeResult && themeResult.length > 0) {
          const themeRecord = {
            messageId: `theme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: {
              triplets: themeResult,
              intention: `Extracted from ${urls.length} URLs`
            },
            timestamp: Date.now(),
            type: 'parsed_message'
          }
          await sofiaDB.put(STORES.ELIZA_DATA, themeRecord)
          console.log("✅ [ThemeExtractor] Triplets stored in IndexedDB:", { id: themeRecord.messageId, count: themeResult.length })

          // Notify UI that new echoes are available
          try {
            chrome.runtime.sendMessage({ type: "ECHOES_UPDATED" })
          } catch (e) {
            console.warn("⚠️ [ThemeExtractor] Could not notify UI:", e)
          }
        }

        return themeResult
      } catch (themeError) {
        console.error("❌ [THEMEEXTRACTOR] Failed to process:", themeError)
        return []
      }

    case 'PULSEAGENT':
      // PulseAgent uses Mastra HTTP
      console.log(`🫀 [PULSEAGENT] Sending to Mastra`)
      try {
        const tabs = JSON.parse(text)
        const result = await sendPulseToMastra(tabs)

        // Store pulse analysis and notify UI
        // Wrap themes in expected format for PulseTab parsing
        const themesData = Array.isArray(result) ? { themes: result } : result
        const pulseRecord = {
          messageId: `pulse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: { text: JSON.stringify(themesData) },
          timestamp: Date.now(),
          type: 'pulse_analysis'
        }
        await sofiaDB.put(STORES.ELIZA_DATA, pulseRecord)
        console.log("✅ [PulseAgent] Pulse analysis stored:", { themes: themesData.themes?.length || 0 })

        try {
          chrome.runtime.sendMessage({ type: "PULSE_ANALYSIS_COMPLETE" })
        } catch (e) {
          console.warn("⚠️ [PulseAgent] Could not notify UI:", e)
        }

        return result
      } catch (e) {
        console.error("❌ [PULSEAGENT] Failed to parse tabs:", e)
        return await sendPulseToMastra([])
      }

    case 'RECOMMENDATION':
      // Recommendation uses Mastra HTTP
      console.log(`💎 [RECOMMENDATION] Sending to Mastra`)
      try {
        const walletData = JSON.parse(text)
        return await sendRecommendationToMastra(walletData)
      } catch (e) {
        console.error("❌ [RECOMMENDATION] Failed to parse wallet data:", e)
        return await sendRecommendationToMastra({})
      }

    default:
      throw new Error(`Unknown agent type: ${agentType}`)
  }
}

// === DEPRECATED: These functions are kept for backwards compatibility but are no longer used ===
// The 4 agent sockets (SofIA, ThemeExtractor, Pulse, Recommendation) have been replaced by Mastra HTTP

export async function initializeSofiaSocket(): Promise<void> {
  console.log("⚠️ [DEPRECATED] initializeSofiaSocket - SofIA now uses Mastra HTTP")
}

export async function initializeThemeExtractorSocket(): Promise<void> {
  console.log("⚠️ [DEPRECATED] initializeThemeExtractorSocket - ThemeExtractor now uses Mastra HTTP")
}

export async function initializePulseSocket(): Promise<void> {
  console.log("⚠️ [DEPRECATED] initializePulseSocket - PulseAgent now uses Mastra HTTP")
}

export async function initializeRecommendationSocket(): Promise<void> {
  console.log("⚠️ [DEPRECATED] initializeRecommendationSocket - RecommendationAgent now uses Mastra HTTP")
}

// Deprecated socket getters (return undefined)
export function getSofiaSocket(): Socket | undefined { return undefined }
export function getThemeExtractorSocket(): Socket | undefined { return undefined }
export function getPulseSocket(): Socket | undefined { return undefined }
export function getRecommendationSocket(): Socket | undefined { return undefined }
export function getElizaRoomIds() { return {} }
