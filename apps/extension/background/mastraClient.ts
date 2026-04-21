import { MASTRA_API_URL } from "../config"
import { createServiceLogger } from '../lib/utils/logger'

const logger = createServiceLogger('MastraClient')

/**
 * Call a Mastra agent via HTTP REST API
 * @param agentName - Name of the agent (e.g., 'sofiaAgent', 'themeExtractorAgent')
 * @param prompt - The prompt/message to send to the agent
 * @returns Parsed JSON response from the agent
 */
export async function callMastraAgent(agentName: string, prompt: string): Promise<any> {
  logger.debug(`Calling ${agentName}`, { prompt: prompt.substring(0, 100) })

  const response = await fetch(`${MASTRA_API_URL}/api/agents/${agentName}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    logger.error(`Error from ${agentName}`, { status: response.status, errorText })
    throw new Error(`Mastra error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  logger.debug(`Response from ${agentName}`, { text: result.text?.substring(0, 100) })

  // Parse the JSON response from the agent
  try {
    return JSON.parse(result.text)
  } catch (parseError) {
    logger.warn('Could not parse response as JSON, returning raw', { text: result.text })
    return result.text
  }
}

/**
 * Send theme extraction request to Mastra ThemeExtractor agent
 * @param urls - Array of URLs to analyze
 * @returns Extracted triplets/themes
 */
export async function sendThemeExtractionToMastra(urls: string[]): Promise<any[]> {
  const urlList = urls.join('\n')
  const prompt = `Extract themes from the following URLs:\n\n${urlList}\n\nProvide a JSON array of triplets with their frequencies.`

  logger.info(`Sending ${urls.length} URLs to ThemeExtractor`)

  try {
    const result = await callMastraAgent('themeExtractorAgent', prompt)
    return result.triplets || result.themes || []
  } catch (error) {
    logger.error('ThemeExtractor error', error)
    return []
  }
}

/**
 * Send recommendation request to Mastra RecommendationAgent
 * @param walletData - Wallet data and user interests
 * @returns Recommendations
 */
export async function sendRecommendationToMastra(walletData: any): Promise<any> {
  const prompt = `Wallet: ${walletData.address || 'unknown'}\nTotal activities: ${walletData.activities || 0}\n\nUser's interests based on blockchain activity:\n${JSON.stringify(walletData.interests || [])}`

  logger.info('Sending recommendation request')

  try {
    const result = await callMastraAgent('recommendationAgent', prompt)
    return result
  } catch (error) {
    logger.error('RecommendationAgent error', error)
    return null
  }
}

/**
 * Send chatbot message to Mastra ChatBot workflow (with MCP tool support)
 * Uses start-async endpoint which waits for the workflow to complete
 * @param message - User's chat message
 * @returns Agent response text
 */
export async function sendChatbotToMastra(message: string): Promise<string> {
  logger.info('Sending to ChatBot workflow', { message: message.substring(0, 100) })

  try {
    const response = await fetch(`${MASTRA_API_URL}/api/workflows/chatbotWorkflow/start-async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputData: { message } })
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Workflow error', { status: response.status, errorText })
      throw new Error(`Mastra workflow error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    logger.debug('Workflow result', { result: JSON.stringify(result).substring(0, 500) })

    const chatResponse = result?.response
      || result?.result?.response
      || result?.['format-final-response']?.response
      || result?.steps?.['format-final-response']?.output?.response

    if (chatResponse) {
      return chatResponse
    }

    return typeof result === 'string' ? result : JSON.stringify(result)
  } catch (error) {
    logger.error('ChatBot workflow error', error)
    throw error
  }
}

/**
 * Input data for predicate generation
 */
export interface PredicateInput {
  domain: string
  title: string
  level: number
  certifications: Record<string, number>  // { work: 2, fun: 3, learning: 1, ... }
  previousPredicate?: string | null
}

/**
 * Output from predicate generation
 */
export interface PredicateOutput {
  predicate: string
  reason: string
}

/**
 * Generate a predicate for a group level-up using PredicateAgent
 * @param input - Group data including domain, level, and certifications
 * @returns Generated predicate (2-4 words) with reasoning
 */
export async function generatePredicate(input: PredicateInput): Promise<PredicateOutput> {
  const prompt = JSON.stringify({
    domain: input.domain,
    title: input.title,
    level: input.level,
    certifications: input.certifications,
    previousPredicate: input.previousPredicate
  })

  logger.info(`Generating predicate for ${input.domain} (level ${input.level})`)

  try {
    const result = await callMastraAgent('predicateAgent', prompt)

    if (result && typeof result.predicate === 'string') {
      logger.info(`Generated predicate: "${result.predicate}"`, { reason: result.reason })
      return {
        predicate: result.predicate,
        reason: result.reason || 'AI generated'
      }
    }

    // Fallback if response is malformed
    logger.warn('Malformed predicate response, using fallback')
    return {
      predicate: 'explore',
      reason: 'Fallback predicate'
    }
  } catch (error) {
    logger.error('PredicateAgent error', error)
    // Return a safe fallback
    return {
      predicate: 'explore',
      reason: 'Error fallback'
    }
  }
}
