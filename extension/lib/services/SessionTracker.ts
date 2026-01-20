/**
 * SessionTracker Service
 * Buffers URL visits and flushes them to GroupManager when threshold is reached
 */

import { groupManager } from './GroupManager'

export interface TrackedUrl {
  url: string
  title: string
  domain: string
  favicon?: string
  duration: number
  visitedAt: number
}

export interface DomainCluster {
  domain: string
  urls: TrackedUrl[]
  totalDuration: number
}

// Configuration
const BUFFER_SIZE_THRESHOLD = 15  // Flush after 15 URLs
const BUFFER_TIME_THRESHOLD = 30 * 60 * 1000  // Or after 30 minutes

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return 'unknown'
  }
}

/**
 * SessionTracker - Singleton service for tracking URL visits
 */
class SessionTrackerService {
  private buffer: TrackedUrl[] = []
  private lastFlushTime: number = Date.now()
  private flushCallback: ((clusters: DomainCluster[]) => Promise<void>) | null = null

  /**
   * Set callback to be called when buffer is flushed
   */
  setFlushCallback(callback: (clusters: DomainCluster[]) => Promise<void>): void {
    this.flushCallback = callback
  }

  /**
   * Track a URL visit
   */
  trackUrl(data: { url: string; title: string; duration?: number; favicon?: string }): void {
    const domain = extractDomain(data.url)

    // Skip internal/extension URLs
    if (domain === 'unknown' || data.url.startsWith('chrome://') || data.url.startsWith('chrome-extension://')) {
      return
    }

    const trackedUrl: TrackedUrl = {
      url: data.url,
      title: data.title || data.url,
      domain,
      favicon: data.favicon,
      duration: data.duration || 0,
      visitedAt: Date.now()
    }

    // Check if URL already exists in buffer (update duration instead of adding duplicate)
    const existingIndex = this.buffer.findIndex(u => u.url === data.url)
    if (existingIndex !== -1) {
      this.buffer[existingIndex].duration += trackedUrl.duration
      this.buffer[existingIndex].visitedAt = trackedUrl.visitedAt
      console.log(`📊 [SessionTracker] Updated URL duration: ${data.url}`)
    } else {
      this.buffer.push(trackedUrl)
      console.log(`📊 [SessionTracker] Tracked URL: ${data.url} (buffer: ${this.buffer.length}/${BUFFER_SIZE_THRESHOLD})`)
    }

    // Check if we should flush
    this.checkFlushConditions()
  }

  /**
   * Check if flush conditions are met
   */
  private checkFlushConditions(): void {
    const shouldFlushBySize = this.buffer.length >= BUFFER_SIZE_THRESHOLD
    const shouldFlushByTime = Date.now() - this.lastFlushTime >= BUFFER_TIME_THRESHOLD

    if (shouldFlushBySize || shouldFlushByTime) {
      console.log(`🔄 [SessionTracker] Flush triggered (size: ${shouldFlushBySize}, time: ${shouldFlushByTime})`)
      this.flush()
    }
  }

  /**
   * Group URLs by domain
   */
  private groupByDomain(urls: TrackedUrl[]): DomainCluster[] {
    const domainMap = new Map<string, TrackedUrl[]>()

    for (const url of urls) {
      const existing = domainMap.get(url.domain) || []
      existing.push(url)
      domainMap.set(url.domain, existing)
    }

    const clusters: DomainCluster[] = []
    for (const [domain, domainUrls] of domainMap) {
      clusters.push({
        domain,
        urls: domainUrls,
        totalDuration: domainUrls.reduce((sum, u) => sum + u.duration, 0)
      })
    }

    return clusters
  }

  /**
   * Flush the buffer and return domain clusters
   */
  async flush(): Promise<DomainCluster[]> {
    if (this.buffer.length === 0) {
      console.log('📭 [SessionTracker] Buffer empty, nothing to flush')
      return []
    }

    const urlsToFlush = [...this.buffer]
    this.buffer = []
    this.lastFlushTime = Date.now()

    const clusters = this.groupByDomain(urlsToFlush)
    console.log(`🚀 [SessionTracker] Flushed ${urlsToFlush.length} URLs into ${clusters.length} domain clusters`)

    // Call the flush callback if set, otherwise use GroupManager directly
    if (this.flushCallback) {
      try {
        await this.flushCallback(clusters)
      } catch (error) {
        console.error('❌ [SessionTracker] Flush callback error:', error)
      }
    } else {
      // Default: send to GroupManager
      try {
        await groupManager.processFlush(clusters)
      } catch (error) {
        console.error('❌ [SessionTracker] GroupManager.processFlush error:', error)
      }
    }

    return clusters
  }

  /**
   * Force flush (for manual triggering)
   */
  async forceFlush(): Promise<DomainCluster[]> {
    console.log('⚡ [SessionTracker] Force flush requested')
    return this.flush()
  }

  /**
   * Get current buffer state (for debugging)
   */
  getBufferState(): { count: number; urls: TrackedUrl[]; timeSinceLastFlush: number } {
    return {
      count: this.buffer.length,
      urls: [...this.buffer],
      timeSinceLastFlush: Date.now() - this.lastFlushTime
    }
  }

  /**
   * Clear the buffer without flushing
   */
  clearBuffer(): void {
    this.buffer = []
    this.lastFlushTime = Date.now()
    console.log('🧹 [SessionTracker] Buffer cleared')
  }
}

// Singleton instance
export const sessionTracker = new SessionTrackerService()

// Export class for testing
export { SessionTrackerService }
