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

    socket.on("agent_response", (msg) => {
      console.log("💬 Réponse agent reçue :", msg)
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

  socket.emit("message", {
  text: "Hello world",
  roomId: "df201162-5f77-450a-aced-84e060f400c3",
  userId: "ffbe5bee-a32c-4615-be7e-6a18cfd5703d",
  name: "user"
})

  console.debug("✅ Message envoyé:", text)
}

