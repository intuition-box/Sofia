import { buildAgentPayload } from "../agent";
import {sendAgentMessage} from "../websocket"

const sentMessages = new Set<string>();

// Fonction simplifiée pour envoyer directement à l'agent
export function sendToAgent(message: string): void {
  const trimmed = message.trim();
  if (!trimmed || sentMessages.has(trimmed)) return;
  
  const payload = buildAgentPayload(trimmed)
  sendAgentMessage(payload.content) // 👉 on n'envoie que le `content` (string)
  sentMessages.add(trimmed)
}

// Nettoyer les messages anciens pour éviter l'accumulation
export function clearOldSentMessages(): void {
  if (sentMessages.size > 100) {
    sentMessages.clear();
  }
}