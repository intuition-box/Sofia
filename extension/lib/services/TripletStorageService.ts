/**
 * Service for storing triplet data
 * Handles bookmark and detected triplets storage
 */

import { elizaDataService } from '../database/indexedDB-methods'
import { badgeService } from './BadgeService'
import type { ChromeMessage, MessageResponse } from '../../types/messages'
import { createServiceLogger } from '../utils/logger'

const logger = createServiceLogger('TripletStorageService')

export class TripletStorageService {
  private static instance: TripletStorageService

  public static getInstance(): TripletStorageService {
    if (!TripletStorageService.instance) {
      TripletStorageService.instance = new TripletStorageService()
    }
    return TripletStorageService.instance
  }

  private constructor() {}

  /**
   * Handle storing bookmark triplets
   */
  public async handleStoreBookmarkTriplets(
    message: ChromeMessage, 
    sendResponse: (response: MessageResponse) => void
  ): Promise<void> {
    logger.info('STORE_BOOKMARK_TRIPLETS request received')
    
    try {
      const newMessage = {
        id: `bookmark_${message.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        content: { text: message.text || '' },
        created_at: message.timestamp || Date.now(),
        processed: false
      }
      
      await elizaDataService.storeMessage(newMessage, newMessage.id)
      logger.info('Bookmark triplets stored in IndexedDB', { id: newMessage.id })
      
      sendResponse({ success: true, id: newMessage.id })
    } catch (error) {
      logger.error('Failed to store bookmark triplets', error)
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }

  /**
   * Handle storing detected triplets
   */
  public async handleStoreDetectedTriplets(
    message: ChromeMessage, 
    sendResponse: (response: MessageResponse) => void
  ): Promise<void> {
    logger.info('STORE_DETECTED_TRIPLETS request received')
    
    try {
      const { triplets, metadata } = message.data || {}
      
      if (!triplets || !metadata) {
        throw new Error('Missing triplets or metadata in message')
      }
      
      // Format triplets as text for storage
      const tripletsText = JSON.stringify({
        triplets: triplets,
        metadata: metadata,
        type: 'detected_triplets'
      })
      
      // Store in IndexedDB
      const newMessage = {
        id: `detected_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: { text: tripletsText },
        created_at: Date.now(),
        processed: false
      }
      
      await elizaDataService.storeMessage(newMessage, newMessage.id)
      logger.info('Detected triplets stored', { 
        id: newMessage.id, 
        count: triplets.length,
        platform: metadata.hostname 
      })
      
      // Update badge count after storing new triplets
      const availableCount = await badgeService.countAvailableEchoes()
      await badgeService.updateEchoBadge(availableCount)
      
      sendResponse({ 
        success: true, 
        id: newMessage.id, 
        count: triplets.length 
      })
    } catch (error) {
      logger.error('Failed to store detected triplets', error)
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }
}

// Export singleton instance
export const tripletStorageService = TripletStorageService.getInstance()