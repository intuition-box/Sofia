/**
 * QuestTrackingService
 * Centralized service for tracking quest-related events (streaks, certifications, votes)
 * Data is stored per-wallet to isolate user identities
 */

import { getAddress } from 'viem'
import { createServiceLogger } from '../utils/logger'

const logger = createServiceLogger('QuestTrackingService')

export class QuestTrackingService {
  private static instance: QuestTrackingService

  static getInstance(): QuestTrackingService {
    if (!QuestTrackingService.instance) {
      QuestTrackingService.instance = new QuestTrackingService()
    }
    return QuestTrackingService.instance
  }

  /**
   * Get current wallet address from session storage (checksummed)
   */
  private async getWalletAddress(): Promise<string | null> {
    const result = await chrome.storage.session.get('walletAddress')
    if (!result.walletAddress) return null
    // Always return checksummed address for consistent storage keys
    return getAddress(result.walletAddress)
  }

  /**
   * Generate storage key with wallet address suffix
   */
  private getStorageKey(baseKey: string, walletAddress: string): string {
    return `${baseKey}_${walletAddress}`
  }

  // Returns YYYY-MM-DD in UTC
  private getToday(): string {
    return new Date().toISOString().split('T')[0]
  }

  // Called after each successful publish
  async recordSignalActivity(): Promise<void> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) {
      logger.warn('No wallet connected, cannot record signal activity')
      return
    }

    const key = this.getStorageKey('signal_activity_dates', walletAddress)
    const today = this.getToday()
    const result = await chrome.storage.local.get(key)
    const signal_activity_dates = result[key] || []

    if (!signal_activity_dates.includes(today)) {
      signal_activity_dates.push(today)
      // Keep only last 120 days
      const cutoff = new Date(Date.now() - 120 * 86400000).toISOString().split('T')[0]
      await chrome.storage.local.set({
        [key]: signal_activity_dates.filter((d: string) => d >= cutoff)
      })
    }
  }

  async hasSignalToday(): Promise<boolean> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) return false

    const key = this.getStorageKey('signal_activity_dates', walletAddress)
    const result = await chrome.storage.local.get(key)
    const signal_activity_dates = result[key] || []
    return signal_activity_dates.includes(this.getToday())
  }

  // Called after each successful certification
  async recordCertificationActivity(): Promise<void> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) {
      logger.warn('No wallet connected, cannot record certification activity')
      return
    }

    const key = this.getStorageKey('certification_activity_dates', walletAddress)
    const today = this.getToday()
    const result = await chrome.storage.local.get(key)
    const certification_activity_dates = result[key] || []

    if (!certification_activity_dates.includes(today)) {
      certification_activity_dates.push(today)
      // Keep only last 120 days
      const cutoff = new Date(Date.now() - 120 * 86400000).toISOString().split('T')[0]
      await chrome.storage.local.set({
        [key]: certification_activity_dates.filter((d: string) => d >= cutoff)
      })
    }
  }

  async hasCertificationToday(): Promise<boolean> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) return false

    const key = this.getStorageKey('certification_activity_dates', walletAddress)
    const result = await chrome.storage.local.get(key)
    const certification_activity_dates = result[key] || []
    return certification_activity_dates.includes(this.getToday())
  }

  // ── Vote tracking ──

  async recordVoteActivity(): Promise<void> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) {
      logger.warn('No wallet connected, cannot record vote activity')
      return
    }

    const today = this.getToday()

    // Record vote date for streak calculation
    const dateKey = this.getStorageKey('vote_activity_dates', walletAddress)
    const dateResult = await chrome.storage.local.get(dateKey)
    const vote_activity_dates = dateResult[dateKey] || []

    if (!vote_activity_dates.includes(today)) {
      vote_activity_dates.push(today)
      const cutoff = new Date(Date.now() - 120 * 86400000).toISOString().split('T')[0]
      await chrome.storage.local.set({
        [dateKey]: vote_activity_dates.filter((d: string) => d >= cutoff)
      })
    }

    // Increment total vote count
    const totalKey = this.getStorageKey('total_votes', walletAddress)
    const totalResult = await chrome.storage.local.get(totalKey)
    const totalVotes = totalResult[totalKey] || 0
    await chrome.storage.local.set({ [totalKey]: totalVotes + 1 })

    // Increment daily vote count (for Gold cap)
    const dailyCountKey = this.getStorageKey('daily_vote_count', walletAddress)
    const dailyDateKey = this.getStorageKey('daily_vote_date', walletAddress)
    const dailyResult = await chrome.storage.local.get([dailyCountKey, dailyDateKey])

    if (dailyResult[dailyDateKey] === today) {
      await chrome.storage.local.set({ [dailyCountKey]: (dailyResult[dailyCountKey] || 0) + 1 })
    } else {
      await chrome.storage.local.set({ [dailyCountKey]: 1, [dailyDateKey]: today })
    }
  }

  async hasVotedToday(): Promise<boolean> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) return false

    const key = this.getStorageKey('vote_activity_dates', walletAddress)
    const result = await chrome.storage.local.get(key)
    const vote_activity_dates = result[key] || []
    return vote_activity_dates.includes(this.getToday())
  }

  async getTotalVotes(): Promise<number> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) return 0

    const key = this.getStorageKey('total_votes', walletAddress)
    const result = await chrome.storage.local.get(key)
    return result[key] || 0
  }

  async getDailyVoteCount(): Promise<number> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) return 0

    const dailyCountKey = this.getStorageKey('daily_vote_count', walletAddress)
    const dailyDateKey = this.getStorageKey('daily_vote_date', walletAddress)
    const result = await chrome.storage.local.get([dailyCountKey, dailyDateKey])

    if (result[dailyDateKey] !== this.getToday()) return 0
    return result[dailyCountKey] || 0
  }

}

export const questTrackingService = QuestTrackingService.getInstance()
