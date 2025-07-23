import { io, Socket } from "socket.io-client"
import { SOFIA_IDS } from "./constants"

let socket: Socket

export function initializeWebSocket(): void {
  function connectToElizaWebSocket() {
    socket = io("http://localhost:3000", {
      transports: ["websocket"],
      path: "/socket.io"
    })

    socket.on("connect", () => {
      console.log("✅ WebSocket connecté à ElizaOS")

      // ✅ Émet l'événement de connexion à la room
      socket.emit("join", {
        roomId: SOFIA_IDS.CHANNEL_ID,
        agentId: SOFIA_IDS.AGENT_ID
      })
    })

    socket.on("messageBroadcast", (msg) => {
      console.log("💬 Message broadcast reçu :", msg)
      import("~lib/MessageBus").then(({ messageBus }) => {
        messageBus.sendAgentResponse(msg.text)
      })
    })

    socket.on("messageComplete", (msg) => {
      console.log("✅ Message complete :", msg)
    })

    socket.on("error", (error) => {
      console.error("❌ Erreur WebSocket :", error)
    })

    socket.on("agent_response", (msg) => {
      console.log("💬 Réponse agent reçue (legacy) :", msg)
      import("~lib/MessageBus").then(({ messageBus }) => {
        messageBus.sendAgentResponse(msg.message)
      })
    })

    socket.on("disconnect", () => {
      console.warn("🔌 WebSocket ElizaOS déconnecté. Reconnexion dans 5s...")
      setTimeout(connectToElizaWebSocket, 5000)
    })

    socket.on("connect_error", (err) => {
      console.error("❌ Erreur de connexion WebSocket :", err)
    })
  }

  connectToElizaWebSocket()
}

export function sendAgentMessage(text: string): void {
  if (!socket?.connected) {
    console.warn("⚠️ Socket non connecté")
    return
  }

  const messagePayload = {
    text: text,
    roomId: SOFIA_IDS.CHANNEL_ID,
    userId: SOFIA_IDS.AUTHOR_ID,
    name: "user"
  }

  console.log("📤 Envoi du message:", messagePayload)
  socket.emit("message", messagePayload)
  console.debug("✅ Message envoyé:", text)
}

