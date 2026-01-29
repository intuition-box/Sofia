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

export interface BookmarkData {
  url: string
  title: string
}

function extractBookmarkData(bookmarkNodes: chrome.bookmarks.BookmarkTreeNode[]): BookmarkData[] {
  const bookmarks: BookmarkData[] = []

  function traverse(nodes: chrome.bookmarks.BookmarkTreeNode[]) {
    for (const node of nodes) {
      if (node.url) {
        bookmarks.push({ url: node.url, title: node.title || node.url })
      }
      if (node.children) {
        traverse(node.children)
      }
    }
  }

  traverse(bookmarkNodes)
  return bookmarks
}

export async function getAllBookmarks(): Promise<{ success: boolean; bookmarks?: BookmarkData[]; error?: string }> {
  try {
    const bookmarkTree = await chrome.bookmarks.getTree()
    const all = extractBookmarkData(bookmarkTree)

    // Filter sensitive and excluded URLs
    const filtered = all.filter(b =>
      !isSensitiveUrl(b.url) &&
      !EXCLUDED_URL_PATTERNS.some(pattern => b.url.includes(pattern))
    )

    // Limit to 500 bookmarks
    const bookmarks = filtered.slice(0, 500)

    console.log(`📚 Extracted ${all.length} bookmarks, filtered to ${filtered.length}, using ${bookmarks.length}`)

    return { success: true, bookmarks }
  } catch (error) {
    console.error("❌ Failed to get bookmarks:", error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
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
