/**
 * Service for handling page data processing
 * Manages PAGE_DATA and PAGE_DURATION message logic
 */

import { sanitizeUrl, isSensitiveUrl } from '../../background/utils/url'
import { sendToAgent, clearOldSentMessages } from '../../background/utils/buffer'
import { EXCLUDED_URL_PATTERNS } from '../../background/constants'
import { recordPageForIntention, getDomainIntentionStats } from '../../background/intentionRanking'
import { recordScroll, clearScrolls } from '../../background/behavior'
import type { PageData } from '../../background/types'
import type { ChromeMessage } from '../../types/messages'
import { createServiceLogger } from '../utils/logger'

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
   * Handle SCROLL_DATA message
   */
  public handleScrollData(message: ChromeMessage): void {
    if (message.data?.url && message.data?.timestamp) {
      recordScroll(message.data.url, message.data.timestamp)
    }
  }

  /**
   * Process page data inline (extracted from messageHandlers)
   */
  private async handlePageDataInline(data: PageData, pageLoadTime: number): Promise<void> {
    let parsedData: PageData

    try {
      parsedData = typeof data === "string" ? JSON.parse(data) : data

      if (typeof parsedData.attentionScore === "number") {
        // attentionText is calculated but not used in current implementation
      }
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

    // Format pour correspondre exactement aux exemples de SofIA.json
    const domain = new URL(parsedData.url).hostname.replace('www.', '')
    const domainStats = getDomainIntentionStats(domain)
    
    let message = `URL: ${sanitizeUrl(parsedData.url)}\\nTitle: ${parsedData.title.slice(0, 50)}`
    
    // Ajouter description si disponible
    if (parsedData.description) {
      message += `\\nDescription: ${parsedData.description.slice(0, 100)}`
    }
    
    // Calculate Attention Score and get suggested predicate from intentionRanking
    let finalAttentionScore = 0.3
    let suggestedPredicate = "have visited"
    
    if (domainStats) {
      // Map visitCount to Attention Score according to SofIA rules
      let calculatedScore = 0.3
      if (domainStats.visitCount >= 25) calculatedScore = 0.9  // → trust
      else if (domainStats.visitCount >= 15) calculatedScore = 0.8  // → love  
      else if (domainStats.visitCount >= 5) calculatedScore = 0.75  // → like
      else if (domainStats.visitCount >= 3) calculatedScore = 0.4   // → interested
      
      // Take the max between calculated score and real attention
      finalAttentionScore = Math.max(calculatedScore, domainStats.maxAttentionScore)
      
      // Get suggested predicate from intentionRanking system
      if (domainStats.suggestedUpgrade?.toPredicate) {
        suggestedPredicate = domainStats.suggestedUpgrade.toPredicate
      } else {
        // Fallback based on visit patterns if no suggestion
        if (domainStats.visitCount >= 25 && finalAttentionScore > 0.7) suggestedPredicate = "trust"
        else if (domainStats.visitCount >= 15 && finalAttentionScore > 0.7) suggestedPredicate = "love"
        else if (domainStats.visitCount >= 8) suggestedPredicate = "like"
        else if (domainStats.visitCount >= 4) suggestedPredicate = "are interested by"
      }
      
      logger.debug('Domain analysis', {
        domain,
        visits: domainStats.visitCount,
        score: finalAttentionScore,
        suggested: suggestedPredicate
      })
    }
    
    message += `\\nAttention Score: ${finalAttentionScore.toFixed(2)}`
    message += `\\nSuggested Predicate: ${suggestedPredicate}`

    logger.info('Page captured', { url: parsedData.url })

    clearScrolls(parsedData.url)
    sendToAgent(message)
    clearOldSentMessages()
    
    // Record page for intention ranking system
    recordPageForIntention(parsedData)
  }
}

// Export singleton instance
export const pageDataService = PageDataService.getInstance()