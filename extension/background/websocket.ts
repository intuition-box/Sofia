import { io, Socket } from "socket.io-client"
import { SOFIA_IDS, CHATBOT_IDS, THEMEEXTRACTOR_IDS, PULSEAGENT_IDS, RECOMMENDATION_IDS } from "./constants"
import { elizaDataService } from "../lib/database/indexedDB-methods"
import { sofiaDB, STORES } from "../lib/database/indexedDB"
import { processUrlsWithThemeAnalysis } from "./tripletProcessor"
import { MessageBus } from "../lib/services/MessageBus"
import {
  sendBookmarksToThemeExtractor,
  sendHistoryToThemeExtractor,
  handleThemeExtractorResponse,
} from "./messageSenders"

let socketSofia: Socket
let socketBot: Socket
let socketThemeExtractor: Socket
let socketPulse: Socket
let socketRecommendation: Socket

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
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 20000
}


// === 1. Initialiser WebSocket pour SofIA ===
export async function initializeSofiaSocket(): Promise<void> {
  socketSofia = io("http://localhost:3000", commonSocketConfig)

  socketSofia.on("connect", () => {
    console.log("✅ Connected to Eliza (SofIA), socket ID:", socketSofia.id)

    socketSofia.emit("message", {
      type: 1,
      payload: {
        roomId: SOFIA_IDS.ROOM_ID,
        entityId: SOFIA_IDS.AUTHOR_ID
      }
    })

    console.log("📨 Sent room join for SofIA:", SOFIA_IDS.ROOM_ID)
  })

  socketSofia.on("messageBroadcast", async (data) => {
    if ((data.roomId === SOFIA_IDS.ROOM_ID || data.channelId === SOFIA_IDS.CHANNEL_ID) && data.senderId === SOFIA_IDS.AGENT_ID) {
      console.log("📩 Message SofIA:", data)

      try {
        // Create message in the exact same format as before
        const newMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: { text: data.text },
          created_at: Date.now(),
          processed: false
        }

        // Store directly in IndexedDB instead of buffer
        await elizaDataService.storeMessage(newMessage, newMessage.id)
        console.log("✅ Message stored directly in IndexedDB (SofIA)", { id: newMessage.id })

        // Clean old messages periodically (keep last 50)
        const allMessages = await elizaDataService.getAllMessages()
        if (allMessages.length > 50) {
          console.log("🧹 Cleaning old messages, keeping 50 most recent")
          await elizaDataService.deleteOldMessages(30) // Keep last 30 days
        }

      } catch (error) {
        console.error("❌ Failed to store message in IndexedDB:", error)
      }
    }
  })

  socketSofia.on("disconnect", (reason) => {
    console.warn("🔌 SofIA socket disconnected:", reason)
    setTimeout(initializeSofiaSocket, 5000)
  })
}

// === 2. Initialiser WebSocket pour Chatbot ===
export async function initializeChatbotSocket(onReady?: () => void): Promise<void> {
  socketBot = io("http://localhost:3000", commonSocketConfig)

  socketBot.on("connect", () => {
    console.log("🤖 Connected to Chatbot, socket ID:", socketBot.id)

    // Send "room join"
    socketBot.emit("message", {
      type: 1,
      payload: {
        roomId: CHATBOT_IDS.ROOM_ID,
        entityId: CHATBOT_IDS.AUTHOR_ID
      }
    })

    console.log("📨 Sent room join for Chatbot:", CHATBOT_IDS.ROOM_ID)

    // ✅ Notification that socket is ready
    if (typeof onReady === "function") {
      onReady()
    }
  })

  socketBot.on("messageBroadcast", (data) => {
    if (
      (data.roomId === CHATBOT_IDS.ROOM_ID || data.channelId === CHATBOT_IDS.CHANNEL_ID) &&
      data.senderId === CHATBOT_IDS.AGENT_ID
    ) {
      try {
        MessageBus.getInstance().sendMessageFireAndForget({
          type: "CHATBOT_RESPONSE",
          text: data.text
        })
      } catch (error) {
        console.warn("⚠️ [websocket.ts] Error sending CHATBOT_RESPONSE:", error)
      }
    }
  })

  socketBot.on("disconnect", (reason) => {
    console.warn("🔌 Chatbot socket disconnected:", reason)
    setTimeout(() => initializeChatbotSocket(onReady), 5000) // Reconnection with same callback
  })
}

// === 3. Direct theme analysis functions ===
export async function processBookmarksWithThemeAnalysis(urls: string[]): Promise<{success: boolean, message: string, themesExtracted: number, triplesProcessed: boolean}> {
  return await processUrlsWithThemeAnalysis(
    urls, 
    'bookmark', 
    (urls) => sendBookmarksToThemeExtractor(socketThemeExtractor, urls),
    'Bookmark analysis completed'
  )
}

export async function processHistoryWithThemeAnalysis(urls: string[]): Promise<{success: boolean, message: string, themesExtracted: number, triplesProcessed: boolean}> {
  return await processUrlsWithThemeAnalysis(
    urls, 
    'history', 
    (urls) => sendHistoryToThemeExtractor(socketThemeExtractor, urls),
    'History analysis completed'
  )
}



// === 3. Initialiser WebSocket pour ThemeExtractor ===
export async function initializeThemeExtractorSocket(): Promise<void> {
  socketThemeExtractor = io("http://localhost:3000", commonSocketConfig)

  socketThemeExtractor.on("connect", () => {
    console.log("✅ [websocket.ts] Connected to ThemeExtractor, socket ID:", socketThemeExtractor.id)

    const joinMessage = {
      type: 1,
      payload: {
        roomId: THEMEEXTRACTOR_IDS.ROOM_ID,
        entityId: THEMEEXTRACTOR_IDS.AUTHOR_ID
      }
    }
    
    console.log("📨 [websocket.ts] Sending room join for ThemeExtractor:", joinMessage)
    socketThemeExtractor.emit("message", joinMessage)
    console.log("✅ [websocket.ts] Room join sent for ThemeExtractor")
  })

  socketThemeExtractor.on("messageBroadcast", async (data) => {
    if ((data.roomId === THEMEEXTRACTOR_IDS.ROOM_ID || data.channelId === THEMEEXTRACTOR_IDS.CHANNEL_ID) && 
        data.senderId === THEMEEXTRACTOR_IDS.AGENT_ID) {
      console.log("📩 ThemeExtractor response received")
      console.log("🔍 RAW MESSAGE from ThemeExtractor:", data.text)
      
      try {
        // Parse themes from the response and pass to handler
        let themes = []
        try {
          const parsed = JSON.parse(data.text)
          themes = parsed // Pass raw parsed data to handler
          console.log("🎨 Raw parsed data sent to handler")
        } catch (parseError) {
          console.warn("⚠️ Could not parse themes as JSON:", parseError)
          themes = []
        }
        
        // Resolve the Promise so next batch can be sent
        handleThemeExtractorResponse(themes)
        
      } catch (error) {
        console.error("❌ [websocket.ts] Failed to process ThemeExtractor response:", error)
        handleThemeExtractorResponse([])
      }
    }
  })

  socketThemeExtractor.on("connect_error", (error) => {
    console.error("❌ [websocket.ts] ThemeExtractor connection error:", error)
  })

  socketThemeExtractor.on("disconnect", (reason) => {
    console.warn("🔌 [websocket.ts] ThemeExtractor socket disconnected:", reason)
    setTimeout(() => {
      console.log("🔄 [websocket.ts] Attempting to reconnect ThemeExtractor...")
      initializeThemeExtractorSocket()
    }, 5000)
  })
  
  console.log("🎨 [websocket.ts] ThemeExtractor socket initialization completed")
}

// === 4. Initialiser WebSocket pour PulseAgent ===
export async function initializePulseSocket(): Promise<void> {
  socketPulse = io("http://localhost:3000", commonSocketConfig)

  socketPulse.on("connect", () => {
    console.log("✅ [websocket.ts] Connected to PulseAgent, socket ID:", socketPulse.id)

    const joinMessage = {
      type: 1,
      payload: {
        roomId: PULSEAGENT_IDS.ROOM_ID,
        entityId: PULSEAGENT_IDS.AUTHOR_ID
      }
    }
    
    console.log("📨 [websocket.ts] Sending room join for PulseAgent:", joinMessage)
    socketPulse.emit("message", joinMessage)
    console.log("✅ [websocket.ts] Room join sent for PulseAgent")
  })

  socketPulse.on("messageBroadcast", async (data) => {
    if ((data.roomId === PULSEAGENT_IDS.ROOM_ID || data.channelId === PULSEAGENT_IDS.CHANNEL_ID) && 
        data.senderId === PULSEAGENT_IDS.AGENT_ID) {
      console.log("📩 PulseAgent response received")
      console.log("🫀 RAW MESSAGE from PulseAgent:", data.text)
      
      // Store pulse analysis results directly in IndexedDB
      try {
        const pulseRecord = {
          messageId: `pulse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: { text: data.text },
          timestamp: Date.now(),
          type: 'pulse_analysis'
        }

        // Use sofiaDB directly to bypass elizaDataService parsing
        const result = await sofiaDB.put(STORES.ELIZA_DATA, pulseRecord)
        console.log("✅ [websocket.ts] Pulse analysis stored directly:", { id: result, type: pulseRecord.type })
        
        // Notify UI that pulse analysis is complete
        try {
          chrome.runtime.sendMessage({
            type: "PULSE_ANALYSIS_COMPLETE"
          })
          console.log("🫀 [websocket.ts] Sent PULSE_ANALYSIS_COMPLETE message")
        } catch (busError) {
          console.warn("⚠️ [websocket.ts] Failed to send PULSE_ANALYSIS_COMPLETE:", busError)
        }
        
      } catch (error) {
        console.error("❌ [websocket.ts] Failed to store pulse analysis:", error)
      }
    }
  })

  socketPulse.on("connect_error", (error) => {
    console.error("❌ [websocket.ts] PulseAgent connection error:", error)
  })

  socketPulse.on("disconnect", (reason) => {
    console.warn("🔌 [websocket.ts] PulseAgent socket disconnected:", reason)
    setTimeout(() => {
      console.log("🔄 [websocket.ts] Attempting to reconnect PulseAgent...")
      initializePulseSocket()
    }, 5000)
  })

  console.log("🫀 [websocket.ts] PulseAgent socket initialization completed")
}

// === 5. Initialiser WebSocket pour RecommendationAgent ===
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
  socketRecommendation = io("http://localhost:3000", commonSocketConfig)

  socketRecommendation.on("connect", () => {
    console.log("✅ [websocket.ts] Connected to RecommendationAgent, socket ID:", socketRecommendation.id)

    const joinMessage = {
      type: 1,
      payload: {
        roomId: RECOMMENDATION_IDS.ROOM_ID,
        entityId: RECOMMENDATION_IDS.AUTHOR_ID
      }
    }

    console.log("📨 [websocket.ts] Sending room join for RecommendationAgent:", joinMessage)
    socketRecommendation.emit("message", joinMessage)
    console.log("✅ [websocket.ts] Room join sent for RecommendationAgent")
  })

  socketRecommendation.on("messageBroadcast", async (data) => {
    // DEBUG: Log ALL incoming messages
    console.log("🔍 [websocket.ts] RecommendationAgent messageBroadcast received:", {
      roomId: data.roomId,
      channelId: data.channelId,
      senderId: data.senderId,
      expectedRoomId: RECOMMENDATION_IDS.ROOM_ID,
      expectedChannelId: RECOMMENDATION_IDS.CHANNEL_ID,
      expectedAgentId: RECOMMENDATION_IDS.AGENT_ID,
      textPreview: data.text?.substring(0, 100)
    })

    if ((data.roomId === RECOMMENDATION_IDS.ROOM_ID || data.channelId === RECOMMENDATION_IDS.CHANNEL_ID) &&
        data.senderId === RECOMMENDATION_IDS.AGENT_ID) {
      console.log("📩 [websocket.ts] RecommendationAgent response received")
      console.log("💎 [websocket.ts] RAW MESSAGE from RecommendationAgent:", data.text)

      try {
        // Parse recommendations from the response
        let recommendations = null
        try {
          const parsed = JSON.parse(data.text)
          recommendations = parsed // Pass raw parsed data to handler
          console.log("💎 [websocket.ts] Parsed recommendations data:", recommendations)
        } catch (parseError) {
          console.warn("⚠️ [websocket.ts] Could not parse recommendations as JSON:", parseError)
          recommendations = null
        }

        // Resolve the Promise so requester can continue
        handleRecommendationResponse(recommendations)

      } catch (error) {
        console.error("❌ [websocket.ts] Failed to process RecommendationAgent response:", error)
        handleRecommendationResponse(null)
      }
    }
  })

  socketRecommendation.on("connect_error", (error) => {
    console.error("❌ [websocket.ts] RecommendationAgent connection error:", error)
  })

  socketRecommendation.on("disconnect", (reason) => {
    console.warn("🔌 [websocket.ts] RecommendationAgent socket disconnected:", reason)
    setTimeout(() => {
      console.log("🔄 [websocket.ts] Attempting to reconnect RecommendationAgent...")
      initializeRecommendationSocket()
    }, 5000)
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
    const { sendRequestToRecommendation } = require('./messageSenders')
    sendRequestToRecommendation(socketRecommendation, walletData)
    console.log("📤 [websocket.ts] Sent recommendation request for wallet:", walletData.address)
  })
}

