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

// === Envoi de message à SofIA ===
export function sendMessageToSofia(socketSofia: any, text: string): void {
  if (!socketSofia?.connected) {
    console.warn("⚠️ SofIA socket non connecté")
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

  console.log("📤 Message à SofIA :", payload)
  socketSofia.emit("message", payload)
}

// === Envoi de message au Chatbot ===
export function sendMessageToChatbot(socketBot: any, text: string): void {
  if (!socketBot?.connected) {
    console.warn("⚠️ Chatbot socket non connecté")
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

  console.log("📤 Message au Chatbot :", payload)
  socketBot.emit("message", payload)
}

// === Variables pour la gestion séquentielle ===
let isWaitingForBookmarkResponse = false
let pendingBatches: Array<{urls: string[], batchNumber: number, totalBatches: number}> = []
let responseTimeout: NodeJS.Timeout | null = null
let currentBatchCallback: (() => void) | null = null

// Variables pour le suivi global de l'import
let globalImportCallback: ((result: any) => void) | null = null
let totalBatchesExpected = 0
let successfulBatches = 0
let failedBatches = 0
let totalBookmarksProcessed = 0

// === Fonction pour envoyer les mises à jour de progression ===
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

// === Envoi de bookmarks au BookMarkAgent ===
export function sendBookmarksToAgent(socketBookmarkAgent: any, urls: string[], onComplete?: (result: any) => void): void {
  console.log('📚 [messageSenders.ts] sendBookmarksToAgent() called with', urls.length, 'URLs')
  
  // Reset global tracking
  globalImportCallback = onComplete || null
  successfulBatches = 0
  failedBatches = 0
  totalBookmarksProcessed = 0
  
  console.log('📚 [messageSenders.ts] BookMarkAgent socket status:', {
    exists: !!socketBookmarkAgent,
    connected: socketBookmarkAgent?.connected,
    id: socketBookmarkAgent?.id
  })
  
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

  // Découper en lots de 5 et envoyer séquentiellement (moins de charge pour GaiaNet)
  const batchSize = 5
  totalBatchesExpected = Math.ceil(urls.length / batchSize)
  
  console.log(`📚 [messageSenders.ts] Splitting ${urls.length} bookmarks into ${totalBatchesExpected} batches of ${batchSize}`)
  sendProgressUpdate(5, `Processing ${urls.length} bookmarks in ${totalBatchesExpected} batches...`)

  sendBookmarkBatchesSequentially(socketBookmarkAgent, urls, batchSize, 0, totalBatchesExpected)
}

// === Fonction pour finaliser l'import ===
function finalizeImport(): void {
  const totalProcessed = successfulBatches + failedBatches
  console.log(`📊 [messageSenders.ts] Import finalized - Success: ${successfulBatches}, Failed: ${failedBatches}, Total: ${totalProcessed}`)
  
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

// === Envoi séquentiel des lots de bookmarks ===
function sendBookmarkBatchesSequentially(socketBookmarkAgent: any, allUrls: string[], batchSize: number, currentIndex: number, totalBatches: number): void {
  if (currentIndex >= allUrls.length) {
    console.log(`✅ [messageSenders.ts] All ${totalBatches} batches sent`)
    // Ne pas finaliser ici - attendre que tous les batches reçoivent une réponse
    return
  }

  const batch = allUrls.slice(currentIndex, currentIndex + batchSize)
  const batchNumber = Math.floor(currentIndex / batchSize) + 1
  
  // Calculate progress percentage pour l'envoi
  const progress = Math.round((batchNumber / totalBatches) * 50) + 5 // 5% à 55% pour l'envoi
  sendProgressUpdate(progress, `Sending batch ${batchNumber}/${totalBatches}...`)
  
  const onComplete = (batchSuccess: boolean) => {
    // Callback appelé quand on reçoit la réponse ou timeout
    if (batchSuccess) {
      successfulBatches++
      totalBookmarksProcessed += batch.length
    } else {
      failedBatches++
    }
    
    const processedBatches = successfulBatches + failedBatches
    const progressForResponses = Math.round((processedBatches / totalBatches) * 40) + 55 // 55% à 95%
    
    sendProgressUpdate(
      progressForResponses, 
      `Batch ${batchNumber}/${totalBatches} ${batchSuccess ? 'completed' : 'failed'} (${processedBatches}/${totalBatches})`
    )
    
    // Vérifier si tous les batches ont été traités
    if (processedBatches >= totalBatches) {
      finalizeImport()
      return
    }
    
    setTimeout(() => {
      sendBookmarkBatchesSequentially(socketBookmarkAgent, allUrls, batchSize, currentIndex + batchSize, totalBatches)
    }, 120000) // 2 minutes entre les lots
  }
  
  sendBookmarkBatch(socketBookmarkAgent, batch, batchNumber, totalBatches, onComplete)
}

// === Envoi d'un lot de bookmarks avec attente de réponse ===
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

  const message = urls.join('\n') // Juste les URLs, rien d'autre
  console.log(`📚 [messageSenders.ts] Sending batch ${batchNumber}/${totalBatches} with ${urls.length} URLs`)

  const messageId = generateUUID()
  
  // Marquer comme en attente de réponse et stocker le callback
  isWaitingForBookmarkResponse = true
  currentBatchCallback = () => onComplete(true) // Success callback
  
  // Timeout de 2 minutes pour la réponse
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

  console.log(`📤 [messageSenders.ts] Sending batch ${batchNumber}/${totalBatches} to BookMarkAgent`)
  socketBookmarkAgent.emit("message", payload)
  console.log(`✅ [messageSenders.ts] Batch ${batchNumber}/${totalBatches} sent, waiting for response...`)
}

// === Fonction pour débloquer après réception de réponse BookMark ===
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
  
  console.log(`🔓 [messageSenders.ts] Unlocked for next bookmark batch (${success ? 'success' : 'failed'})`)
}

// === Fonctions utilitaires pour les bookmarks ===
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
  console.log('📚 [messageSenders.ts] getAllBookmarks() called')
  try {
    console.log('📚 [messageSenders.ts] Calling chrome.bookmarks.getTree()...')
    const startTime = Date.now()
    const bookmarkTree = await chrome.bookmarks.getTree()
    const getTreeTime = Date.now() - startTime
    console.log(`📚 [messageSenders.ts] chrome.bookmarks.getTree() took ${getTreeTime}ms`)
    
    console.log('📚 [messageSenders.ts] Extracting URLs from bookmark tree...')
    const extractStartTime = Date.now()
    const urls = extractBookmarkUrls(bookmarkTree)
    const extractTime = Date.now() - extractStartTime
    console.log(`📚 [messageSenders.ts] Extracted ${urls.length} bookmarks in ${extractTime}ms`)
    
    return { success: true, urls }
  } catch (error) {
    console.error("❌ [messageSenders.ts] Failed to get bookmarks:", error)
    return { success: false, error: error.message }
  }
}