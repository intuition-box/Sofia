import { SOFIA_IDS, CHATBOT_IDS, BOOKMARKAGENT_IDS } from "./constants"
import { messageBus } from "~lib/MessageBus"

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

// === Variables for sequential management ===
let isWaitingForBookmarkResponse = false
let pendingBatches: Array<{urls: string[], batchNumber: number, totalBatches: number}> = []
let responseTimeout: NodeJS.Timeout | null = null
let currentBatchCallback: (() => void) | null = null

// Variables for global import tracking
let globalImportCallback: ((result: any) => void) | null = null
let totalBatchesExpected = 0
let successfulBatches = 0
let failedBatches = 0
let totalBookmarksProcessed = 0

// === Function to send progress updates ===
function sendProgressUpdate(progress: number, status: string): void {
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

// === Send bookmarks to BookMarkAgent ===
export function sendBookmarksToAgent(socketBookmarkAgent: any, urls: string[], onComplete?: (result: any) => void): void {
  console.log('📚 Starting bookmark import:', urls.length, 'URLs')
  
  // Reset global tracking
  globalImportCallback = onComplete || null
  successfulBatches = 0
  failedBatches = 0
  totalBookmarksProcessed = 0
  
  if (!socketBookmarkAgent) {
    console.error("❌ [messageSenders.ts] BookMarkAgent socket is null/undefined")
    sendProgressUpdate(0, 'Error: BookMarkAgent not available')
    if (globalImportCallback) {
      globalImportCallback({ success: false, error: 'BookMarkAgent not available' })
    }
    return
  }
  
  if (!socketBookmarkAgent.connected) {
    console.error("❌ [messageSenders.ts] BookMarkAgent socket not connected")
    sendProgressUpdate(0, 'Error: BookMarkAgent not connected')
    if (globalImportCallback) {
      globalImportCallback({ success: false, error: 'BookMarkAgent not connected' })
    }
    return
  }

  // Split into batches of 5 and send sequentially (less load for GaiaNet)
  const batchSize = 5
  totalBatchesExpected = Math.ceil(urls.length / batchSize)
  
  console.log(`📚 Processing ${urls.length} bookmarks in ${totalBatchesExpected} batches`)
  sendProgressUpdate(5, `Processing ${urls.length} bookmarks in ${totalBatchesExpected} batches...`)

  sendBookmarkBatchesSequentially(socketBookmarkAgent, urls, batchSize, 0, totalBatchesExpected)
}

// === Function to finalize import ===
function finalizeImport(): void {
  const totalProcessed = successfulBatches + failedBatches
  console.log(`📊 Import finalized - Success: ${successfulBatches}, Failed: ${failedBatches}`)
  
  if (globalImportCallback) {
    const result = {
      success: failedBatches === 0,
      successfulBatches,
      failedBatches,
      totalBatches: totalBatchesExpected,
      count: totalBookmarksProcessed,
      message: failedBatches === 0 
        ? `Successfully processed all ${totalBatchesExpected} batches (${totalBookmarksProcessed} bookmarks)`
        : `Processed ${successfulBatches}/${totalBatchesExpected} batches successfully (${failedBatches} failed)`
    }
    
    sendProgressUpdate(100, result.message)
    globalImportCallback(result)
    globalImportCallback = null
  }
}

// === Sequential sending of bookmark batches ===
function sendBookmarkBatchesSequentially(socketBookmarkAgent: any, allUrls: string[], batchSize: number, currentIndex: number, totalBatches: number): void {
  if (currentIndex >= allUrls.length) {
    return
  }

  const batch = allUrls.slice(currentIndex, currentIndex + batchSize)
  const batchNumber = Math.floor(currentIndex / batchSize) + 1
  
  // Calculate progress percentage for sending
  const progress = Math.round((batchNumber / totalBatches) * 50) + 5 // 5% to 55% for sending
  sendProgressUpdate(progress, `Sending batch ${batchNumber}/${totalBatches}...`)
  
  const onComplete = (batchSuccess: boolean) => {
    // Callback called when we receive response or timeout
    if (batchSuccess) {
      successfulBatches++
      totalBookmarksProcessed += batch.length
    } else {
      failedBatches++
    }
    
    const processedBatches = successfulBatches + failedBatches
    const progressForResponses = Math.round((processedBatches / totalBatches) * 40) + 55 // 55% to 95%
    
    sendProgressUpdate(
      progressForResponses, 
      `Batch ${batchNumber}/${totalBatches} ${batchSuccess ? 'completed' : 'failed'} (${processedBatches}/${totalBatches})`
    )
    
    // Check if all batches have been processed
    if (processedBatches >= totalBatches) {
      finalizeImport()
      return
    }
    
    setTimeout(() => {
      sendBookmarkBatchesSequentially(socketBookmarkAgent, allUrls, batchSize, currentIndex + batchSize, totalBatches)
    }, 120000) // 2 minutes between batches
  }
  
  sendBookmarkBatch(socketBookmarkAgent, batch, batchNumber, totalBatches, onComplete)
}

// === Send a batch of bookmarks with response waiting ===
function sendBookmarkBatch(socketBookmarkAgent: any, urls: string[], batchNumber: number, totalBatches: number, onComplete: (success: boolean) => void): void {
  if (!socketBookmarkAgent?.connected) {
    console.error("❌ [messageSenders.ts] BookMarkAgent socket disconnected during batch send")
    onComplete(false)
    return
  }

  if (isWaitingForBookmarkResponse) {
    console.warn("⚠️ [messageSenders.ts] Already waiting for bookmark response, queueing batch")
    pendingBatches.push({urls, batchNumber, totalBatches})
    return
  }

  const message = urls.join('\n')

  const messageId = generateUUID()
  
  // Mark as waiting for response and store callback
  isWaitingForBookmarkResponse = true
  currentBatchCallback = () => onComplete(true) // Success callback
  
  // 2 minute timeout for response
  responseTimeout = setTimeout(() => {
    console.warn(`⏰ [messageSenders.ts] Timeout waiting for response to batch ${batchNumber}`)
    sendProgressUpdate(
      Math.round(((successfulBatches + failedBatches + 1) / totalBatchesExpected) * 40) + 55, 
      `Batch ${batchNumber} timed out - continuing...`
    )
    isWaitingForBookmarkResponse = false
    if (currentBatchCallback) {
      currentBatchCallback = null
      onComplete(false) // Failed due to timeout
    }
  }, 120000)

  const payload = {
    type: 2,
    payload: {
      senderId: BOOKMARKAGENT_IDS.AUTHOR_ID,
      senderName: "Extension",
      message,
      messageId,
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

  socketBookmarkAgent.emit("message", payload)
}

// === Function to unlock after receiving BookMark response ===
export function unlockBookmarkResponse(success: boolean = true): void {
  if (responseTimeout) {
    clearTimeout(responseTimeout)
    responseTimeout = null
  }
  isWaitingForBookmarkResponse = false
  
  if (currentBatchCallback) {
    currentBatchCallback()
    currentBatchCallback = null
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