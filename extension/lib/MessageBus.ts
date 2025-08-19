/**
 * Classe centralisée pour gérer les messages Chrome runtime
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

  // Envoyer un message avec gestion d'erreur
  public async sendMessage(message: any): Promise<any> {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.warn('MessageBus: Erreur envoi message:', error);
      return null;
    }
  }

  // Envoyer un message sans attendre de réponse
  public sendMessageFireAndForget(message: any): void {
    chrome.runtime.sendMessage(message).catch(() => {
      // Ignore les erreurs silencieusement
    });
  }

  // Messages spécifiques pour l'agent
  public sendAgentResponse(data: any): void {
    this.sendMessageFireAndForget({
      type: "AGENT_RESPONSE",
      data: data
    });
  }

  // Messages spécifiques pour MetaMask
  public sendMetamaskResult(result: any): void {
    this.sendMessageFireAndForget({
      type: 'METAMASK_RESULT',
      data: result
    });
  }

  // Messages de tracking
  public async sendTrackingMessage(type: string, data: any): Promise<any> {
    return this.sendMessage({
      type: type,
      data: data
    });
  }
}

// Export d'une instance singleton
export const messageBus = MessageBus.getInstance();