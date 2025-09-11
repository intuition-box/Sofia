import { SOFIA_IDS, CHATBOT_IDS, BOOKMARKAGENT_IDS } from "./constants"


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
const BOOKMARK_CONFIG = {
  BATCH_SIZE: 5,
  TIMEOUT_MS: 120000, // 2 minutes
  DELAY_BETWEEN_BATCHES_MS: 120000 // 2 minutes
}

// === Progress tracking utility ===
class ProgressTracker {
  private sendProgressUpdate(progress: number, status: string): void {
    try {
      chrome.runtime.sendMessage({
        type: 'BOOKMARK_IMPORT_PROGRESS',
        progress,
        status
      }, (response) => {
        if (chrome.runtime.lastError) {
          // Ignore silently - UI might not be listening
        }
      })
    } catch (error) {
      // Ignore errors - UI might not be available
    }
  }

  updateSending(batchNumber: number, totalBatches: number): void {
    const progress = Math.round((batchNumber / totalBatches) * 50) + 5 // 5% to 55%
    this.sendProgressUpdate(progress, `Sending batch ${batchNumber}/${totalBatches}...`)
  }

  updateProcessing(processedBatches: number, totalBatches: number, batchNumber: number, success: boolean): void {
    const progress = Math.round((processedBatches / totalBatches) * 40) + 55 // 55% to 95%
    const status = `Batch ${batchNumber}/${totalBatches} ${success ? 'completed' : 'failed'} (${processedBatches}/${totalBatches})`
    this.sendProgressUpdate(progress, status)
  }

  finalize(message: string): void {
    this.sendProgressUpdate(100, message)
  }
}

// === Bookmark batch processor ===
class BookmarkBatchProcessor {
  private socket: any
  private progressTracker = new ProgressTracker()
  private isProcessing = false

  constructor(socket: any) {
    this.socket = socket
  }

  async processBookmarks(urls: string[]): Promise<{success: boolean, successfulBatches: number, failedBatches: number, totalBatches: number, count: number, message: string}> {
    if (this.isProcessing) {
      throw new Error('Bookmark processing already in progress')
    }

    if (!this.socket?.connected) {
      throw new Error('BookMarkAgent socket not connected')
    }

    this.isProcessing = true
    console.log('📚 Starting bookmark import:', urls.length, 'URLs')

    try {
      const totalBatches = Math.ceil(urls.length / BOOKMARK_CONFIG.BATCH_SIZE)
      console.log(`📚 Processing ${urls.length} bookmarks in ${totalBatches} batches`)

      const results = await this.processBatchesSequentially(urls, totalBatches)
      
      const result = {
        success: results.failedBatches === 0,
        successfulBatches: results.successfulBatches,
        failedBatches: results.failedBatches,
        totalBatches,
        count: results.totalBookmarksProcessed,
        message: results.failedBatches === 0 
          ? `Successfully processed all ${totalBatches} batches (${results.totalBookmarksProcessed} bookmarks)`
          : `Processed ${results.successfulBatches}/${totalBatches} batches successfully (${results.failedBatches} failed)`
      }

      this.progressTracker.finalize(result.message)
      return result

    } finally {
      this.isProcessing = false
    }
  }

  private async processBatchesSequentially(urls: string[], totalBatches: number): Promise<{successfulBatches: number, failedBatches: number, totalBookmarksProcessed: number}> {
    let successfulBatches = 0
    let failedBatches = 0
    let totalBookmarksProcessed = 0

    for (let i = 0; i < totalBatches; i++) {
      const startIndex = i * BOOKMARK_CONFIG.BATCH_SIZE
      const batch = urls.slice(startIndex, startIndex + BOOKMARK_CONFIG.BATCH_SIZE)
      const batchNumber = i + 1

      this.progressTracker.updateSending(batchNumber, totalBatches)

      try {
        await this.sendBatchWithTimeout(batch, batchNumber, totalBatches)
        successfulBatches++
        totalBookmarksProcessed += batch.length
        this.progressTracker.updateProcessing(successfulBatches + failedBatches, totalBatches, batchNumber, true)
      } catch (error) {
        console.error(`❌ Batch ${batchNumber} failed:`, error)
        failedBatches++
        this.progressTracker.updateProcessing(successfulBatches + failedBatches, totalBatches, batchNumber, false)
      }

      // Wait between batches (except for the last one)
      if (i < totalBatches - 1) {
        await this.delay(BOOKMARK_CONFIG.DELAY_BETWEEN_BATCHES_MS)
      }
    }

    return { successfulBatches, failedBatches, totalBookmarksProcessed }
  }

  private async sendBatchWithTimeout(urls: string[], batchNumber: number, totalBatches: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for response to batch ${batchNumber}`))
      }, BOOKMARK_CONFIG.TIMEOUT_MS)

      // Send the batch
      const payload = {
        type: 2,
        payload: {
          senderId: BOOKMARKAGENT_IDS.AUTHOR_ID,
          senderName: "Extension",
          message: urls.join('\n'),
          messageId: generateUUID(),
          roomId: BOOKMARKAGENT_IDS.ROOM_ID,
          channelId: BOOKMARKAGENT_IDS.CHANNEL_ID,
          serverId: BOOKMARKAGENT_IDS.SERVER_ID,
          source: "bookmark-extension",
          attachments: [],
          metadata: {
            channelType: "DM",
            isDm: true,
            targetUserId: BOOKMARKAGENT_IDS.AGENT_ID,
            bookmarkUrls: urls,
            batchInfo: {
              batchNumber,
              totalBatches,
              batchSize: urls.length
            }
          }
        }
      }

      // Store resolver for when response comes back
      this.storeResponseHandler(timeout, resolve, reject)
      
      this.socket.emit("message", payload)
    })
  }

  private storeResponseHandler(timeout: NodeJS.Timeout, resolve: Function, reject: Function): void {
    // This will be called by unlockBookmarkResponse
    globalResponseHandler = () => {
      clearTimeout(timeout)
      resolve()
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Global handler for responses 
let globalResponseHandler: (() => void) | null = null

// === Send bookmarks to BookMarkAgent ===
export async function sendBookmarksToAgent(socketBookmarkAgent: any, urls: string[]): Promise<{success: boolean, successfulBatches: number, failedBatches: number, totalBatches: number, count: number, message: string}> {
  if (!socketBookmarkAgent) {
    console.error("❌ BookMarkAgent socket is null/undefined")
    return { 
      success: false, 
      successfulBatches: 0,
      failedBatches: 1,
      totalBatches: 1,
      count: 0,
      message: 'BookMarkAgent not available'
    }
  }

  const processor = new BookmarkBatchProcessor(socketBookmarkAgent)
  
  try {
    const result = await processor.processBookmarks(urls)
    console.log('📊 Import finalized - Success:', result.successfulBatches, 'Failed:', result.failedBatches)
    return result
  } catch (error) {
    console.error('❌ Bookmark processing failed:', error)
    return { 
      success: false, 
      successfulBatches: 0,
      failedBatches: 1,
      totalBatches: 1,
      count: 0,
      message: `Failed to process bookmarks: ${error.message}`
    }
  }
}

// === Function to unlock after receiving BookMark response ===
export function unlockBookmarkResponse(success: boolean = true): void {
  if (globalResponseHandler) {
    globalResponseHandler()
    globalResponseHandler = null
  }
}

// === Utility functions for bookmarks ===
export function extractBookmarkUrls(bookmarkNodes: chrome.bookmarks.BookmarkTreeNode[]): string[] {
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