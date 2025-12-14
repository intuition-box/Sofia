import { MASTRA_API_URL } from "../config"

/**
 * Call a Mastra agent via HTTP REST API
 * @param agentName - Name of the agent (e.g., 'sofiaAgent', 'themeExtractorAgent')
 * @param prompt - The prompt/message to send to the agent
 * @returns Parsed JSON response from the agent
 */
export async function callMastraAgent(agentName: string, prompt: string): Promise<any> {
  console.log(`📤 [Mastra] Calling ${agentName} with prompt:`, prompt.substring(0, 100))

  const response = await fetch(`${MASTRA_API_URL}/api/agents/${agentName}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`❌ [Mastra] Error from ${agentName}:`, response.status, errorText)
    throw new Error(`Mastra error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  console.log(`✅ [Mastra] Response from ${agentName}:`, result.text?.substring(0, 100))

  // Parse the JSON response from the agent
  try {
    return JSON.parse(result.text)
  } catch (parseError) {
    console.warn(`⚠️ [Mastra] Could not parse response as JSON, returning raw:`, result.text)
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

  console.log(`🎨 [Mastra] Sending ${urls.length} URLs to ThemeExtractor`)

  try {
    const result = await callMastraAgent('themeExtractorAgent', prompt)
    return result.triplets || result.themes || []
  } catch (error) {
    console.error(`❌ [Mastra] ThemeExtractor error:`, error)
    return []
  }
}

/**
 * Send pulse analysis request to Mastra PulseAgent
 * @param tabs - Array of tab data [{url, title, keywords, description}]
 * @returns Pulse analysis themes
 */
export async function sendPulseToMastra(tabs: any[]): Promise<any> {
  const prompt = JSON.stringify(tabs)

  console.log(`🫀 [Mastra] Sending ${tabs.length} tabs to PulseAgent`)

  try {
    const result = await callMastraAgent('pulseAgent', prompt)
    return result.themes || result
  } catch (error) {
    console.error(`❌ [Mastra] PulseAgent error:`, error)
    return { themes: [] }
  }
}

/**
 * Send recommendation request to Mastra RecommendationAgent
 * @param walletData - Wallet data and user interests
 * @returns Recommendations
 */
export async function sendRecommendationToMastra(walletData: any): Promise<any> {
  const prompt = `Wallet: ${walletData.address || 'unknown'}\nTotal activities: ${walletData.activities || 0}\n\nUser's interests based on blockchain activity:\n${JSON.stringify(walletData.interests || [])}`

  console.log(`💎 [Mastra] Sending recommendation request`)

  try {
    const result = await callMastraAgent('recommendationAgent', prompt)
    return result
  } catch (error) {
    console.error(`❌ [Mastra] RecommendationAgent error:`, error)
    return null
  }
}

/**
 * Send Sofia triplet request to Mastra SofiaAgent
 * @param url - URL to analyze
 * @param title - Page title
 * @param description - Page description
 * @param attentionScore - User attention score
 * @param visits - Number of visits
 * @returns Triplet data
 */
export async function sendSofiaToMastra(
  url: string,
  title: string,
  description: string,
  attentionScore: number,
  visits: number
): Promise<any> {
  const prompt = `URL: ${url}\nTitle: ${title}\nDescription: ${description}\nAttention Score: ${attentionScore}\nVisits: ${visits}`

  console.log(`🧠 [Mastra] Sending to SofiaAgent:`, url)

  try {
    const result = await callMastraAgent('sofiaAgent', prompt)
    return result
  } catch (error) {
    console.error(`❌ [Mastra] SofiaAgent error:`, error)
    return null
  }
}
