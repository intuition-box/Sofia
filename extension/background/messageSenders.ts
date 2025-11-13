/**
 * MESSAGE SENDERS - Chrome API Utilities
 *
 * This file provides utility functions for accessing Chrome APIs.
 * For sending messages to agents, use sendMessage() directly from websocket.ts
 *
 * Functions here:
 * - getAllBookmarks() - Get bookmarks from Chrome API
 * - getAllHistory() - Get history from Chrome API
 * - sendOllamaRequest() - Proxy for Ollama requests
 */

import { EXCLUDED_URL_PATTERNS } from "./constants"
import { isSensitiveUrl } from "./utils/url"

// === Chrome API Utilities ===
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

export async function getAllBookmarks(): Promise<{ success: boolean; urls?: string[]; error?: string }> {
  try {
    const bookmarkTree = await chrome.bookmarks.getTree()
    const allUrls = extractBookmarkUrls(bookmarkTree)
    
    // Limit to 200 most recent bookmarks to avoid prompt being too long
    const urls = allUrls.slice(0, 200)
    
    console.log(`📚 Extracted ${allUrls.length} bookmarks, using ${urls.length} (limited)`)
    
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

// === Ollama proxy (for background script context) ===
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
