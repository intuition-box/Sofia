import { getSofiaSocket } from "../websocket"
import { sendMessageToSofia } from "../messageSenders"


const sentMessages = new Set<string>()

export function sendToAgent(message: string): void {
  if (sentMessages.has(message)) return

  sendMessageToSofia(getSofiaSocket(), message) 
  sentMessages.add(message)
}

export function clearOldSentMessages(): void {
  if (sentMessages.size > 100) {
    sentMessages.clear()
  }
}