/**
 * Centralized class to manage Chrome runtime messages
 * Provides safe messaging
 */
import type {
  ChromeMessage,
  MessageResponse
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

  // Tab operations
  public async getTabId(): Promise<MessageResponse | null> {
    return this.sendMessage({ type: 'GET_TAB_ID' });
  }

  // Content-script handler in pageAnalyzer.ts
  public async getCleanUrl(): Promise<MessageResponse | null> {
    return this.sendMessage({ type: 'GET_CLEAN_URL' });
  }
}

// Export d'une instance singleton
export const messageBus = MessageBus.getInstance();
