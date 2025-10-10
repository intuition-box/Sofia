import { SOFIA_IDS, CHATBOT_IDS, THEMEEXTRACTOR_IDS, PULSEAGENT_IDS, EXCLUDED_URL_PATTERNS } from "./constants"
import { isSensitiveUrl } from "./utils/url"


function generateUUID(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
}

// === Send message to SofIA ===
export function sendMessageToSofia(socketSofia: any, text: string): void {
  if (!socketSofia?.connected) {
    console.warn("⚠️ SofIA socket not connected")
    return
  }

  const payload = {
    type: 2,
    payload: {
      senderId: SOFIA_IDS.AUTHOR_ID,
      senderName: "Extension User",
      message: text,
      messageId: generateUUID(),
      roomId: SOFIA_IDS.ROOM_ID,
      channelId: SOFIA_IDS.CHANNEL_ID,
      serverId: SOFIA_IDS.SERVER_ID,
      source: "extension",
      attachments: [],
      metadata: {
        channelType: "DM",
        isDm: true,
        targetUserId: SOFIA_IDS.AGENT_ID
      }
    }
  }

  console.log("📤 Message to SofIA:", payload)
  socketSofia.emit("message", payload)
}

// === Send message to Chatbot ===
export function sendMessageToChatbot(socketBot: any, text: string): void {
  if (!socketBot?.connected) {
    console.warn("⚠️ Chatbot socket not connected")
    return
  }

  const payload = {
    type: 2,
    payload: {
      senderId: CHATBOT_IDS.AUTHOR_ID,
      senderName: "Chat User",
      message: text,
      messageId: generateUUID(),
      roomId: CHATBOT_IDS.ROOM_ID,
      channelId: CHATBOT_IDS.CHANNEL_ID,
      serverId: CHATBOT_IDS.SERVER_ID,
      source: "Chat",
      attachments: [],
      metadata: {
        channelType: "DM",
        isDm: true,
        targetUserId: CHATBOT_IDS.AGENT_ID
      }
    }
  }

  console.log("📤 Message to Chatbot:", payload)
  socketBot.emit("message", payload)
}

// === Configuration ===
const THEME_EXTRACTOR_TIMEOUT = 600000 // 10 minutes


// Global handler for ThemeExtractor responses
let globalThemeExtractorHandler: ((themes: any) => void) | null = null


// === Function to handle ThemeExtractor response with themes data ===
export function handleThemeExtractorResponse(rawData: any): void {
  if (globalThemeExtractorHandler) {
    // Parse themes from agent response format [{"themes": [...]}]
    let themes = []
    if (Array.isArray(rawData) && rawData.length > 0 && rawData[0].themes) {
      themes = rawData[0].themes
    } else if (rawData?.themes) {
      themes = rawData.themes
    }
    
    console.log("🎨 Extracted themes:", themes.length, "themes found")
    globalThemeExtractorHandler(themes)
    globalThemeExtractorHandler = null
  }
}

// === Utility functions for bookmarks ===
function extractBookmarkUrls(bookmarkNodes: chrome.bookmarks.BookmarkTreeNode[]): string[] {
  const urls: string[] = []
  
  function traverseBookmarks(nodes: chrome.bookmarks.BookmarkTreeNode[]) {
    for (const node of nodes) {
      if (node.url) {
        urls.push(node.url)
      }
      if (node.children) {
        traverseBookmarks(node.children)
      }
    }
  }
  
  traverseBookmarks(bookmarkNodes)
  return urls
}

export async function sendHistoryToThemeExtractor(socketThemeExtractor: any, urls: string[]): Promise<{success: boolean, themes: any[], message: string}> {
  return processThemeExtraction(socketThemeExtractor, urls, 'history')
}

export async function getAllBookmarks(): Promise<{ success: boolean; urls?: string[]; error?: string }> {
  try {
    const bookmarkTree = await chrome.bookmarks.getTree()
    const urls = extractBookmarkUrls(bookmarkTree)
    console.log(`📚 Extracted ${urls.length} bookmarks`)
    
    return { success: true, urls }
  } catch (error) {
    console.error("❌ Failed to get bookmarks:", error)
    return { success: false, error: error.message }
  }
}

export async function getAllHistory(): Promise<{success: boolean, urls?: string[], error?: string}> {
  try {
    // Get last 300 history items (most recent visits)
    const historyItems = await chrome.history.search({
      text: '',
      maxResults: 300 // Just the 300 most recent visits
    })
    
    // Extract URLs and filter out sensitive ones
    
    const urls = historyItems
      .map(item => item.url)
      .filter((url): url is string => !!url && !isSensitiveUrl(url))
      .filter(url => !EXCLUDED_URL_PATTERNS.some(pattern => url.includes(pattern)))
    
    console.log('📚 Extracted', urls.length, 'history URLs')
    return { success: true, urls }
  } catch (error) {
    console.error('❌ Failed to get browsing history:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}


// === Unified Theme Extractor processor ===
class ThemeExtractorProcessor {
  private socket: any
  private isProcessing = false
  private type: string

  constructor(socket: any, type: 'bookmark' | 'history' = 'bookmark') {
    this.socket = socket
    this.type = type
  }

  async processUrlsForThemes(urls: string[]): Promise<{success: boolean, themes: any[], message: string}> {
    if (this.isProcessing) {
      throw new Error(`${this.type} ThemeExtractor processing already in progress`)
    }

    if (!this.socket?.connected) {
      throw new Error('ThemeExtractor socket not connected')
    }

    this.isProcessing = true
    console.log(`🎨 Starting ${this.type} theme extraction:`, urls.length, 'URLs')

    try {
      const themes = await this.sendForThemes(urls)
      console.log(`✅ ${this.type} theme extraction completed:`, themes.length, 'themes')
      
      return {
        success: true,
        themes,
        message: `Successfully extracted themes from ${urls.length} ${this.type} URLs`
      }

    } catch (error) {
      console.error(`❌ ${this.type} theme extraction failed:`, error)
      throw error
    } finally {
      this.isProcessing = false
    }
  }

  private async sendForThemes(urls: string[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for themes from ${this.type}`))
      }, THEME_EXTRACTOR_TIMEOUT)

      const payload = {
        type: 2,
        payload: {
          senderId: THEMEEXTRACTOR_IDS.AUTHOR_ID,
          senderName: "Extension",
          message: JSON.stringify({ urls }),
          messageId: generateUUID(),
          roomId: THEMEEXTRACTOR_IDS.ROOM_ID,
          channelId: THEMEEXTRACTOR_IDS.CHANNEL_ID,
          serverId: THEMEEXTRACTOR_IDS.SERVER_ID,
          source: "theme-extraction",
          attachments: [],
          metadata: {
            channelType: "DM",
            isDm: true,
            targetUserId: THEMEEXTRACTOR_IDS.AGENT_ID
          }
        }
      }

      // Store resolver for when themes come back (will be resolved in websocket handler)
      globalThemeExtractorHandler = (themes) => {
        clearTimeout(timeout)
        resolve(themes || [])
      }
      
      this.socket.emit("message", payload)
      console.log(`📤 Sent ${this.type} request with ${urls.length} URLs`)
    })
  }

}


// Generic theme extractor function
async function processThemeExtraction(socketThemeExtractor: any, urls: string[], type: 'bookmark' | 'history'): Promise<{success: boolean, themes: any[], message: string}> {
  if (!socketThemeExtractor) {
    console.error("❌ ThemeExtractor socket is null/undefined")
    return { 
      success: false, 
      themes: [],
      message: 'ThemeExtractor not available'
    }
  }

  const processor = new ThemeExtractorProcessor(socketThemeExtractor, type)
  
  try {
    const result = await processor.processUrlsForThemes(urls)
    console.log(`🎨 ${type} theme extraction completed:`, result.themes.length, 'themes found')
    return result
  } catch (error) {
    console.error(`❌ ${type} theme extraction failed:`, error)
    return { 
      success: false, 
      themes: [],
      message: `Failed to extract ${type} themes: ${error.message}`
    }
  }
}

export async function sendBookmarksToThemeExtractor(socketThemeExtractor: any, urls: string[]): Promise<{success: boolean, themes: any[], message: string}> {
  return processThemeExtraction(socketThemeExtractor, urls, 'bookmark')
}

// === Send pulse data to PulseAgent ===
export function sendMessageToPulse(socketPulse: any, pulseData: any[]): void {
  if (!socketPulse?.connected) {
    console.warn("⚠️ PulseAgent socket not connected")
    return
  }

  const payload = {
    type: 2,
    payload: {
      senderId: PULSEAGENT_IDS.AUTHOR_ID,
      senderName: "Extension Pulse",
      message: `Analyze current pulse data:\n${JSON.stringify(pulseData)}`,
      messageId: generateUUID(),
      roomId: PULSEAGENT_IDS.ROOM_ID,
      channelId: PULSEAGENT_IDS.CHANNEL_ID,
      serverId: PULSEAGENT_IDS.SERVER_ID,
      source: "pulse-analysis",
      attachments: [],
      metadata: {
        channelType: "DM",
        isDm: true,
        targetUserId: PULSEAGENT_IDS.AGENT_ID
      }
    }
  }

  console.log("📤 Message to PulseAgent:", {
    totalTabs: pulseData.length,
    sampleData: pulseData.slice(0, 2).map(d => ({ url: d.url, title: d.title?.slice(0, 30) }))
  })
  socketPulse.emit("message", payload)
}

// === Ollama requests via background ===
export async function sendOllamaRequest(url: string, options: RequestInit): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "OLLAMA_REQUEST",
        data: { 
          url: url,
          method: options.method,
          headers: options.headers,
          body: options.body
        }
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error));
        }
      }
    );
  });
}
