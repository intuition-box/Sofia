/**
 * QuestTrackingService
 * Centralized service for tracking quest-related events (streaks, Pulse usage)
 */

export class QuestTrackingService {
  private static instance: QuestTrackingService

  static getInstance(): QuestTrackingService {
    if (!QuestTrackingService.instance) {
      QuestTrackingService.instance = new QuestTrackingService()
    }
    return QuestTrackingService.instance
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
    const today = this.getToday()
    const { signal_activity_dates = [] } = await chrome.storage.local.get('signal_activity_dates')
    if (!signal_activity_dates.includes(today)) {
      signal_activity_dates.push(today)
      // Keep only last 120 days
      const cutoff = new Date(Date.now() - 120 * 86400000).toISOString().split('T')[0]
      await chrome.storage.local.set({
        signal_activity_dates: signal_activity_dates.filter((d: string) => d >= cutoff)
      })
    }
  }

  async hasSignalToday(): Promise<boolean> {
    const { signal_activity_dates = [] } = await chrome.storage.local.get('signal_activity_dates')
    return signal_activity_dates.includes(this.getToday())
  }

  async getCurrentStreak(): Promise<number> {
    const { signal_activity_dates = [] } = await chrome.storage.local.get('signal_activity_dates')
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
    await this.resetWeeklyIfNeeded()
    const { pulse_launches = 0, weekly_pulse_uses = 0 } =
      await chrome.storage.local.get(['pulse_launches', 'weekly_pulse_uses'])
    await chrome.storage.local.set({
      pulse_launches: pulse_launches + 1,
      weekly_pulse_uses: weekly_pulse_uses + 1
    })
  }

  async getPulseStats(): Promise<{ total: number; weekly: number }> {
    await this.resetWeeklyIfNeeded()
    const { pulse_launches = 0, weekly_pulse_uses = 0 } =
      await chrome.storage.local.get(['pulse_launches', 'weekly_pulse_uses'])
    return { total: pulse_launches, weekly: weekly_pulse_uses }
  }

  private async resetWeeklyIfNeeded(): Promise<void> {
    const monday = this.getMondayOfWeek()
    const { weekly_pulse_start } = await chrome.storage.local.get('weekly_pulse_start')
    if (weekly_pulse_start !== monday) {
      await chrome.storage.local.set({
        weekly_pulse_uses: 0,
        weekly_pulse_start: monday
      })
    }
  }
}

export const questTrackingService = QuestTrackingService.getInstance()
