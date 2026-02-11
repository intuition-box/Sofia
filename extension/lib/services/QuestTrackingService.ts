/**
 * QuestTrackingService
 * Centralized service for tracking quest-related events (streaks, Pulse usage)
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

  // Returns the Monday of current week in UTC
  private getMondayOfWeek(): string {
    const now = new Date()
    const day = now.getUTCDay()
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff))
    return monday.toISOString().split('T')[0]
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

  async getCurrentStreak(): Promise<number> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) return 0

    const key = this.getStorageKey('signal_activity_dates', walletAddress)
    const result = await chrome.storage.local.get(key)
    const signal_activity_dates = result[key] || []

    if (signal_activity_dates.length === 0) return 0

    const sorted = [...signal_activity_dates].sort().reverse()
    const today = this.getToday()
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // Streak is broken if no activity today or yesterday
    if (sorted[0] !== today && sorted[0] !== yesterday) return 0

    let streak = 0
    let expected = sorted[0] === today ? today : yesterday

    for (const date of sorted) {
      if (date === expected) {
        streak++
        const d = new Date(expected + 'T00:00:00Z')
        d.setUTCDate(d.getUTCDate() - 1)
        expected = d.toISOString().split('T')[0]
      } else if (date < expected) {
        break
      }
    }
    return streak
  }

  async recordPulseLaunch(): Promise<void> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) {
      logger.warn('No wallet connected, cannot record pulse launch')
      return
    }

    await this.resetWeeklyIfNeeded(walletAddress)

    const pulseLaunchesKey = this.getStorageKey('pulse_launches', walletAddress)
    const weeklyPulseUsesKey = this.getStorageKey('weekly_pulse_uses', walletAddress)

    const result = await chrome.storage.local.get([pulseLaunchesKey, weeklyPulseUsesKey])
    const pulse_launches = result[pulseLaunchesKey] || 0
    const weekly_pulse_uses = result[weeklyPulseUsesKey] || 0

    await chrome.storage.local.set({
      [pulseLaunchesKey]: pulse_launches + 1,
      [weeklyPulseUsesKey]: weekly_pulse_uses + 1
    })
  }

  async getPulseStats(): Promise<{ total: number; weekly: number }> {
    const walletAddress = await this.getWalletAddress()
    if (!walletAddress) return { total: 0, weekly: 0 }

    await this.resetWeeklyIfNeeded(walletAddress)

    const pulseLaunchesKey = this.getStorageKey('pulse_launches', walletAddress)
    const weeklyPulseUsesKey = this.getStorageKey('weekly_pulse_uses', walletAddress)

    const result = await chrome.storage.local.get([pulseLaunchesKey, weeklyPulseUsesKey])
    return {
      total: result[pulseLaunchesKey] || 0,
      weekly: result[weeklyPulseUsesKey] || 0
    }
  }

  private async resetWeeklyIfNeeded(walletAddress: string): Promise<void> {
    const monday = this.getMondayOfWeek()
    const weeklyPulseStartKey = this.getStorageKey('weekly_pulse_start', walletAddress)
    const weeklyPulseUsesKey = this.getStorageKey('weekly_pulse_uses', walletAddress)

    const result = await chrome.storage.local.get(weeklyPulseStartKey)
    if (result[weeklyPulseStartKey] !== monday) {
      await chrome.storage.local.set({
        [weeklyPulseUsesKey]: 0,
        [weeklyPulseStartKey]: monday
      })
    }
  }
}

export const questTrackingService = QuestTrackingService.getInstance()
