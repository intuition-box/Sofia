import express from 'express';
import fetch from 'node-fetch';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
app.use(express.json());

// Serveur HTTP partagé pour Express + WebSocket
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Mémoire temporaire pour stocker le dernier message agent (optionnel)
let latestAgentMessage: any = null;

// ✅ Route standard : fait relais vers l'agent
app.post('/relay', async (req, res) => {
    try {
        const response = await fetch('http://127.0.0.1:3000/api/messaging/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('❌ Proxy error:', err);
        res.status(500).json({ success: false, error: err });
    }
});

// ✅ Route pour recevoir une réponse de l'agent
app.post('/agent-response', (req, res) => {
    latestAgentMessage = req.body?.message || 'Réponse agent reçue (vide)';
    console.log('📥 Réponse agent reçue :', latestAgentMessage);

    // Diffuse aux clients WebSocket
    wss.clients.forEach((client: WebSocket )=> {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify({ type: 'agent_response', message: latestAgentMessage }));
        }
    });

    res.status(200).json({ success: true });
});

// ✅ WebSocket : connexion
wss.on('connection', (ws: WebSocket) => {
    console.log('🔌 WebSocket connecté');

    // Si déjà un message agent connu, le renvoyer à la connexion
    if (latestAgentMessage) {
        ws.send(JSON.stringify({ type: 'agent_response', message: latestAgentMessage }));
    }

    ws.on('close', () => {
        console.log('❎ WebSocket déconnecté');
    });
});

server.listen(8080, () => {
    console.log('✅ Proxy + WebSocket actif → http://127.0.0.1:8080');
});
