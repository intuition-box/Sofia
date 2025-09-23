/**
 * Service for Theme Extraction operations
 * Centralizes WebSocket communication with ThemeExtractor agent
 */

import { THEMEEXTRACTOR_IDS } from '../../background/constants'

interface ThemeExtractionResult {
  success: boolean
  themes: any[]
  message: string
}

export class ThemeExtractorService {
  private static instance: ThemeExtractorService
  private socket: any = null
  private isProcessing = false
  private globalHandler: ((themes: any) => void) | null = null
  private readonly TIMEOUT = 600000 // 10 minutes

  public static getInstance(): ThemeExtractorService {
    if (!ThemeExtractorService.instance) {
      ThemeExtractorService.instance = new ThemeExtractorService()
    }
    return ThemeExtractorService.instance
  }

  private constructor() {}

  public setSocket(socket: any): void {
    this.socket = socket
  }

  public handleResponse(rawData: any): void {
    if (this.globalHandler) {
      // Parse themes from agent response format [{"themes": [...]}]
      let themes = []
      if (Array.isArray(rawData) && rawData.length > 0 && rawData[0].themes) {
        themes = rawData[0].themes
      } else if (rawData?.themes) {
        themes = rawData.themes
      }
      
      console.log('🎨 Extracted themes:', themes.length, 'themes found')
      this.globalHandler(themes)
      this.globalHandler = null
    }
  }

  public async extractThemes(urls: string[], type: 'bookmark' | 'history' = 'bookmark'): Promise<ThemeExtractionResult> {
    if (this.isProcessing) {
      throw new Error(`${type} ThemeExtractor processing already in progress`)
    }

    if (!this.socket?.connected) {
      throw new Error('ThemeExtractor socket not connected')
    }

    this.isProcessing = true
    console.log(`🎨 Starting ${type} theme extraction:`, urls.length, 'URLs')

    try {
      const themes = await this.sendForThemes(urls, type)
      console.log(`✅ ${type} theme extraction completed:`, themes.length, 'themes')
      
      return {
        success: true,
        themes,
        message: `Successfully extracted themes from ${urls.length} ${type} URLs`
      }

    } catch (error) {
      console.error(`❌ ${type} theme extraction failed:`, error)
      throw error
    } finally {
      this.isProcessing = false
    }
  }

  private async sendForThemes(urls: string[], type: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for themes from ${type}`))
      }, this.TIMEOUT)

      const payload = {
        type: 2,
        payload: {
          senderId: THEMEEXTRACTOR_IDS.AUTHOR_ID,
          senderName: "Extension",
          message: JSON.stringify({ urls }),
          messageId: this.generateUUID(),
          roomId: THEMEEXTRACTOR_IDS.ROOM_ID,
          channelId: THEMEEXTRACTOR_IDS.CHANNEL_ID,
          serverId: THEMEEXTRACTOR_IDS.SERVER_ID,
          source: "theme-extraction",
          attachments: [],
          metadata: {
            channelType: "DM",
            isDm: true,
            targetUserId: THEMEEXTRACTOR_IDS.AGENT_ID
          }
        }
      }

      // Store resolver for when themes come back
      this.globalHandler = (themes) => {
        clearTimeout(timeout)
        resolve(themes || [])
      }
      
      this.socket.emit("message", payload)
      console.log(`📤 Sent ${type} request with ${urls.length} URLs`)
    })
  }

  private generateUUID(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0
        const v = c === "x" ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
  }
}

// Export singleton instance
export const themeExtractorService = ThemeExtractorService.getInstance()