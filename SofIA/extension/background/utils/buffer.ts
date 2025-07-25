import { sendAgentMessage } from "../websocket"

const sentMessages = new Set<string>()

export function sendToAgent(message: string): void {
  if (sentMessages.has(message)) return

  sendAgentMessage(message) 
  sentMessages.add(message)
}

export function clearOldSentMessages(): void {
  if (sentMessages.size > 100) {
    sentMessages.clear()
  }
}