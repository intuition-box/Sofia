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
 * Call a Mastra workflow via HTTP REST API
 * @param workflowName - Name of the workflow (e.g., 'chatbotWorkflow')
 * @param inputData - Input data for the workflow
 * @returns Workflow result
 */
async function callMastraWorkflow(workflowName: string, inputData: Record<string, unknown>): Promise<any> {
  console.log(`📤 [Mastra] Calling workflow ${workflowName}`)

  // Step 1: Create a run
  const createResponse = await fetch(`${MASTRA_API_URL}/api/workflows/${workflowName}/create-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })

  if (!createResponse.ok) {
    const errorText = await createResponse.text()
    console.error(`❌ [Mastra] Workflow create-run error:`, createResponse.status, errorText)
    throw new Error(`Mastra workflow error: ${createResponse.status} - ${errorText}`)
  }

  const { runId } = await createResponse.json()
  console.log(`🔄 [Mastra] Workflow run created: ${runId}`)

  // Step 2: Start the run with input data (runId goes in query params)
  const startResponse = await fetch(`${MASTRA_API_URL}/api/workflows/${workflowName}/start?runId=${runId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputData })
  })

  if (!startResponse.ok) {
    const errorText = await startResponse.text()
    console.error(`❌ [Mastra] Workflow start error:`, startResponse.status, errorText)
    throw new Error(`Mastra workflow error: ${startResponse.status} - ${errorText}`)
  }

  const result = await startResponse.json()
  console.log(`✅ [Mastra] Workflow completed`)

  return result
}

/**
 * Send chatbot message to Mastra ChatBot workflow (with MCP tool support)
 * Uses start-async endpoint which waits for the workflow to complete
 * @param message - User's chat message
 * @returns Agent response text
 */
export async function sendChatbotToMastra(message: string): Promise<string> {
  console.log(`💬 [Mastra] Sending to ChatBot workflow: ${message.substring(0, 100)}`);

  try {
    // Use start-async which creates and runs the workflow synchronously
    const response = await fetch(`${MASTRA_API_URL}/api/workflows/chatbotWorkflow/start-async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputData: { message } })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Mastra] Workflow error:`, response.status, errorText);
      throw new Error(`Mastra workflow error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`📦 [Mastra] Workflow result:`, JSON.stringify(result).substring(0, 500));

    // Extract response from workflow result
    const chatResponse = result?.response
      || result?.result?.response
      || result?.['format-final-response']?.response
      || result?.steps?.['format-final-response']?.output?.response;

    if (chatResponse) {
      return chatResponse;
    }

    // Fallback to raw result
    return typeof result === 'string' ? result : JSON.stringify(result);
  } catch (error) {
    console.error(`❌ [Mastra] ChatBot workflow error:`, error);
    throw error;
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

  console.log(`🎯 [Mastra] Generating predicate for ${input.domain} (level ${input.level})`)

  try {
    const result = await callMastraAgent('predicateAgent', prompt)

    if (result && typeof result.predicate === 'string') {
      console.log(`✅ [Mastra] Generated predicate: "${result.predicate}" - ${result.reason}`)
      return {
        predicate: result.predicate,
        reason: result.reason || 'AI generated'
      }
    }

    // Fallback if response is malformed
    console.warn(`⚠️ [Mastra] Malformed predicate response, using fallback`)
    return {
      predicate: 'explore',
      reason: 'Fallback predicate'
    }
  } catch (error) {
    console.error(`❌ [Mastra] PredicateAgent error:`, error)
    // Return a safe fallback
    return {
      predicate: 'explore',
      reason: 'Error fallback'
    }
  }
}
