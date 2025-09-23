/**
 * Centralized class to manage Chrome runtime messages
 * Provides type-safe messaging with proper error handling
 */
import type { 
  ChromeMessage, 
  MessageResponse, 
  TripletMessage, 
  BadgeMessage, 
  MetamaskMessage,
  MessageType 
} from '../../types/messages'

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
      console.warn('MessageBus: Message send error:', error);
      return null;
    }
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

  // Specific messages for MetaMask
  public sendMetamaskResult(result: MetamaskMessage['data']): void {
    this.sendMessageFireAndForget({
      type: 'METAMASK_RESULT',
      data: result
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

  // MetaMask operations
  public async connectToMetamask(): Promise<MessageResponse | null> {
    return this.sendMessage({ type: 'CONNECT_TO_METAMASK' });
  }

  public async getMetamaskAccount(): Promise<MessageResponse | null> {
    return this.sendMessage({ type: 'GET_METAMASK_ACCOUNT' });
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

  // Intention and ranking
  public async getIntentionRanking(limit?: number): Promise<MessageResponse | null> {
    return this.sendMessage({
      type: 'GET_INTENTION_RANKING',
      data: { limit }
    });
  }

  public async getDomainIntentions(domain: string): Promise<MessageResponse | null> {
    return this.sendMessage({
      type: 'GET_DOMAIN_INTENTIONS',
      data: { domain }
    });
  }

  public async recordPredicate(url: string, predicate: string): Promise<MessageResponse | null> {
    return this.sendMessage({
      type: 'RECORD_PREDICATE',
      data: { url, predicate }
    });
  }

  public async getUpgradeSuggestions(minConfidence?: number): Promise<MessageResponse | null> {
    return this.sendMessage({
      type: 'GET_UPGRADE_SUGGESTIONS',
      data: { minConfidence }
    });
  }

  // Analysis operations
  public async startPulseAnalysis(): Promise<MessageResponse | null> {
    return this.sendMessage({ type: 'START_PULSE_ANALYSIS' });
  }

  // Tracking stats
  public async getTrackingStats(): Promise<MessageResponse | null> {
    return this.sendMessage({ type: 'GET_TRACKING_STATS' });
  }

  public async clearTrackingData(): Promise<MessageResponse | null> {
    return this.sendMessage({ type: 'CLEAR_TRACKING_DATA' });
  }
}

// Export d'une instance singleton
export const messageBus = MessageBus.getInstance();