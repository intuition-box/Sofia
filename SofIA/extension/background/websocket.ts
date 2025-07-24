import { io, Socket } from "socket.io-client"
import { SOFIA_IDS } from "./constants"

let socket: Socket

// Initialisation
export function initializeWebSocket(): void {
  function connectToElizaWebSocket() {
    socket = io("http://localhost:3000", {
      transports: ["websocket"],
      path: "/socket.io"
    })

    // socket.on("connect", () => {
    //   console.log("✅ WebSocket connecté à ElizaOS")
    // })

    // 2. Wait for connection
    socket.on("connection_established", (data) => {
      console.log("Connected:", data)

      // 3. Join a channel
      socket.emit("join", {
        roomId: SOFIA_IDS.CHANNEL_ID,
        agentId: SOFIA_IDS.AGENT_ID
      })

      socket.on("channel_joined", (data) => {
        console.log("Joined channel:", data)

        // Message send confirmation
        socket.on("messageComplete", (msg) => {
          console.log("✅ Message complete :", msg)
        })

        // 5. Send a message test (peut être retiré si inutile ici)
        socket.emit("message", {
          type: 2,
          payload: {
            senderId: SOFIA_IDS.AUTHOR_ID,
            senderName: "user",
            message: "HELLO",
            channelId: SOFIA_IDS.CHANNEL_ID,
            roomId: SOFIA_IDS.CHANNEL_ID,
            serverId: SOFIA_IDS.SERVER_ID,
            metadata: {
              channelType: "DM",
              isDm: true,
              targetUserId: "b850bc30-45f8-0041-a00a-83df46d8555d"
            }
          }
        })
      })
    })

    // 6. Listen for messages
    socket.on("messageBroadcast", (message) => {
      console.log("New message:", message)
    })

    // 7. Handle errors
    socket.on("messageError", (error) => {
      console.error("Message error:", error)
    })

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

// Send message to agent
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
      serverId: SOFIA_IDS.SERVER_ID
    }
  }

  socket.emit("message", payload)
}
