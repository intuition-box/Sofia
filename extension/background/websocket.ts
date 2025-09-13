import { io, Socket } from "socket.io-client"
import { SOFIA_IDS, CHATBOT_IDS, THEMEEXTRACTOR_IDS } from "./constants"
import { elizaDataService } from "../lib/database/indexedDB-methods"
import { convertThemesToTriplets, processUrlsWithThemeAnalysis } from "./tripletProcessor"
import { 
  sendMessageToSofia, 
  sendMessageToChatbot, 
  sendBookmarksToThemeExtractor as sendBookmarksToThemeExtractorSender,
  sendHistoryToThemeExtractor as sendHistoryToThemeExtractorSender,
  handleThemeExtractorResponse,
  getAllBookmarks as getAllBookmarksFromSender,
  getAllHistory as getAllHistoryFromSender
} from "./messageSenders"

let socketSofia: Socket
let socketBot: Socket
let socketThemeExtractor: Socket

// Export sockets for direct access
export function getSofiaSocket(): Socket { return socketSofia }
export function getChatbotSocket(): Socket { return socketBot }
export function getThemeExtractorSocket(): Socket { return socketThemeExtractor }


// === 1. Initialiser WebSocket pour SofIA ===
export async function initializeSofiaSocket(): Promise<void> {
  socketSofia = io("http://localhost:3000", {
    transports: ["websocket"],
    path: "/socket.io",
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000
  })

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
  socketBot = io("http://localhost:3000", {
    transports: ["websocket"],
    path: "/socket.io"
  })

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
        chrome.runtime.sendMessage({
          type: "CHATBOT_RESPONSE",
          text: data.text
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn("⚠️ [websocket.ts] Failed to send CHATBOT_RESPONSE:", chrome.runtime.lastError.message)
          }
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




// === 3. Unified Pipeline: URLs → Themes → Triplets ===
export async function processBookmarksWithThemeAnalysis(urls: string[]): Promise<{success: boolean, message: string, themesExtracted: number, triplesProcessed: boolean}> {
  return await processUrlsWithThemeAnalysis(
    urls, 
    'bookmark', 
    (urls) => sendBookmarksToThemeExtractorSender(socketThemeExtractor, urls),
    'themes_',
    'Bookmark analysis completed'
  )
}

export async function processHistoryWithThemeAnalysis(urls: string[]): Promise<{success: boolean, message: string, themesExtracted: number, triplesProcessed: boolean}> {
  return await processUrlsWithThemeAnalysis(
    urls, 
    'history', 
    (urls) => sendHistoryToThemeExtractorSender(socketThemeExtractor, urls),
    'history_themes_',
    'History analysis completed'
  )
}



// === 9. Initialiser WebSocket pour ThemeExtractor ===
export async function initializeThemeExtractorSocket(): Promise<void> {
  console.log("🎨 [websocket.ts] Initializing ThemeExtractor socket...")
  
  socketThemeExtractor = io("http://localhost:3000", {
    transports: ["websocket"],
    path: "/socket.io",
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000
  })

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

