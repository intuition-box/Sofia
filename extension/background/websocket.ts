import { io, Socket } from "socket.io-client"
import { SOFIA_IDS, CHATBOT_IDS, BOOKMARKAGENT_IDS } from "./constants"
import { elizaDataService } from "../lib/indexedDB-methods"

let socketSofia: Socket
let socketBot: Socket
let socketBookmarkAgent: Socket

function generateUUID(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
}

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

    // Envoie du "room join"
    socketBot.emit("message", {
      type: 1,
      payload: {
        roomId: CHATBOT_IDS.ROOM_ID,
        entityId: CHATBOT_IDS.AUTHOR_ID
      }
    })

    console.log("📨 Sent room join for Chatbot:", CHATBOT_IDS.ROOM_ID)

    // ✅ Notification que la socket est prête
    if (typeof onReady === "function") {
      onReady()
    }
  })

  socketBot.on("messageBroadcast", (data) => {
    if (
      (data.roomId === CHATBOT_IDS.ROOM_ID || data.channelId === CHATBOT_IDS.CHANNEL_ID) &&
      data.senderId === CHATBOT_IDS.AGENT_ID
    ) {
      chrome.runtime.sendMessage({
        type: "CHATBOT_RESPONSE",
        text: data.text
      })
    }
  })

  socketBot.on("disconnect", (reason) => {
    console.warn("🔌 Chatbot socket disconnected:", reason)
    setTimeout(() => initializeChatbotSocket(onReady), 5000) // Reconnexion avec le même callback
  })
}


// === 3. Envoi de message à SofIA ===
export function sendMessageToSofia(text: string): void {
  if (!socketSofia?.connected) {
    console.warn("⚠️ SofIA socket non connecté")
    return
  }

  const payload = {
    type: 2,
    payload: {
      senderId: SOFIA_IDS.AUTHOR_ID,
      senderName: "Extension User",
      message: text,
      messageId: generateUUID(),
      roomId: SOFIA_IDS.ROOM_ID,
      channelId: SOFIA_IDS.CHANNEL_ID,
      serverId: SOFIA_IDS.SERVER_ID,
      source: "extension",
      attachments: [],
      metadata: {
        channelType: "DM",
        isDm: true,
        targetUserId: SOFIA_IDS.AGENT_ID
      }
    }
  }

  console.log("📤 Message à SofIA :", payload)
  socketSofia.emit("message", payload)
}

// === 4. Envoi de message au Chatbot ===
export function sendMessageToChatbot(text: string): void {
  if (!socketBot?.connected) {
    console.warn("⚠️ Chatbot socket non connecté")
    return
  }

  const payload = {
    type: 2,
    payload: {
      senderId: CHATBOT_IDS.AUTHOR_ID,
      senderName: "Chat User",
      message: text,
      messageId: generateUUID(),
      roomId: CHATBOT_IDS.ROOM_ID,
      channelId: CHATBOT_IDS.CHANNEL_ID,
      serverId: CHATBOT_IDS.SERVER_ID,
      source: "Chat",
      attachments: [],
      metadata: {
        channelType: "DM",
        isDm: true,
        targetUserId: CHATBOT_IDS.AGENT_ID
      }
    }
  }

  console.log("📤 Message au Chatbot :", payload)
  socketBot.emit("message", payload)
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

  socketBookmarkAgent.on("messageBroadcast", (data) => {
    console.log("📩 [websocket.ts] Received messageBroadcast:", data)
    
    if ((data.roomId === BOOKMARKAGENT_IDS.ROOM_ID || data.channelId === BOOKMARKAGENT_IDS.CHANNEL_ID) && 
        data.senderId === BOOKMARKAGENT_IDS.AGENT_ID) {
      console.log("✅ [websocket.ts] Message is from BookMarkAgent, forwarding to extension")
      
      chrome.runtime.sendMessage({
        type: "BOOKMARK_AGENT_RESPONSE",
        text: data.text
      })
    } else {
      console.log("⏭️ [websocket.ts] Message not for BookMarkAgent, ignoring")
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

// === 6. Envoi de bookmarks au BookMarkAgent ===
export function sendBookmarksToAgent(urls: string[]): void {
  console.log('📚 [websocket.ts] sendBookmarksToAgent() called with', urls.length, 'URLs')
  
  console.log('📚 [websocket.ts] BookMarkAgent socket status:', {
    exists: !!socketBookmarkAgent,
    connected: socketBookmarkAgent?.connected,
    id: socketBookmarkAgent?.id
  })
  
  if (!socketBookmarkAgent) {
    console.error("❌ [websocket.ts] BookMarkAgent socket is null/undefined")
    return
  }
  
  if (!socketBookmarkAgent.connected) {
    console.error("❌ [websocket.ts] BookMarkAgent socket not connected")
    return
  }

  const message = `Import de ${urls.length} favoris:\n${urls.slice(0, 10).join('\n')}${urls.length > 10 ? '\n...' : ''}`
  console.log('📚 [websocket.ts] Constructed message for agent:', message.substring(0, 100) + '...')

  const payload = {
    type: 2,
    payload: {
      senderId: BOOKMARKAGENT_IDS.AUTHOR_ID,
      senderName: "Bookmark Importer",
      message,
      messageId: generateUUID(),
      roomId: BOOKMARKAGENT_IDS.ROOM_ID,
      channelId: BOOKMARKAGENT_IDS.CHANNEL_ID,
      serverId: BOOKMARKAGENT_IDS.SERVER_ID,
      source: "bookmark-extension",
      attachments: [],
      metadata: {
        channelType: "DM",
        isDm: true,
        targetUserId: BOOKMARKAGENT_IDS.AGENT_ID,
        bookmarkUrls: urls
      }
    }
  }

  console.log("📤 [websocket.ts] Sending payload to BookMarkAgent:", payload)
  socketBookmarkAgent.emit("message", payload)
  console.log("✅ [websocket.ts] Message emitted to BookMarkAgent")
}

// === 7. Fonctions utilitaires pour les bookmarks ===
export function extractBookmarkUrls(bookmarkNodes: chrome.bookmarks.BookmarkTreeNode[]): string[] {
  const urls: string[] = []
  
  function traverseBookmarks(nodes: chrome.bookmarks.BookmarkTreeNode[]) {
    for (const node of nodes) {
      if (node.url) {
        urls.push(node.url)
      }
      if (node.children) {
        traverseBookmarks(node.children)
      }
    }
  }
  
  traverseBookmarks(bookmarkNodes)
  return urls
}

export async function getAllBookmarks(): Promise<{ success: boolean; urls?: string[]; error?: string }> {
  console.log('📚 [websocket.ts] getAllBookmarks() called')
  try {
    console.log('📚 [websocket.ts] Calling chrome.bookmarks.getTree()...')
    const startTime = Date.now()
    const bookmarkTree = await chrome.bookmarks.getTree()
    const getTreeTime = Date.now() - startTime
    console.log(`📚 [websocket.ts] chrome.bookmarks.getTree() took ${getTreeTime}ms`)
    
    console.log('📚 [websocket.ts] Extracting URLs from bookmark tree...')
    const extractStartTime = Date.now()
    const urls = extractBookmarkUrls(bookmarkTree)
    const extractTime = Date.now() - extractStartTime
    console.log(`📚 [websocket.ts] Extracted ${urls.length} bookmarks in ${extractTime}ms`)
    
    return { success: true, urls }
  } catch (error) {
    console.error("❌ [websocket.ts] Failed to get bookmarks:", error)
    return { success: false, error: error.message }
  }
}
