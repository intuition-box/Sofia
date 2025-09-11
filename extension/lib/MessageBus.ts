/**
 * Centralized class to manage Chrome runtime messages
 */
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
  public async sendMessage(message: any): Promise<any> {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.warn('MessageBus: Message send error:', error);
      return null;
    }
  }

  // Send message without waiting for response
  public sendMessageFireAndForget(message: any): void {
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
  public sendMetamaskResult(result: any): void {
    this.sendMessageFireAndForget({
      type: 'METAMASK_RESULT',
      data: result
    });
  }

  // Tracking messages
  public async sendTrackingMessage(type: string, data: any): Promise<any> {
    return this.sendMessage({
      type: type,
      data: data
    });
  }
}

// Export d'une instance singleton
export const messageBus = MessageBus.getInstance();