import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serveur HTTP partagé pour Express + WebSocket
const server = createServer(app);
const wss = new WebSocketServer({ server });

let latestAgentMessage: any = null;

// Connexion au MessageBus de l'agent (via WebSocket) sur le port 3000
const agentWs = new WebSocket('ws://localhost:3000/message-bus'); // URL du WebSocket de l'agent

// Lors de la réception d'un message de l'agent via WebSocket (MessageBus)
agentWs.on('open', () => {
    console.log('✅ Connexion établie avec le MessageBus de l\'agent');
});

agentWs.on('message', (message) => {
    console.log('📩 Message reçu du MessageBus de l\'agent :', message);

    try {
        const parsedMessage = JSON.parse(message.toString());
        const agentResponse = parsedMessage?.raw_message?.text ?? 'Message sans texte';

        if (agentResponse === 'Message sans texte') {
            console.warn('⚠️ Aucune réponse texte dans le message de l\'agent');
        }

        // Sauvegarde de la réponse de l'agent pour l'envoyer plus tard si nécessaire
        latestAgentMessage = agentResponse;
        console.log('🧠 Message extrait de l\'agent :', agentResponse);

        // Diffusion du message à tous les clients connectés via WebSocket
        wss.clients.forEach((client: WebSocket) => {
            if (client.readyState === WebSocket.OPEN) {
                console.log('📤 Envoi de la réponse de l\'agent au client WebSocket');
                client.send(JSON.stringify({
                    type: 'agent_response',
                    message: agentResponse
                }));
            } else {
                console.warn('⚠️ WebSocket client déconnecté ou non prêt');
            }
        });
    } catch (err) {
        console.error('❌ Erreur lors du traitement du message de l\'agent :', err);
    }
});

// Endpoint pour relayer les messages vers l'agent
app.post('/relay', async (req, res) => {
    console.log("📥 Payload reçu :", JSON.stringify(req.body, null, 2));
    try {
        const response = await fetch('http://127.0.0.1:3000/api/messaging/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });
        const data = await response.json();
        console.log('✅ Message envoyé à l\'agent :', data);
        res.status(response.status).json(data);
    } catch (err) {
        console.error('❌ Proxy error:', err);
        res.status(500).json({ success: false, error: String(err) });
    }
});

// Endpoint pour recevoir la réponse de l’agent et la transmettre aux clients
app.post('/agent-response', (req, res) => {
    const agentMessage = req.body?.raw_message ?? { text: 'Réponse vide' };
    console.log('📥 Réponse brute de l\'agent reçue :', agentMessage);

    const formattedMessage = {
        type: 'agent_response',
        message: agentMessage.text,
        thought: req.body?.raw_message?.thought ?? 'No thought available',
        actions: req.body?.raw_message?.actions ?? []
    };

    // Diffusion du message aux clients connectés via WebSocket
    wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
            console.log('📤 Envoi de la réponse de l\'agent au WebSocket client');
            client.send(JSON.stringify(formattedMessage));
        } else {
            console.warn('⚠️ WebSocket client déconnecté ou non prêt');
        }
    });

    res.status(200).json({ success: true });
});

// Gérer les connexions WebSocket avec les extensions (clients)
wss.on('connection', (ws: WebSocket) => {
    console.log('🔌 WebSocket client connecté');
    
    if (latestAgentMessage) {
        console.log('📤 Envoi du dernier message de l\'agent au nouveau client WebSocket');
        ws.send(JSON.stringify({
            type: 'agent_response',
            message: latestAgentMessage
        }));
    }

    ws.on('close', () => console.log('❎ WebSocket client déconnecté'));
});

// Écoute sur le port 8080
server.listen(8080, () => {
    console.log('✅ Proxy + WebSocket actif → http://127.0.0.1:8080');
});
