import { io, Socket } from "socket.io-client"
import { SOFIA_IDS, CHATBOT_IDS, BOOKMARKAGENT_IDS, THEMEEXTRACTOR_IDS } from "./constants"
import { elizaDataService } from "../lib/database/indexedDB-methods"

// Function to convert themes directly to triplets
function convertThemesToTriplets(themes: any[]): any {
  const triplets = themes.map(theme => {
    // Use the predicate and object directly from theme (already in correct format)
    let predicate = theme.predicate
    let objectName = theme.object || theme.name // Use object field if available, fallback to name
    
    return {
      subject: {
        name: "User",
        description: "SofIA browser user", 
        url: "https://sofia.local/user"
      },
      predicate: {
        name: predicate,
        description: `${theme.category} relationship`
      },
      object: {
        name: objectName,
        description: `${theme.keywords?.join(', ') || theme.name}`,
        url: theme.urls?.[0] || ""
      }
    }
  })
  
  return { triplets }
}
import { 
  sendMessageToSofia, 
  sendMessageToChatbot, 
  sendBookmarksToAgent as sendBookmarksToAgentSender,
  sendBookmarksToThemeExtractor as sendBookmarksToThemeExtractorSender,
  unlockBookmarkResponse,
  handleThemeExtractorResponse,
  getAllBookmarks as getAllBookmarksFromSender,
  getAllHistory as getAllHistoryFromSender,
  extractBookmarkUrls
} from "./messageSenders"

let socketSofia: Socket
let socketBot: Socket
let socketBookmarkAgent: Socket
let socketThemeExtractor : Socket


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

// === 7. ThemeExtractor functions ===
export async function sendBookmarksToThemeExtractor(urls: string[]): Promise<{success: boolean, themes: any[], message: string}> {
  return await sendBookmarksToThemeExtractorSender(socketThemeExtractor, urls)
}

// === 8. Pipeline: ThemeExtractor → BookmarkAgent ===
export async function processBookmarksWithThemeAnalysis(urls: string[]): Promise<{success: boolean, message: string, themesExtracted: number, triplesProcessed: boolean}> {
  console.log('🔄 Starting bookmark processing pipeline:', urls.length, 'URLs')
  
  try {
    // Step 1: Extract themes from bookmarks
    console.log('🎨 Step 1: Extracting themes...')
    const themeResult = await sendBookmarksToThemeExtractorSender(socketThemeExtractor, urls)
    
    if (!themeResult.success) {
      return {
        success: false,
        message: `Theme extraction failed: ${themeResult.message}`,
        themesExtracted: 0,
        triplesProcessed: false
      }
    }

    console.log('✅ Themes extracted:', themeResult.themes.length)
    
    if (themeResult.themes.length === 0) {
      return {
        success: true,
        message: 'No themes extracted to process',
        themesExtracted: 0,
        triplesProcessed: false
      }
    }

    // Step 2: Convert themes directly to triplets (bypass BookmarkAgent)
    console.log('📚 Step 2: Converting themes directly to triplets...', themeResult.themes.length, 'themes')
    console.log('📚 Themes to convert:', themeResult.themes.map(t => `${t.name} (${t.predicate})`))
    
    const tripletData = convertThemesToTriplets(themeResult.themes)
    console.log('📚 Generated triplets:', tripletData.triplets.length)
    console.log('📚 First triplet example:', JSON.stringify(tripletData.triplets[0], null, 2))
    console.log('📚 Full triplet data structure:', JSON.stringify(tripletData, null, 2))
    
    // Step 3: Store triplets directly in IndexedDB
    try {
      const newMessage = {
        id: `themes_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: { text: JSON.stringify(tripletData) },
        created_at: Date.now(),
        processed: false
      }
      
      await elizaDataService.storeMessage(newMessage, newMessage.id)
      console.log('✅ Triplets stored in IndexedDB:', newMessage.id)
      
      return {
        success: true,
        message: `Pipeline completed: ${themeResult.themes.length} themes extracted, ${tripletData.triplets.length} triplets created and stored`,
        themesExtracted: themeResult.themes.length,
        triplesProcessed: true
      }
    } catch (error) {
      console.error('❌ Failed to store triplets:', error)
      return {
        success: false,
        message: `Pipeline failed: ${error.message}`,
        themesExtracted: themeResult.themes.length,
        triplesProcessed: false
      }
    }

  } catch (error) {
    console.error('❌ Pipeline processing failed:', error)
    return {
      success: false,
      message: `Pipeline failed: ${error.message}`,
      themesExtracted: 0,
      triplesProcessed: false
    }
  }
}

// === 9. Bookmark utility functions (delegation) ===
export function getAllBookmarks(): Promise<{ success: boolean; urls?: string[]; error?: string }> {
  return getAllBookmarksFromSender()
}

export function getAllHistory(): Promise<{ success: boolean; urls?: string[]; error?: string }> {
  return getAllHistoryFromSender()
}


// === 8. Initialiser WebSocket pour ThemeExtractor ===
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
      console.log("🔍 Message length:", data.text?.length, "characters")
      
      try {
        // Skip storing raw ThemeExtractor responses - we convert to triplets in pipeline
        
        // Parse themes from the response and handle them
        let themes = []
        try {
          // Parse the JSON response from ThemeExtractor
          const parsed = JSON.parse(data.text)
          themes = parsed.themes || [] // Extract the themes array from the response
          console.log("🎨 Parsed themes:", themes.length, "themes found")
        } catch (parseError) {
          console.warn("⚠️ Could not parse themes as JSON, treating as text:", data.text)
          themes = [{ name: "Miscellaneous", predicate: "visited", urls: [data.text] }] // Fallback format
        }
        
        // Directly process themes into triplets and store them
        if (themes.length > 0) {
          console.log('📚 Step 2: Converting themes directly to triplets...', themes.length, 'themes')
          console.log('📚 Themes to convert:', themes.map(t => `${t.name} (${t.predicate})`))
          
          const tripletData = convertThemesToTriplets(themes)
          console.log('📚 Generated triplets:', tripletData.triplets.length)
          console.log('📚 First triplet example:', JSON.stringify(tripletData.triplets[0], null, 2))
          
          // Store triplets in IndexedDB
          try {
            const newMessage = {
              id: `themes_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              content: { text: JSON.stringify(tripletData) },
              created_at: Date.now(),
              processed: false
            }
            
            await elizaDataService.storeMessage(newMessage, newMessage.id)
            console.log('✅ Triplets stored in IndexedDB:', newMessage.id)
          } catch (error) {
            console.error('❌ Failed to store triplets:', error)
          }
        } else {
          console.log('⚠️ No themes to convert to triplets')
        }

        // IMPORTANT: Resolve the Promise so next batch can be sent (but don't process again)
        handleThemeExtractorResponse([])
        
      } catch (error) {
        console.error("❌ [websocket.ts] Failed to process ThemeExtractor response:", error)
        handleThemeExtractorResponse([]) // Handle error case
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

