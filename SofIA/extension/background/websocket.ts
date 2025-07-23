let websocketConnection: WebSocket | null = null;

export function initializeWebSocket(): void {
  function connectToElizaWebSocket() {
    const socket = new WebSocket("ws://localhost:8080")
    websocketConnection = socket;

    socket.onopen = () => {
      console.log("✅ WebSocket connecté au proxy ElizaOS")
    }

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        if (msg.type === "agent_response") {
          console.log("💬 Réponse agent reçue :", msg.message)

          import("~lib/MessageBus").then(({ messageBus }) => {
            messageBus.sendAgentResponse(msg.message);
          });
        }
      } catch (err) {
        console.error("❌ Erreur de parsing WebSocket :", err)
      }
    }

    socket.onclose = () => {
      console.warn("🔌 WebSocket ElizaOS fermé. Reconnexion dans 5s...")
      websocketConnection = null;
      setTimeout(connectToElizaWebSocket, 5000)
    }

    socket.onerror = (err) => {
      console.error("❌ WebSocket ElizaOS erreur :", err)
    }
  }

  connectToElizaWebSocket()
}

export function sendViaWebSocket(payload: any): void {
  if (websocketConnection && websocketConnection.readyState === WebSocket.OPEN) {
    websocketConnection.send(JSON.stringify(payload));
    console.debug("✅ Message envoyé via WebSocket:", payload);
  } else {
    console.warn("⚠️ WebSocket non connecté, message ignoré:", payload);
  }
}
