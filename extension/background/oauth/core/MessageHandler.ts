// Chrome message handling for OAuth
import { MessageType } from '../types/interfaces'
import { OAuthService } from '../index'

export class MessageHandler {
  constructor(private oauthService: OAuthService) {
    this.setupMessageListener()
  }

  private setupMessageListener() {
    const messageHandlers = {
      [MessageType.OAUTH_CONNECT]: (msg: any) => this.oauthService.initiateOAuth(msg.platform),
      [MessageType.OAUTH_CALLBACK]: (msg: any) => this.oauthService.handleCallback(msg.platform, msg.code, msg.state),
      [MessageType.OAUTH_IMPLICIT_CALLBACK]: (msg: any) => this.oauthService.handleImplicitCallback(msg.platform, msg.accessToken, msg.state),
      [MessageType.OAUTH_SYNC]: (msg: any) => this.oauthService.syncPlatformData(msg.platform),
      [MessageType.OAUTH_GET_SYNC_INFO]: (msg: any) => this.oauthService.getSyncStatus(msg.platform),
      [MessageType.OAUTH_RESET_SYNC]: (msg: any) => this.oauthService.resetSyncInfo(msg.platform)
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const handler = messageHandlers[message.type as MessageType]
      if (handler) {
        handler(message)
          .then(result => sendResponse({ success: true, data: result }))
          .catch(error => sendResponse({ success: false, error: error.message }))
        return true
      }
    })
  }
}