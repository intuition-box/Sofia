import { io, Socket } from "socket.io-client"
import {
  SOFIA_BASE_IDS,
  CHATBOT_BASE_IDS,
  THEMEEXTRACTOR_BASE_IDS,
  PULSEAGENT_BASE_IDS,
  RECOMMENDATION_BASE_IDS
} from "./constants"
import { getUserAgentIds, getWalletAddress, type AgentIds } from "../lib/services/UserSessionManager"
import { elizaDataService, agentChannelsService } from "../lib/database/indexedDB-methods"
import { sofiaDB, STORES } from "../lib/database/indexedDB"
import { SOFIA_SERVER_URL } from "../config"

/**
 * 🆕 Extract text from ElizaOS message with fallback chain
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
 * 🆕 Check if a messageBroadcast is from the expected agent in the expected channel
 * Handles both channelId and roomId (ElizaOS may send either)
 */
function isMessageFromAgent(data: any, agentIds: AgentIds): boolean {
  const channelMatch = (data.channelId === agentIds.CHANNEL_ID || data.roomId === agentIds.CHANNEL_ID)
  const isFromAgent = (data.senderId === agentIds.AGENT_ID)
  return channelMatch && isFromAgent
}

/**
 * 🆕 Unified function to handle messageBroadcast from agents
 * Used by all 5 agents to process incoming messages consistently
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

  // ✅ Vérifier si le message vient bien de l'agent dans le bon channel
  if (isMessageFromAgent(data, agentIds)) {
    console.log(`✅ [${agentName}] Agent response matched! Processing...`)

    try {
      const messageText = extractMessageText(data)
      console.log(`📝 [${agentName}] Raw message:`, messageText.substring(0, 100))

      // If custom handler provided, use it; otherwise use default storage
      if (customHandler) {
        await customHandler(messageText)
      } else {
        // Default: store message in IndexedDB
        const newMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: { text: messageText },
          created_at: Date.now(),
          processed: false
        }

        await elizaDataService.storeMessage(newMessage, newMessage.id)
        console.log(`✅ [${agentName}] Message stored in IndexedDB:`, { id: newMessage.id, preview: messageText.substring(0, 50) })

        // Clean old messages periodically (keep last 50)
        const allMessages = await elizaDataService.getAllMessages()
        if (allMessages.length > 50) {
          console.log(`🧹 [${agentName}] Cleaning old messages, keeping 50 most recent`)
          await elizaDataService.deleteOldMessages(30)
        }
      }

    } catch (error) {
      console.error(`❌ [${agentName}] Failed to process message:`, error)
    }
  } else {
    console.log(`⏭️ [${agentName}] Message not for us (from user or different channel)`)
  }
}

/**
 * 🆕 Unified function to handle channel retrieval/creation and ROOM_JOINING
 * Used by all 5 agents to ensure consistent behavior
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
      // ♻️ Reuse existing channel
      agentIds.ROOM_ID = storedChannelId
      agentIds.CHANNEL_ID = storedChannelId
      console.log(`♻️ [${agentName}] Reusing existing channel: ${storedChannelId}`)

      // 🔑 JOIN the existing room via Socket.IO to receive broadcasts
      socket.emit("message", {
        type: 1,  // ROOM_JOINING
        payload: {
          roomId: storedChannelId,
          entityId: agentIds.AUTHOR_ID,
          isDm: true  // 🔥 FIX: Mark as DM for proper channel handling
        }
      })
      console.log(`📨 [${agentName}] Sent ROOM_JOINING for existing channel: ${storedChannelId}`)

      if (onReady) onReady()
      return  // Don't create a new channel
    }

    // 🆕 No existing channel → create via REST API
    console.log(`🔧 [${agentName}] No existing channel, creating new one via REST API...`)
    const response = await fetch(`${SOFIA_SERVER_URL}/api/messaging/central-channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `DM-${agentName}-${Date.now()}`,
        type: "DM", // ChannelType.DM (string value for PostgreSQL)
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

      // Store the real channel ID returned by the API
      if (channelData.id) {
        agentIds.ROOM_ID = channelData.id
        agentIds.CHANNEL_ID = channelData.id
        console.log(`💾 [${agentName}] Updated ROOM_ID and CHANNEL_ID to use real channel ID: ${agentIds.ROOM_ID}`)

        // 🆕 Persist channel in IndexedDB
        await agentChannelsService.storeChannelId(walletAddress, agentName, channelData.id, agentIds.AGENT_ID)
        console.log(`💾 [${agentName}] Channel ID persisted to IndexedDB`)

        // ✅ Add agent explicitly to channel (following reference code pattern)
        console.log(`🔧 [${agentName}] Adding agent to channel explicitly...`)
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

        // 🔑 JOIN the newly created room via Socket.IO
        socket.emit("message", {
          type: 1,  // ROOM_JOINING
          payload: {
            roomId: channelData.id,
            entityId: agentIds.AUTHOR_ID,
            isDm: true  // 🔥 FIX: Mark as DM for proper channel handling
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
    console.error(`❌ [${agentName}] Error creating DM channel:`, error)
  }
}

let socketSofia: Socket
let socketBot: Socket
let socketThemeExtractor: Socket
let socketPulse: Socket
let socketRecommendation: Socket

// Cache des IDs utilisateur (généré une fois au démarrage)
let userAgentIds: {
  sofia: AgentIds
  chatbot: AgentIds
  themeExtractor: AgentIds
  pulse: AgentIds
  recommendation: AgentIds
} | null = null

// 🆕 Cache for ElizaOS-assigned room IDs (generated by Bootstrap for DMs)
let elizaRoomIds: {
  sofia?: string
  chatbot?: string
  themeExtractor?: string
  pulse?: string
  recommendation?: string
} = {}

/**
 * Initialize user agent IDs (called once at extension startup)
 */
export async function initializeUserAgentIds(): Promise<void> {
  userAgentIds = {
    sofia: await getUserAgentIds("SofIA", SOFIA_BASE_IDS.AGENT_ID),
    chatbot: await getUserAgentIds("ChatBot", CHATBOT_BASE_IDS.AGENT_ID),
    themeExtractor: await getUserAgentIds("ThemeExtractor", THEMEEXTRACTOR_BASE_IDS.AGENT_ID),
    pulse: await getUserAgentIds("PulseAgent", PULSEAGENT_BASE_IDS.AGENT_ID),
    recommendation: await getUserAgentIds("RecommendationAgent", RECOMMENDATION_BASE_IDS.AGENT_ID)
  }

  console.log("✅ User agent IDs initialized:", userAgentIds)
}

/**
 * Export pour utilisation dans d'autres fichiers
 */
export function getUserAgentIdsCache() {
  return userAgentIds
}

/**
 * Export ElizaOS-assigned room IDs for use in message senders
 */
export function getElizaRoomIds() {
  return elizaRoomIds
}

// Export sockets for direct access
export function getSofiaSocket(): Socket { return socketSofia }
export function getChatbotSocket(): Socket { return socketBot }
export function getThemeExtractorSocket(): Socket { return socketThemeExtractor }
export function getPulseSocket(): Socket { return socketPulse }
export function getRecommendationSocket(): Socket { return socketRecommendation }

// Common WebSocket configuration
const commonSocketConfig = {
  transports: ["websocket"],
  path: "/socket.io",
  reconnection: true,
  reconnectionDelay: 5000,        // 🔥 5 secondes au lieu de 1 (réduit les reconnections spam)
  reconnectionDelayMax: 30000,     // 🔥 Max 30 secondes entre reconnections
  reconnectionAttempts: Infinity,  // 🔥 Toujours essayer de reconnecter (mais avec délai long)
  timeout: 20000
}


// === 1. Initialiser WebSocket pour SofIA ===
export async function initializeSofiaSocket(): Promise<void> {
  // 🆕 S'assurer que les IDs sont initialisés
  if (!userAgentIds) {
    await initializeUserAgentIds()
  }

  const sofiaIds = userAgentIds!.sofia

  // 🔥 FIX: Prevent socket duplication - disconnect old socket if exists
  if (socketSofia?.connected) {
    console.log("⚠️ SofIA socket already connected, skipping re-initialization")
    return
  }
  if (socketSofia) {
    socketSofia.removeAllListeners()
    socketSofia.disconnect()
  }

  socketSofia = io(SOFIA_SERVER_URL, commonSocketConfig)

  socketSofia.on("connect", async () => {
    console.log("✅ Connected to Eliza (SofIA), socket ID:", socketSofia.id)
    console.log("🔑 Using user-specific IDs:", sofiaIds)

    // 🆕 Use unified channel setup function
    await setupAgentChannel(socketSofia, sofiaIds, "SofIA")
  })

  // 🆕 Use unified message handler
  socketSofia.on("messageBroadcast", async (data) => {
    await handleAgentMessage(data, sofiaIds, "SofIA")
  })

  socketSofia.on("disconnect", (reason) => {
    console.warn("🔌 SofIA socket disconnected:", reason)
    // 🔥 FIX: Don't manually reconnect - Socket.IO handles reconnection automatically
    // The reconnection config is already set in commonSocketConfig
  })
}

// === 2. Initialiser WebSocket pour Chatbot ===
export async function initializeChatbotSocket(onReady?: () => void): Promise<void> {
  // 🆕 S'assurer que les IDs sont initialisés
  if (!userAgentIds) {
    await initializeUserAgentIds()
  }

  const chatbotIds = userAgentIds!.chatbot

  // 🔥 FIX: Prevent socket duplication
  if (socketBot?.connected) {
    console.log("⚠️ Chatbot socket already connected, skipping re-initialization")
    // 🔥 FIX: Call callback even if socket already exists (for ChatPage.tsx)
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

    // 🆕 Use unified channel setup function
    await setupAgentChannel(socketBot, chatbotIds, "ChatBot", onReady)
  })

  // 🆕 Use unified message handler with custom handler for UI communication
  socketBot.on("messageBroadcast", async (data) => {
    await handleAgentMessage(data, chatbotIds, "ChatBot", async (messageText) => {
      // Custom handler: Send directly to UI via chrome.runtime.sendMessage
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
    // 🔥 FIX: Don't manually reconnect - Socket.IO handles it automatically
  })
}

// === 3. Direct theme analysis functions ===
// TODO: Re-implement these functions after refactoring
// export async function processBookmarksWithThemeAnalysis(urls: string[]): Promise<{success: boolean, message: string, themesExtracted: number, triplesProcessed: boolean}> {
//   return await processUrlsWithThemeAnalysis(
//     urls,
//     'bookmark',
//     (urls) => sendBookmarksToThemeExtractor(socketThemeExtractor, urls),
//     'Bookmark analysis completed'
//   )
// }

// export async function processHistoryWithThemeAnalysis(urls: string[]): Promise<{success: boolean, message: string, themesExtracted: number, triplesProcessed: boolean}> {
//   return await processUrlsWithThemeAnalysis(
//     urls,
//     'history',
//     (urls) => sendHistoryToThemeExtractor(socketThemeExtractor, urls),
//     'History analysis completed'
//   )
// }



// === 3. Initialiser WebSocket pour ThemeExtractor ===
export async function initializeThemeExtractorSocket(): Promise<void> {
  // 🆕 S'assurer que les IDs sont initialisés
  if (!userAgentIds) {
    await initializeUserAgentIds()
  }

  const themeExtractorIds = userAgentIds!.themeExtractor

  // 🔥 FIX: Prevent socket duplication
  if (socketThemeExtractor?.connected) {
    console.log("⚠️ ThemeExtractor socket already connected, skipping re-initialization")
    return
  }
  if (socketThemeExtractor) {
    socketThemeExtractor.removeAllListeners()
    socketThemeExtractor.disconnect()
  }

  socketThemeExtractor = io(SOFIA_SERVER_URL, commonSocketConfig)

  socketThemeExtractor.on("connect", async () => {
    console.log("✅ [websocket.ts] Connected to ThemeExtractor, socket ID:", socketThemeExtractor.id)
    console.log("🔑 Using user-specific IDs:", themeExtractorIds)

    // 🆕 Use unified channel setup function
    await setupAgentChannel(socketThemeExtractor, themeExtractorIds, "ThemeExtractor")
  })

  // 🆕 Use unified message handler with custom handler for theme parsing
  socketThemeExtractor.on("messageBroadcast", async (data) => {
    await handleAgentMessage(data, themeExtractorIds, "ThemeExtractor", async (messageText) => {
      // Custom handler: Parse themes from JSON response
      let themes = []
      try {
        const parsed = JSON.parse(messageText)
        themes = parsed
        console.log("🎨 [ThemeExtractor] Themes parsed successfully:", themes)
      } catch (parseError) {
        console.warn("⚠️ [ThemeExtractor] Could not parse themes as JSON:", parseError)
        themes = []
      }

      // Resolve the Promise so requester can continue
      handleThemeExtractorResponse(themes)
    })
  })

  socketThemeExtractor.on("connect_error", (error) => {
    console.error("❌ [websocket.ts] ThemeExtractor connection error:", error)
  })

  socketThemeExtractor.on("disconnect", (reason) => {
    console.warn("🔌 [websocket.ts] ThemeExtractor socket disconnected:", reason)
    // 🔥 FIX: Don't manually reconnect - Socket.IO handles it automatically
  })
  
  console.log("🎨 [websocket.ts] ThemeExtractor socket initialization completed")
}

// === 4. Initialiser WebSocket pour PulseAgent ===
export async function initializePulseSocket(): Promise<void> {
  // 🆕 S'assurer que les IDs sont initialisés
  if (!userAgentIds) {
    await initializeUserAgentIds()
  }

  const pulseIds = userAgentIds!.pulse

  // 🔥 FIX: Prevent socket duplication
  if (socketPulse?.connected) {
    console.log("⚠️ PulseAgent socket already connected, skipping re-initialization")
    return
  }
  if (socketPulse) {
    socketPulse.removeAllListeners()
    socketPulse.disconnect()
  }

  socketPulse = io(SOFIA_SERVER_URL, commonSocketConfig)

  socketPulse.on("connect", async () => {
    console.log("✅ [websocket.ts] Connected to PulseAgent, socket ID:", socketPulse.id)
    console.log("🔑 Using user-specific IDs:", pulseIds)

    // 🆕 Use unified channel setup function
    await setupAgentChannel(socketPulse, pulseIds, "PulseAgent")
  })

  // 🆕 Use unified message handler with custom handler for pulse analysis
  socketPulse.on("messageBroadcast", async (data) => {
    await handleAgentMessage(data, pulseIds, "PulseAgent", async (messageText) => {
      // Custom handler: Store pulse analysis and notify UI
      const pulseRecord = {
        messageId: `pulse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: { text: messageText },
        timestamp: Date.now(),
        type: 'pulse_analysis'
      }

      // Use sofiaDB directly to bypass elizaDataService parsing
      const result = await sofiaDB.put(STORES.ELIZA_DATA, pulseRecord)
      console.log("✅ [PulseAgent] Pulse analysis stored directly:", { id: result, type: pulseRecord.type })

      // Notify UI that pulse analysis is complete
      try {
        chrome.runtime.sendMessage({
          type: "PULSE_ANALYSIS_COMPLETE"
        })
        console.log("🫀 [PulseAgent] Sent PULSE_ANALYSIS_COMPLETE message")
      } catch (busError) {
        console.warn("⚠️ [PulseAgent] Failed to send PULSE_ANALYSIS_COMPLETE:", busError)
      }
    })
  })

  socketPulse.on("connect_error", (error) => {
    console.error("❌ [websocket.ts] PulseAgent connection error:", error)
  })

  socketPulse.on("disconnect", (reason) => {
    console.warn("🔌 [websocket.ts] PulseAgent socket disconnected:", reason)
    // 🔥 FIX: Don't manually reconnect - Socket.IO handles it automatically
  })

  console.log("🫀 [websocket.ts] PulseAgent socket initialization completed")
}

// === Global handlers for async responses ===
// Global handler for ThemeExtractor responses
let globalThemeExtractorHandler: ((themes: any[]) => void) | null = null

export function handleThemeExtractorResponse(themes: any[]): void {
  if (globalThemeExtractorHandler) {
    console.log("🎨 [websocket.ts] Processing theme extraction response")
    globalThemeExtractorHandler(themes)
    globalThemeExtractorHandler = null
  }
}

// Global handler for RecommendationAgent responses
let globalRecommendationHandler: ((recommendations: any) => void) | null = null

export function handleRecommendationResponse(rawData: any): void {
  if (globalRecommendationHandler) {
    console.log("💎 [websocket.ts] Processing recommendation response")
    globalRecommendationHandler(rawData)
    globalRecommendationHandler = null
  }
}

export async function initializeRecommendationSocket(): Promise<void> {
  // 🆕 S'assurer que les IDs sont initialisés
  if (!userAgentIds) {
    await initializeUserAgentIds()
  }

  const recommendationIds = userAgentIds!.recommendation

  // 🔥 FIX: Prevent socket duplication
  if (socketRecommendation?.connected) {
    console.log("⚠️ RecommendationAgent socket already connected, skipping re-initialization")
    return
  }
  if (socketRecommendation) {
    socketRecommendation.removeAllListeners()
    socketRecommendation.disconnect()
  }

  socketRecommendation = io(SOFIA_SERVER_URL, commonSocketConfig)

  socketRecommendation.on("connect", async () => {
    console.log("✅ [websocket.ts] Connected to RecommendationAgent, socket ID:", socketRecommendation.id)
    console.log("🔑 Using user-specific IDs:", recommendationIds)

    // 🆕 Use unified channel setup function
    await setupAgentChannel(socketRecommendation, recommendationIds, "RecommendationAgent")
  })

  // 🆕 Use unified message handler with custom handler for recommendations
  socketRecommendation.on("messageBroadcast", async (data) => {
    await handleAgentMessage(data, recommendationIds, "RecommendationAgent", async (messageText) => {
      // Custom handler: Parse recommendations and call global handler
      let recommendations = null
      try {
        const parsed = JSON.parse(messageText)
        recommendations = parsed
        console.log("💎 [RecommendationAgent] Recommendations parsed successfully:", recommendations)
      } catch (parseError) {
        console.warn("⚠️ [RecommendationAgent] Could not parse recommendations as JSON:", parseError)
        recommendations = null
      }

      // Resolve the Promise so requester can continue
      handleRecommendationResponse(recommendations)
    })
  })

  socketRecommendation.on("connect_error", (error) => {
    console.error("❌ [websocket.ts] RecommendationAgent connection error:", error)
  })

  socketRecommendation.on("disconnect", (reason) => {
    console.warn("🔌 [websocket.ts] RecommendationAgent socket disconnected:", reason)
    // 🔥 FIX: Don't manually reconnect - Socket.IO handles it automatically
  })

  console.log("💎 [websocket.ts] RecommendationAgent socket initialization completed")
}

// Helper function to send recommendation request and wait for response
export async function sendRecommendationRequest(walletData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for recommendations'))
    }, 60000) // 60 seconds timeout

    // Store resolver for when recommendations come back
    globalRecommendationHandler = (recommendations) => {
      clearTimeout(timeout)
      resolve(recommendations || null)
    }

    // Send the request
    // TODO: Re-implement recommendation request
    // const { sendRequestToRecommendation } = require('./messageSenders')
    // sendRequestToRecommendation(socketRecommendation, walletData)
    console.log("📤 [websocket.ts] Sent recommendation request for wallet:", walletData?.address)
  })
}

/**
 * Send theme extraction request to ThemeExtractor agent
 * @param urls - Array of URLs to analyze for themes
 * @returns Promise resolving to extracted themes
 */
export async function sendThemeExtractionRequest(urls: string[]): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.warn("⚠️ [ThemeExtractor] Request timeout after 10 minutes")
      globalThemeExtractorHandler = null
      resolve([]) // Return empty array on timeout
    }, 600000) // 10 minutes timeout (ThemeExtractor needs time to analyze many URLs)

    // Store resolver for when themes come back
    globalThemeExtractorHandler = (themes) => {
      clearTimeout(timeout)
      resolve(themes || [])
    }

    // Prepare message text with all URLs (no limit)
    const urlList = urls.join('\n')
    const messageText = `Extract themes from the following URLs:\n\n${urlList}\n\nProvide a JSON array of themes with their frequencies.`

    console.log(`📤 [ThemeExtractor] Sending ${urls.length} URLs for analysis`)

    // Send message to ThemeExtractor
    sendMessage('THEMEEXTRACTOR', messageText)
      .catch((error) => {
        console.error("❌ [ThemeExtractor] Failed to send request:", error)
        clearTimeout(timeout)
        globalThemeExtractorHandler = null
        reject(error)
      })
  })
}

/**
 * Send a message to a specific agent via Socket.IO
 * @param agentType - Which agent to send to ('SOFIA', 'CHATBOT', etc.)
 * @param text - Message text to send
 */
export async function sendMessage(agentType: 'SOFIA' | 'CHATBOT' | 'THEMEEXTRACTOR' | 'PULSEAGENT' | 'RECOMMENDATION', text: string): Promise<void> {
  // Ensure IDs are initialized
  if (!userAgentIds) {
    await initializeUserAgentIds()
  }

  // Get the correct socket and IDs based on agent type
  let socket: Socket
  let agentIds: AgentIds

  switch (agentType) {
    case 'SOFIA':
      socket = socketSofia
      agentIds = userAgentIds!.sofia
      break
    case 'CHATBOT':
      socket = socketBot
      agentIds = userAgentIds!.chatbot
      break
    case 'THEMEEXTRACTOR':
      socket = socketThemeExtractor
      agentIds = userAgentIds!.themeExtractor
      break
    case 'PULSEAGENT':
      socket = socketPulse
      agentIds = userAgentIds!.pulse
      break
    case 'RECOMMENDATION':
      socket = socketRecommendation
      agentIds = userAgentIds!.recommendation
      break
    default:
      throw new Error(`Unknown agent type: ${agentType}`)
  }

  if (!socket || !socket.connected) {
    throw new Error(`Socket for ${agentType} is not connected`)
  }

  console.log(`📤 [${agentType}] Sending message:`, text.substring(0, 100))
  console.log(`📤 [${agentType}] Complete IDs:`, {
    channelId: agentIds.CHANNEL_ID,
    serverId: agentIds.SERVER_ID,
    senderId: agentIds.AUTHOR_ID,
    agentId: agentIds.AGENT_ID
  })

  const payload = {
    type: 2,  // SEND_MESSAGE
    payload: {
      channelId: agentIds.CHANNEL_ID,   // Use CHANNEL_ID (not ROOM_ID)
      serverId: agentIds.SERVER_ID,     // Server ID
      senderId: agentIds.AUTHOR_ID,     // User's entity ID
      message: text,                     // Plain text message
      metadata: {
        source: "extension",
        timestamp: Date.now(),
        user_display_name: "User"         // Display name for user entity creation
        // Removed isDM and channelType to avoid DM onboarding issues
      }
    }
  }

  console.log(`📤 [${agentType}] Full payload:`, JSON.stringify(payload, null, 2))

  // Send message via Socket.IO (type 2 = SEND_MESSAGE)
  // Channel already created via REST API with proper participants
  socket.emit("message", payload)

  console.log(`✅ [${agentType}] Message sent via Socket.IO to channel ${agentIds.CHANNEL_ID}`)
}

