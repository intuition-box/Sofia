/**
 * Service for managing extension badge count
 * Centralizes all badge-related operations
 */

import { elizaDataService } from '../database/indexedDB-methods'
import type { MessageResponse } from '../../types/messages'
import { createServiceLogger } from '../utils/logger'

const logger = createServiceLogger('BadgeService')

export class BadgeService {
  private static instance: BadgeService

  public static getInstance(): BadgeService {
    if (!BadgeService.instance) {
      BadgeService.instance = new BadgeService()
    }
    return BadgeService.instance
  }

  private constructor() {}

  /**
   * Update badge with echo count
   */
  public async updateEchoBadge(count: number): Promise<void> {
    try {
      if (count > 0) {
        await chrome.action.setBadgeText({ text: count.toString() })
        await chrome.action.setBadgeBackgroundColor({ color: '#dc3545' })
      } else {
        await chrome.action.setBadgeText({ text: '' })
      }
      logger.info('Badge updated', { count })
    } catch (error) {
      logger.error('Failed to update badge', error)
      throw error
    }
  }

  /**
   * Count available (unpublished) triplets in IndexedDB
   */
  public async countAvailableEchoes(): Promise<number> {
    try {
      // Load published triplet IDs to exclude them
      const publishedTripletIds = await elizaDataService.loadPublishedTripletIds()
      
      // Get all parsed messages from IndexedDB
      const messages = await elizaDataService.getMessagesByType('parsed_message')
      
      let availableCount = 0
      
      for (const record of messages) {
        if (record.type === 'parsed_message' && record.content) {
          try {
            // Parse the content if it's a string
            let parsed: any
            if (typeof record.content === 'string') {
              parsed = JSON.parse(record.content)
            } else if (record.content && typeof record.content === 'object') {
              parsed = record.content as any
            } else {
              continue
            }
            
            if (parsed && parsed.triplets && Array.isArray(parsed.triplets) && parsed.triplets.length > 0) {
              parsed.triplets.forEach((triplet: any, index: number) => {
                const tripletId = `${record.messageId}_${index}`
                
                // Only count if not already published
                if (!publishedTripletIds.includes(tripletId)) {
                  availableCount++
                }
              })
            }
          } catch (error) {
            logger.error('Failed to parse message content', error)
            continue
          }
        }
      }
      
      logger.debug('Counted available echoes', { count: availableCount })
      return availableCount
    } catch (error) {
      logger.error('Failed to count available echoes', error)
      return 0
    }
  }

  /**
   * Handle badge update with response
   */
  public async handleBadgeUpdate(sendResponse: (response: MessageResponse) => void): Promise<void> {
    try {
      const availableCount = await this.countAvailableEchoes()
      await this.updateEchoBadge(availableCount)
      logger.info('Badge updated successfully', { count: availableCount })
      sendResponse({ success: true, data: { count: availableCount } })
    } catch (error) {
      logger.error('Failed to update badge', error)
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }
}

// Export singleton instance
export const badgeService = BadgeService.getInstance()