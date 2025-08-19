
import { connectToMetamask, getMetamaskConnection } from "./metamask"
import { sanitizeUrl, isSensitiveUrl } from "./utils/url"
import { sendToAgent, clearOldSentMessages } from "./utils/buffer"
import { getBehaviorFromCache, removeBehaviorFromCache } from "./behavior"
import { EXCLUDED_URL_PATTERNS, BEHAVIOR_CACHE_TIMEOUT_MS } from "./constants"
import { messageBus } from "~lib/MessageBus"
import type { ChromeMessage, PageData } from "./types"
import { recordScroll, getScrollStats, clearScrolls } from "./behavior"
import { getAllBookmarks, sendBookmarksToAgent } from "./websocket"


// Buffer temporaire de pageData par tabId
const pageDataBufferByTabId = new Map<number, { data: PageData; loadTime: number }>()

async function handlePageDataInline(data: any, pageLoadTime: number): Promise<void> {

  let parsedData: PageData
  let attentionText = ""

  try {
    parsedData = typeof data === "string" ? JSON.parse(data) : data

    if (typeof parsedData.attentionScore === "number") {
      attentionText = `Attention: ${parsedData.attentionScore.toFixed(2)}`
    }
    parsedData.timestamp ??= pageLoadTime
    parsedData.ogType ??= "website"
    parsedData.title ??= "Non défini"
    parsedData.keywords ??= ""
    parsedData.description ??= ""
    parsedData.h1 ??= ""
  } catch (err) {
    console.error("❌ Impossible de parser les données PAGE_DATA :", err, data)
    return
  }

  if (EXCLUDED_URL_PATTERNS.some(str => parsedData.url.toLowerCase().includes(str))) return
  if (isSensitiveUrl(parsedData.url)) {
    console.log("🔒 URL sensible ignorée:", parsedData.url)
    return
  }

  let behaviorText = ""
  const behavior = getBehaviorFromCache(parsedData.url)
  const now = Date.now()

  if (parsedData.duration && parsedData.duration > 5000) {
    behaviorText += ` Temps passé sur la page : ${(parsedData.duration / 1000).toFixed(1)}s
`
  }

  if (behavior && now - behavior.timestamp < BEHAVIOR_CACHE_TIMEOUT_MS) {
    if (behavior.videoPlayed) behaviorText += `Vidéo regardée (${behavior.videoDuration?.toFixed(1)}s)
`
    if (behavior.audioPlayed) behaviorText += `🎵 Audio écouté (${behavior.audioDuration?.toFixed(1)}s)
`
    if (behavior.articleRead) behaviorText += `Article lu : "${behavior.title}" (${(behavior.readTime! / 1000).toFixed(1)}s)
`
  }
  const scrollStats = getScrollStats(parsedData.url)
  if (scrollStats && scrollStats.scrollAttentionScore != undefined) {
    behaviorText += `Scrolls: ${scrollStats.count}, Δmoy: ${scrollStats.avgDelta}ms\n`
    behaviorText += `Attention Score: ${scrollStats.scrollAttentionScore.toFixed(2)}\n`
  }

  const message =
    `URL: ${sanitizeUrl(parsedData.url)}
` +
    `Titre: ${parsedData.title.slice(0, 100)}
` +
    (parsedData.keywords ? `Mots-clés: ${parsedData.keywords.slice(0, 50)}
` : "") +
    (parsedData.description ? `Description: ${parsedData.description.slice(0, 150)}
` : "") +
    (parsedData.h1 ? `H1: ${parsedData.h1.slice(0, 80)}
` : "") +
    `Timestamp: ${new Date(parsedData.timestamp).toLocaleString("fr-FR")}` +
    (attentionText ? `
${attentionText}` : "") +
    (behaviorText ? `
Comportement:
${behaviorText}` : "")

  console.group("🧠 Nouvelle page capturée")
  console.log(message)
  console.groupEnd()
  console.log("═".repeat(100))

  clearScrolls(parsedData.url)
  sendToAgent(message)
  clearOldSentMessages()
  if (behavior) removeBehaviorFromCache(parsedData.url)
}

export function setupMessageHandlers(): void {
  chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, sendResponse) => {
    switch (message.type) {
      case "GET_TAB_ID":
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0]
          sendResponse({ tabId: activeTab?.id })
        })
        return true

      case "PAGE_DATA": {
        const tabId = "tabId" in message && typeof message.tabId === "number" ? message.tabId : -1
        if (tabId === -1) {
          console.warn("❗ PAGE_DATA sans tabId")
          break
        }
        const loadTime = message.pageLoadTime || Date.now()
        pageDataBufferByTabId.set(tabId, { data: message.data, loadTime })
        console.log(`📥 PAGE_DATA bufferisé pour tabId ${tabId}`)
        break
      }

      case "PAGE_DURATION": {
        const tabId = "tabId" in message && typeof message.tabId === "number" ? message.tabId : -1
        const duration = message.data.duration
        if (tabId === -1 || !pageDataBufferByTabId.has(tabId)) {
          console.warn("⚠️ PAGE_DURATION sans PAGE_DATA associé ou tabId manquant")
          break
        }
        const buffered = pageDataBufferByTabId.get(tabId)!
        buffered.data.duration = duration
        console.log(`📤 Fusion PAGE_DATA + PAGE_DURATION pour tabId ${tabId}`)
        handlePageDataInline(buffered.data, buffered.loadTime)
        pageDataBufferByTabId.delete(tabId)
        break
      }

      case "SCROLL_DATA":
        recordScroll(message.data.url, message.data.timestamp, message.data.deltaT)
        console.log(`Scroll enregistré pour ${message.data.url}`)

        break

      case "BEHAVIOR_DATA":
        console.log(`Comportement: ${JSON.stringify(message.data)}`)
        break

      case "CONNECT_TO_METAMASK":
        connectToMetamask()
          .then(result => messageBus.sendMetamaskResult(result))
          .catch(error => {
            console.error("MetaMask error:", error)
            messageBus.sendMetamaskResult({ success: false, error: error.message })
          })
        break

      case "GET_METAMASK_ACCOUNT": {
        const connection = getMetamaskConnection()
        sendResponse(
          connection?.account
            ? { success: true, account: connection.account, chainId: connection.chainId }
            : { success: false, error: "Aucune connexion MetaMask trouvée" }
        )
        break
      }

      case "GET_TRACKING_STATS":
        sendResponse({
          success: true,
          data: { message: "Données envoyées directement à l'agent - pas de stockage local" }
        })
        break

      case "EXPORT_TRACKING_DATA":
        sendResponse({
          success: false,
          error: "Export non disponible - données envoyées directement à l'agent"
        })
        break

      case "CLEAR_TRACKING_DATA":
        sendResponse({ success: true, message: "Aucune donnée stockée localement à effacer" })
        break

      case "GET_BOOKMARKS":
        console.log('📚 [messages.ts] GET_BOOKMARKS request received')
        getAllBookmarks()
          .then(result => {
            console.log('📚 [messages.ts] getAllBookmarks result:', result)
            if (result.success && result.urls) {
              console.log(`📚 [messages.ts] Sending ${result.urls.length} bookmarks to agent...`)
              sendBookmarksToAgent(result.urls)
              console.log('📚 [messages.ts] Bookmarks sent to agent, responding to UI')
              sendResponse({ success: true, count: result.urls.length })
            } else {
              console.error('📚 [messages.ts] getAllBookmarks failed:', result.error)
              sendResponse({ success: false, error: result.error })
            }
          })
          .catch(error => {
            console.error("❌ [messages.ts] Exception in GET_BOOKMARKS:", error)
            sendResponse({ success: false, error: error.message })
          })
        return true

      case "STORE_BOOKMARK_TRIPLETS":
        console.log('💾 [messages.ts] STORE_BOOKMARK_TRIPLETS request received')
        try {
          // Stocker le JSON de triplets dans IndexedDB
          const newMessage = {
            id: `bookmark_${message.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
            content: { text: message.text },
            created_at: message.timestamp,
            processed: false
          }
          
          sendToAgent(message.text) // Utilise la méthode existante
          console.log('✅ [messages.ts] Bookmark triplets stored:', { id: newMessage.id })
          sendResponse({ success: true, id: newMessage.id })
        } catch (error) {
          console.error("❌ [messages.ts] Failed to store bookmark triplets:", error)
          sendResponse({ success: false, error: error.message })
        }
        return true
    }

    sendResponse({ success: true })
    return true
  })
}
