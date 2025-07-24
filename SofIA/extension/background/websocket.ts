import { io, Socket } from "socket.io-client"
import { SOFIA_IDS } from "./constants"

let socket: Socket
// initialisation 
export function initializeWebSocket(): void {
  function connectToElizaWebSocket() {
    socket = io("http://localhost:3000", {
      transports: ["websocket"],
      path: "/socket.io"
    })

    socket.on("connect", () => {
      console.log("✅ WebSocket connecté à ElizaOS")

      socket.emit("join", {
        roomId: SOFIA_IDS.CHANNEL_ID,
        agentId: SOFIA_IDS.AGENT_ID
      })
    })

   // Filtrer les réponses venant de l'agent 

    socket.on("messageBroadcast", (data) => {
      console.log(data)
    })

    //Message send 
    socket.on("messageComplete", (msg) => {
      console.log("✅ Message complete :", msg)
    })

    //Error
    socket.on("error", (error) => {
      console.error("❌ Erreur WebSocket :", error)
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


//Send message to agent 

export function sendAgentMessage(text: string): void {
  if (!socket?.connected) {
    console.warn("⚠️ Socket non connecté")
    return
  }

  const payload = {
    type: 2,
    payload: {
      senderId: SOFIA_IDS.AUTHOR_ID,
      senderName: "user",
      message: text,
      channelId: SOFIA_IDS.CHANNEL_ID,
      roomId: SOFIA_IDS.CHANNEL_ID,
      serverId: SOFIA_IDS.SERVER_ID,
      source: "client_chat"
    }
  }

  socket.emit("message", payload)
}
