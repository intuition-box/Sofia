/**
 * Centralized class to manage Chrome runtime messages
 * Provides safe messaging
 */
import type {
  ChromeMessage,
  MessageResponse,
  MessageType
} from '../../types/messages'
import { createServiceLogger } from '../utils/logger'

const logger = createServiceLogger('MessageBus')

export class MessageBus {
  private static instance: MessageBus;

  public static getInstance(): MessageBus {
    if (!MessageBus.instance) {
      MessageBus.instance = new MessageBus();
    }
    return MessageBus.instance;
  }

  private constructor() {}

  // Send message with error handling
  public async sendMessage(message: ChromeMessage): Promise<MessageResponse | null> {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      logger.warn('Message send error', error);
      return null;
    }
  }

  // Send message with automatic retry and exponential backoff
  // Retries on: service worker death, null response, response.success === false
  public async sendMessageWithRetry(
    message: ChromeMessage,
    maxAttempts = 3,
    initialDelay = 800
  ): Promise<MessageResponse> {
    let lastError: string | null = null

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        const delay = initialDelay * Math.pow(2, attempt - 1)
        logger.warn(`Retry ${attempt}/${maxAttempts - 1} for ${message.type} after ${delay}ms`)
        await new Promise(r => setTimeout(r, delay))
      }

      try {
        const response = await chrome.runtime.sendMessage(message)
        if (response?.success) return response
        lastError = response?.error || "Message failed"
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
        logger.warn(`Message attempt ${attempt + 1}/${maxAttempts} failed for ${message.type}`, error)
      }
    }

    return { success: false, error: lastError || "Failed after retries" }
  }

  // Send message without waiting for response
  public sendMessageFireAndForget(message: ChromeMessage): void {
    chrome.runtime.sendMessage(message).catch(() => {
      // Ignore errors silently
    });
  }

  // Specific messages for agent
  public sendAgentResponse(data: any): void {
    this.sendMessageFireAndForget({
      type: "AGENT_RESPONSE",
      data: data
    });
  }

  // Badge management messages
  public sendUpdateBadge(count?: number): void {
    this.sendMessageFireAndForget({
      type: 'UPDATE_ECHO_BADGE',
      data: { count }
    });
  }

  public sendInitializeBadge(): void {
    this.sendMessageFireAndForget({
      type: 'INITIALIZE_BADGE'
    });
  }

  // Triplet lifecycle messages
  public sendTripletPublished(tripletId: string): void {
    this.sendMessageFireAndForget({
      type: 'TRIPLET_PUBLISHED',
      data: { tripletId }
    });
  }

  public sendTripletsDeleted(count: number): void {
    this.sendMessageFireAndForget({
      type: 'TRIPLETS_DELETED',
      data: { count }
    });
  }

  // Data storage messages
  public async sendStoreDetectedTriplets(triplets: any[], metadata: any): Promise<MessageResponse | null> {
    return this.sendMessage({
      type: 'STORE_DETECTED_TRIPLETS',
      data: { triplets, metadata }
    });
  }

  // Generic tracking messages
  public async sendTrackingMessage(type: MessageType, data: any): Promise<MessageResponse | null> {
    return this.sendMessage({
      type: type,
      data: data
    });
  }

  // ==================== ALL CHROME RUNTIME MESSAGES ====================
  
  // Tab operations
  public async getTabId(): Promise<MessageResponse | null> {
    return this.sendMessage({ type: 'GET_TAB_ID' });
  }

  // Page data tracking
  public sendPageData(data: any, pageLoadTime?: number): void {
    this.sendMessageFireAndForget({
      type: 'PAGE_DATA',
      data,
      pageLoadTime
    });
  }

  public sendPageDuration(url: string, duration: number): void {
    this.sendMessageFireAndForget({
      type: 'PAGE_DURATION',
      data: { url, duration }
    });
  }

  public sendScrollData(url: string, timestamp: number): void {
    this.sendMessageFireAndForget({
      type: 'SCROLL_DATA',
      data: { url, timestamp }
    });
  }

  // Data operations
  public async getBookmarks(): Promise<MessageResponse | null> {
    return this.sendMessage({ type: 'GET_BOOKMARKS' });
  }

  public async getHistory(): Promise<MessageResponse | null> {
    return this.sendMessage({ type: 'GET_HISTORY' });
  }

  public async storeBookmarkTriplets(text: string, timestamp: number): Promise<MessageResponse | null> {
    return this.sendMessage({
      type: 'STORE_BOOKMARK_TRIPLETS',
      data: { text, timestamp }
    });
  }

  // Tracking stats
  public async getTrackingStats(): Promise<MessageResponse | null> {
    return this.sendMessage({ type: 'GET_TRACKING_STATS' });
  }

  public async clearTrackingData(): Promise<MessageResponse | null> {
    return this.sendMessage({ type: 'CLEAR_TRACKING_DATA' });
  }

  // Page blockchain data operations
  public async getPageBlockchainData(url: string): Promise<MessageResponse | null> {
    return this.sendMessage({
      type: 'GET_PAGE_BLOCKCHAIN_DATA',
      data: { url }
    });
  }

  public sendPageAnalysis(pageData: any): void {
    this.sendMessageFireAndForget({
      type: 'PAGE_ANALYSIS',
      data: pageData
    });
  }

  public async getPageData(): Promise<MessageResponse | null> {
    return this.sendMessage({ type: 'GET_PAGE_DATA' });
  }

  public async getCleanUrl(): Promise<MessageResponse | null> {
    return this.sendMessage({ type: 'GET_CLEAN_URL' });
  }
}

// Export d'une instance singleton
export const messageBus = MessageBus.getInstance();