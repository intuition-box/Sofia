/**
 * Agent Router — routes chatbot messages to Mastra via HTTP.
 * (ThemeExtractor + Recommendation flows removed when their callers went dead.)
 */

import { sendChatbotToMastra } from "./mastraClient"
import { createServiceLogger } from '../lib/utils/logger'

const logger = createServiceLogger('AgentRouter')

export async function sendMessage(agentType: 'CHATBOT', text: string): Promise<any> {
  if (agentType !== 'CHATBOT') {
    throw new Error(`Unknown agent type: ${agentType}`)
  }

  logger.info('[CHATBOT] Sending to Mastra', { text: text.substring(0, 100) })

  try {
    const response = await sendChatbotToMastra(text)

    chrome.runtime.sendMessage({
      type: "CHATBOT_RESPONSE",
      text: response
    }).catch((error) => {
      logger.warn('[Chatbot] Error sending response', error)
    })

    return response
  } catch (error) {
    logger.error('[CHATBOT] Mastra request failed', error)
    chrome.runtime.sendMessage({
      type: "CHATBOT_RESPONSE",
      text: "Sorry, I encountered an error. Please try again."
    }).catch(() => {})
    throw error
  }
}
