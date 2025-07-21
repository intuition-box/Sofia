export function initializeWebSocket(): void {
  let socket: WebSocket | null = null;

  function connectToElizaWebSocket() {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      console.log('✅ WebSocket connecté au proxy ElizaOS');
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'agent_response') {
        console.log('💬 Réponse agent reçue :', msg.message);

        chrome.runtime.sendMessage({
          type: 'AGENT_RESPONSE',
          data: msg.message
        });
      }
    };

    socket.onclose = () => {
      console.warn('🔌 WebSocket ElizaOS fermé. Reconnexion dans 5s...');
      setTimeout(connectToElizaWebSocket, 5000);
    };

    socket.onerror = (err) => {
      console.error('❌ WebSocket ElizaOS erreur :', err);
    };
  }

  connectToElizaWebSocket();
}