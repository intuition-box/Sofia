/**
 * Service for pulse analysis operations
 * Handles tab data collection and analysis
 */

import { sendMessage } from '../../background/websocket'
import type { MessageResponse } from '../../types/messages'
import { createServiceLogger } from '../utils/logger'

const logger = createServiceLogger('PulseService')

export class PulseService {
  private static instance: PulseService

  public static getInstance(): PulseService {
    if (!PulseService.instance) {
      PulseService.instance = new PulseService()
    }
    return PulseService.instance
  }

  private constructor() {}

  /**
   * Handle pulse analysis request
   */
  public async handlePulseAnalysis(sendResponse: (response: MessageResponse) => void): Promise<void> {
    try {
      logger.info('Starting pulse analysis of all tabs')
      
      // Get all tabs
      const tabs = await chrome.tabs.query({})
      logger.debug('Found tabs to analyze', { count: tabs.length })
      
      const pulseData: any[] = []
      
      // Collect data directly from tabs using Chrome API
      for (const tab of tabs) {
        if (!tab.id || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
          continue
        }
        
        try {
          logger.debug('Collecting from tab', { tabId: tab.id, url: tab.url })
          
          // Extract data directly from tab object
          const tabData = {
            url: tab.url,
            title: tab.title || '',
            keywords: '', // Can't get meta keywords without content script
            description: '',
            timestamp: Date.now(),
            tabId: tab.id,
            favIconUrl: tab.favIconUrl
          }
          
          pulseData.push(tabData)
          logger.debug('Collected data from tab', { title: tabData.title })
          
        } catch (error) {
          logger.warn('Skipped tab', { tabId: tab.id, error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }
      
      logger.info('Collected pulse data', { count: pulseData.length })
      
      if (pulseData.length === 0) {
        sendResponse({ 
          success: false, 
          error: "No tabs found for pulse analysis." 
        })
        return
      }
      
      // Send to PulseAgent
      const result = await this.sendPulseDataToAgent(pulseData)
      sendResponse(result)
      
    } catch (error) {
      logger.error('Pulse analysis failed', error)
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }

  /**
   * Send pulse data to PulseAgent
   */
  private async sendPulseDataToAgent(pulseData: any[]): Promise<MessageResponse> {
    // Clean data to avoid cyclic references
    const cleanData = pulseData.map(data => ({
      url: data.url || '',
      title: data.title || '',
      keywords: data.keywords || '',
      description: data.description || '',
      timestamp: data.timestamp || Date.now()
    }))

    logger.debug('Sending to PulseAgent', {
      totalTabs: cleanData.length,
      sampleData: cleanData.slice(0, 2).map(d => ({
        url: d.url,
        title: d.title.slice(0, 30),
        keywordsCount: d.keywords.length
      }))
    })

    try {
      // Send to PulseAgent via unified sendMessage
      const message = `Analyze current pulse data:\n${JSON.stringify(cleanData)}`
      await sendMessage('PULSEAGENT', message)

      logger.info('Successfully sent to PulseAgent')
      return {
        success: true,
        message: `✅ Pulse analysis completed! Collected data from ${cleanData.length} tabs and sent to PulseAgent.`
      }

    } catch (error) {
      logger.error('Failed to send to PulseAgent', error)
      return {
        success: false,
        message: `❌ Failed to send pulse data: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

// Export singleton instance
export const pulseService = PulseService.getInstance()