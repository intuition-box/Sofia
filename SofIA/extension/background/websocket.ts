import { io, Socket } from "socket.io-client"
import {SOFIA_IDS} from "./constants"

let socket: Socket

export function initializeWebSocket(): void {

  function connectToElizaWebSocket() {

    socket = io("http://localhost:3000",{
      transports : ["websocket"],
      path: "/socket.io"
    })
      socket.emit("join", {
      roomId: "c28a5ffd-32c3-4c6d-882c-b81006ed45ad",
      agentId: "ca67c98b-89c1-0b65-bb3e-1625531dc540"
    })
  

    socket.on("connect", () => {
      console.log("✅ WebSocket connecté aElizaOS")
    })

    socket.on("agent_response", (msg) => {
      console.log("💬 Réponse agent reçue :", msg)

      import("~lib/MessageBus").then(({ messageBus }) => {
        messageBus.sendAgentResponse(msg.message)
      })
    })

    socket.on("disconnect", () => {
      console.warn("🔌 WebSocket ElizaOS fermé. Reconnexion dans 5s...")
      setTimeout(connectToElizaWebSocket, 5000)
    })

    socket.on("connect_error", (err) => {
      console.error("❌ WebSocket ElizaOS erreur :", err)
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
    text, // string brut seulement
    roomId: SOFIA_IDS.CHANNEL_ID,
    userId: SOFIA_IDS.AUTHOR_ID,
    name: "user"
  }

  socket.emit("message", messagePayload)
  
  console.debug("✅ Message envoyé:", messagePayload)
}
