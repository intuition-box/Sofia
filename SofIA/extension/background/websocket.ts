import { io, Socket } from "socket.io-client"
import { SOFIA_IDS } from "./constants"

let socket: Socket | null = null

export function initializeWebSocket(): void {
  if (socket && socket.connected) {
    console.log("🔁 Socket déjà connecté.")
    return
  }

  socket = io("http://localhost:3000", {
    transports: ["websocket"],
    upgrade: false
  })

  socket.on("connect", () => {
    console.log("✅ Socket connecté :", socket!.id)

    socket!.emit("join", {
      roomId: SOFIA_IDS.CHANNEL_ID,
      agentId: SOFIA_IDS.AGENT_ID,
    })
  })

  socket.on("messageBroadcast", (data) => {
    console.log("📩 Nouveau message eb :", data)
  })


  socket.on("disconnect", () => {
    console.warn("❌ Socket déconnecté")
    socket = null
  })

  socket.on("connect_error", (err) => {
    console.error("❌ Erreur de connexion :", err.message)
  })
}

export function sendMessageToAgent(text: string): void {
  if (!socket || !socket.connected) {
    console.warn("⚠️ Socket non connecté, message non envoyé.")
    return
  }

  const messagePayload = {
    type: 2, // SEND_MESSAGE
    payload: {
      channelId: SOFIA_IDS.CHANNEL_ID,
      serverId: SOFIA_IDS.SERVER_ID,
      senderId: SOFIA_IDS.AUTHOR_ID,
      message: text
    }
  }

  console.log("📨 Envoi via socket.io (SEND_MESSAGE):", messagePayload)
  socket.emit("message", messagePayload)
}
