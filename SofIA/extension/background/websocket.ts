import { io, Socket } from "socket.io-client"
import { SOFIA_IDS, CHATBOT_IDS } from "./constants"
import { Storage } from "@plasmohq/storage"


let socketSofia: Socket
let socketBot: Socket

const storage = new Storage()

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

      let messages = await storage.get("sofiaMessages") || []
      if (!Array.isArray(messages)) messages = []

      const newMessage = {
        content: { text: data.text },
        created_at: Date.now()
      }

      messages.push(newMessage)
      await storage.set("sofiaMessages", messages)

      console.log("✅ Message enregistré (SofIA)", newMessage)
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
