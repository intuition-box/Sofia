import { sendMessage } from "../agentRouter"


const sentMessages = new Set<string>()

export function sendToAgent(message: string): void {
  if (sentMessages.has(message)) return

  // ✅ Use new simplified sendMessage function
  sendMessage('SOFIA', message).catch(err => {
    console.error("❌ Failed to send message to SofIA:", err)
  })
  sentMessages.add(message)
}

export function clearOldSentMessages(): void {
  if (sentMessages.size > 100) {
    sentMessages.clear()
  }
}