/**
 * Service for handling page data processing
 * Manages PAGE_DATA and PAGE_DURATION message logic
 */

import { isSensitiveUrl } from '../../background/utils/url'
import { EXCLUDED_URL_PATTERNS } from '../../background/constants'
import type { PageData } from '../../background/types'
import type { ChromeMessage } from '../../types/messages'
import { createServiceLogger } from '../utils/logger'
import { sessionTracker } from './SessionTracker'

const logger = createServiceLogger('PageDataService')

export class PageDataService {
  private static instance: PageDataService
  private pageDataBuffer = new Map<string, { data: PageData; loadTime: number }>()

  public static getInstance(): PageDataService {
    if (!PageDataService.instance) {
      PageDataService.instance = new PageDataService()
    }
    return PageDataService.instance
  }

  private constructor() {}

  /**
   * Handle PAGE_DATA message
   */
  public handlePageData(message: ChromeMessage): void {
    const url = message.data?.url
    if (!url) {
      logger.warn('PAGE_DATA sans URL')
      return
    }

    const loadTime = message.pageLoadTime || Date.now()
    this.pageDataBuffer.set(url, { data: message.data as PageData, loadTime })
    logger.debug('PAGE_DATA buffered', { url })
  }

  /**
   * Handle PAGE_DURATION message
   */
  public handlePageDuration(message: ChromeMessage): void {
    const url = message.data?.url
    const duration = message.data?.duration

    if (!url || !this.pageDataBuffer.has(url)) {
      logger.warn('PAGE_DURATION without PAGE_DATA', { url })
      return
    }

    const buffered = this.pageDataBuffer.get(url)!
    buffered.data.duration = duration
    this.handlePageDataInline(buffered.data, buffered.loadTime)
    this.pageDataBuffer.delete(url)
  }

  /**
   * Handle SCROLL_DATA message (no-op, scroll tracking removed)
   */
  public handleScrollData(_message: ChromeMessage): void {
    // Scroll tracking removed - keeping method for API compatibility
  }

  /**
   * Process page data inline (extracted from messageHandlers)
   */
  private async handlePageDataInline(data: PageData, pageLoadTime: number): Promise<void> {
    let parsedData: PageData

    try {
      parsedData = typeof data === "string" ? JSON.parse(data) : data

      parsedData.timestamp ??= pageLoadTime
      parsedData.ogType ??= "website"
      parsedData.title ??= "Non défini"
      parsedData.keywords ??= ""
      parsedData.description ??= ""
      parsedData.h1 ??= ""
    } catch (err) {
      logger.error('Unable to parse PAGE_DATA', { error: err, data })
      return
    }

    if (EXCLUDED_URL_PATTERNS.some(str => parsedData.url.toLowerCase().includes(str))) return
    if (isSensitiveUrl(parsedData.url)) {
      logger.info('Sensitive URL ignored', { url: parsedData.url })
      return
    }

    logger.info('Page captured', { url: parsedData.url })

    // Track URL for Intention Groups (SessionTracker → GroupManager)
    sessionTracker.trackUrl({
      url: parsedData.url,
      title: parsedData.title,
      duration: parsedData.duration || 0
    })
  }
}

// Export singleton instance
export const pageDataService = PageDataService.getInstance()
