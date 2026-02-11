/**
 * MESSAGE SENDERS - Chrome API Utilities
 *
 * This file provides utility functions for accessing Chrome APIs.
 *
 * Functions here:
 * - getAllBookmarks() - Get bookmarks from Chrome API
 * - getAllHistory() - Get history from Chrome API
 */

import { EXCLUDED_URL_PATTERNS } from "./constants"
import { isSensitiveUrl } from "./utils/url"
import { createServiceLogger } from "../lib/utils/logger"

const logger = createServiceLogger('MessageSenders')

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

    logger.info(`Extracted ${all.length} bookmarks, filtered to ${filtered.length}, using ${bookmarks.length}`)

    return { success: true, bookmarks }
  } catch (error) {
    logger.error("Failed to get bookmarks", error)
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
    
    logger.info(`Extracted ${urls.length} history URLs`)
    return { success: true, urls }
  } catch (error) {
    logger.error('Failed to get browsing history', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
