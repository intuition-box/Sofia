/**
 * Agent Router - Routes messages to Mastra agents via HTTP
 * All agents (SofIA, ThemeExtractor, Pulse, Recommendation, ChatBot) use Mastra HTTP
 */

import { sofiaDB, STORES } from "../lib/database/indexedDB"
import {
  sendThemeExtractionToMastra,
  sendPulseToMastra,
  sendRecommendationToMastra,
  sendChatbotToMastra
} from "./mastraClient"
import { createServiceLogger } from '../lib/utils/logger'

const logger = createServiceLogger('AgentRouter')

/**
 * Send theme extraction request to Mastra ThemeExtractor agent
 * @param urls - Array of URLs to analyze for themes
 * @returns Promise resolving to extracted themes
 */
export async function sendThemeExtractionRequest(urls: string[]): Promise<any[]> {
  logger.info(`[ThemeExtractor] Sending ${urls.length} URLs to Mastra`)

  try {
    const triplets = await sendThemeExtractionToMastra(urls)

    // Store triplets in IndexedDB for EchoesTab
    if (Array.isArray(triplets) && triplets.length > 0) {
      const enrichedTriplets = triplets.map((t: any) => ({
        subject: t.subject || "User",
        predicate: t.predicate,
        object: t.object,
        objectUrl: t.objectUrl || (t.urls && t.urls.length > 0 ? t.urls[0] : '')
      }))

      const parsedRecord = {
        messageId: `theme_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        content: {
          triplets: enrichedTriplets,
          intention: `Extracted from bookmarks`
        },
        timestamp: Date.now(),
        type: 'parsed_message'
      }

      await sofiaDB.put(STORES.TRIPLETS_DATA, parsedRecord)
      logger.info('[ThemeExtractor] Triplets stored in IndexedDB', { count: enrichedTriplets.length })

      try {
        chrome.runtime.sendMessage({ type: "ECHOES_UPDATED" })
      } catch (e) {
        logger.warn('[ThemeExtractor] Could not notify UI', e)
      }
    }

    return triplets
  } catch (error) {
    logger.error('[ThemeExtractor] Mastra request failed', error)
    return []
  }
}

/**
 * Send recommendation request to Mastra RecommendationAgent
 * @param walletData - Wallet data and user interests
 * @returns Promise resolving to recommendations
 */
export async function sendRecommendationRequest(walletData: any): Promise<any> {
  logger.info('[Recommendation] Sending request to Mastra')

  try {
    const recommendations = await sendRecommendationToMastra(walletData)
    logger.debug('[Recommendation] Received from Mastra', recommendations)
    return recommendations
  } catch (error) {
    logger.error('[Recommendation] Mastra request failed', error)
    return null
  }
}

/**
 * Send a message to a specific agent
 * All agents use Mastra HTTP
 * @param agentType - Which agent to send to
 * @param text - Message text to send
 */
export async function sendMessage(agentType: 'CHATBOT' | 'THEMEEXTRACTOR' | 'PULSEAGENT' | 'RECOMMENDATION', text: string): Promise<any> {
  switch (agentType) {
    case 'CHATBOT':
      // ChatBot uses Mastra HTTP with MCP tools
      logger.info('[CHATBOT] Sending to Mastra', { text: text.substring(0, 100) })

      try {
        const response = await sendChatbotToMastra(text)

        // Send response back to UI
        chrome.runtime.sendMessage({
          type: "CHATBOT_RESPONSE",
          text: response
        }).catch((error) => {
          logger.warn('[Chatbot] Error sending response', error)
        })

        return response
      } catch (error) {
        logger.error('[CHATBOT] Mastra request failed', error)
        // Send error to UI
        chrome.runtime.sendMessage({
          type: "CHATBOT_RESPONSE",
          text: "Sorry, I encountered an error. Please try again."
        }).catch(() => {})
        throw error
      }

    case 'THEMEEXTRACTOR':
      // ThemeExtractor uses Mastra HTTP
      logger.info('[THEMEEXTRACTOR] Sending to Mastra')
      // Extract URLs from the text
      const urls = text.split('\n').filter(line => line.startsWith('http'))
      try {
        const themeResult = await sendThemeExtractionToMastra(urls)

        // Store ThemeExtractor triplets in IndexedDB
        if (themeResult && themeResult.length > 0) {
          const themeRecord = {
            messageId: `theme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: {
              triplets: themeResult,
              intention: `Extracted from ${urls.length} URLs`
            },
            timestamp: Date.now(),
            type: 'parsed_message'
          }
          await sofiaDB.put(STORES.TRIPLETS_DATA, themeRecord)
          logger.info('[ThemeExtractor] Triplets stored in IndexedDB', { id: themeRecord.messageId, count: themeResult.length })

          // Notify UI that new echoes are available
          try {
            chrome.runtime.sendMessage({ type: "ECHOES_UPDATED" })
          } catch (e) {
            logger.warn('[ThemeExtractor] Could not notify UI', e)
          }
        }

        return themeResult
      } catch (themeError) {
        logger.error('[THEMEEXTRACTOR] Failed to process', themeError)
        return []
      }

    case 'PULSEAGENT':
      // PulseAgent uses Mastra HTTP
      logger.info('[PULSEAGENT] Sending to Mastra')
      try {
        const tabs = JSON.parse(text)
        const result = await sendPulseToMastra(tabs)

        // Store pulse analysis and notify UI
        // Wrap themes in expected format for PulseTab parsing
        const themesData = Array.isArray(result) ? { themes: result } : result
        const pulseRecord = {
          messageId: `pulse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: { text: JSON.stringify(themesData) },
          timestamp: Date.now(),
          type: 'pulse_analysis'
        }
        await sofiaDB.put(STORES.TRIPLETS_DATA, pulseRecord)
        logger.info('[PulseAgent] Pulse analysis stored', { themes: themesData.themes?.length || 0 })

        try {
          chrome.runtime.sendMessage({ type: "PULSE_ANALYSIS_COMPLETE" })
        } catch (e) {
          logger.warn('[PulseAgent] Could not notify UI', e)
        }

        return result
      } catch (e) {
        logger.error('[PULSEAGENT] Failed to parse tabs', e)
        return await sendPulseToMastra([])
      }

    case 'RECOMMENDATION':
      // Recommendation uses Mastra HTTP
      logger.info('[RECOMMENDATION] Sending to Mastra')
      try {
        const walletData = JSON.parse(text)
        return await sendRecommendationToMastra(walletData)
      } catch (e) {
        logger.error('[RECOMMENDATION] Failed to parse wallet data', e)
        return await sendRecommendationToMastra({})
      }

    default:
      throw new Error(`Unknown agent type: ${agentType}`)
  }
}
