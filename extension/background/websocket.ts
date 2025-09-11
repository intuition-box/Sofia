import { io, Socket } from "socket.io-client"
import { SOFIA_IDS, CHATBOT_IDS, BOOKMARKAGENT_IDS } from "./constants"
import { elizaDataService } from "../lib/database/indexedDB-methods"
import { 
  sendMessageToSofia, 
  sendMessageToChatbot, 
  sendBookmarksToAgent as sendBookmarksToAgentSender,
  unlockBookmarkResponse,
  getAllBookmarks as getAllBookmarksFromSender,
  extractBookmarkUrls
} from "./messageSenders"

let socketSofia: Socket
let socketBot: Socket
let socketBookmarkAgent: Socket


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


// === 3. Send message to SofIA ===
export function sendMessageToSofiaSocket(text: string): void {
  sendMessageToSofia(socketSofia, text)
}

// === 4. Send message to Chatbot ===
export function sendMessageToChatbotSocket(text: string): void {
  sendMessageToChatbot(socketBot, text)
}

// === 5. Initialiser WebSocket pour BookMarkAgent ===
export async function initializeBookmarkAgentSocket(): Promise<void> {
  console.log("📚 [websocket.ts] Initializing BookMarkAgent socket...")
  
  socketBookmarkAgent = io("http://localhost:3000", {
    transports: ["websocket"],
    path: "/socket.io",
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000
  })

  socketBookmarkAgent.on("connect", () => {
    console.log("✅ [websocket.ts] Connected to BookMarkAgent, socket ID:", socketBookmarkAgent.id)

    const joinMessage = {
      type: 1,
      payload: {
        roomId: BOOKMARKAGENT_IDS.ROOM_ID,
        entityId: BOOKMARKAGENT_IDS.AUTHOR_ID
      }
    }
    
    console.log("📨 [websocket.ts] Sending room join for BookMarkAgent:", joinMessage)
    socketBookmarkAgent.emit("message", joinMessage)
    console.log("✅ [websocket.ts] Room join sent for BookMarkAgent")
  })

  socketBookmarkAgent.on("messageBroadcast", async (data) => {
    if ((data.roomId === BOOKMARKAGENT_IDS.ROOM_ID || data.channelId === BOOKMARKAGENT_IDS.CHANNEL_ID) && 
        data.senderId === BOOKMARKAGENT_IDS.AGENT_ID) {
      console.log("📩 BookMarkAgent response received")
      
      try {
        // Stocker directement dans IndexedDB comme les messages SofIA
        try {
          const newMessage = {
            id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: { text: data.text },
            created_at: Date.now(),
            processed: false
          }
          
          await elizaDataService.storeMessage(newMessage, newMessage.id)
        } catch (error) {
          console.error("❌ [websocket.ts] Failed to store BookMarkAgent response:", error)
        }
        
        // Unlock for next batch
        unlockBookmarkResponse()
        
      } catch (error) {
        console.error("❌ [websocket.ts] Failed to process BookMarkAgent response:", error)
        // Unlock anyway in case of error
        unlockBookmarkResponse()
      }

    }
  })

  socketBookmarkAgent.on("connect_error", (error) => {
    console.error("❌ [websocket.ts] BookMarkAgent connection error:", error)
  })

  socketBookmarkAgent.on("disconnect", (reason) => {
    console.warn("🔌 [websocket.ts] BookMarkAgent socket disconnected:", reason)
    setTimeout(() => {
      console.log("🔄 [websocket.ts] Attempting to reconnect BookMarkAgent...")
      initializeBookmarkAgentSocket()
    }, 5000)
  })
  
  console.log("📚 [websocket.ts] BookMarkAgent socket initialization completed")
}

// === 6. Send bookmarks to BookMarkAgent ===
export async function sendBookmarksToAgent(urls: string[]): Promise<{success: boolean, successfulBatches: number, failedBatches: number, totalBatches: number, count: number, message: string}> {
  return await sendBookmarksToAgentSender(socketBookmarkAgent, urls)
}

// === 7. Bookmark utility functions (delegation) ===
export function getAllBookmarks(): Promise<{ success: boolean; urls?: string[]; error?: string }> {
  return getAllBookmarksFromSender()
}
