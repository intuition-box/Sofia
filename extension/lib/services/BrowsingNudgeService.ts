/**
 * BrowsingNudgeService
 *
 * Tracks URL visit count since last certification/cart action.
 * When threshold is reached, notifies the active tab's content script to show a nudge.
 * Counter stored in chrome.storage.session (resets on browser restart).
 *
 * The nudge persists across tab switches: when the user activates a new tab
 * while a nudge is pending, the nudge is re-sent to the new tab.
 *
 * Runs in background context (imported by messageHandlers).
 */

import { createServiceLogger } from "../utils/logger"

const logger = createServiceLogger("BrowsingNudge")

const STORAGE_KEY = "browsingNudgeCount"
const NUDGE_ACTIVE_KEY = "browsingNudgeActive"
export const NUDGE_URL_THRESHOLD = 15
const STARTUP_GRACE_PERIOD_MS = 30_000

class BrowsingNudgeServiceClass {
  private startupTime = Date.now()

  constructor() {
    this.listenTabActivation()
  }

  async incrementAndCheck(): Promise<boolean> {
    try {
      if (Date.now() - this.startupTime < STARTUP_GRACE_PERIOD_MS) {
        logger.debug("Ignoring URL during startup grace period")
        return false
      }

      const result = await chrome.storage.session.get(STORAGE_KEY)
      const count = (result[STORAGE_KEY] || 0) + 1
      await chrome.storage.session.set({ [STORAGE_KEY]: count })

      if (count >= NUDGE_URL_THRESHOLD) {
        logger.info("Nudge threshold reached", { count })
        await chrome.storage.session.set({ [NUDGE_ACTIVE_KEY]: count })
        this.sendToActiveTab(count)
        return true
      }
      return false
    } catch (error) {
      logger.error("Failed to increment nudge counter", { error })
      return false
    }
  }

  private async sendToActiveTab(count: number): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })
      if (tab?.id) {
        chrome.tabs
          .sendMessage(tab.id, { type: "BROWSING_NUDGE", count })
          .catch(() => {})
      }
    } catch {
      // No active tab — ignore
    }
  }

  async resetCounter(): Promise<void> {
    try {
      await chrome.storage.session.set({
        [STORAGE_KEY]: 0,
        [NUDGE_ACTIVE_KEY]: 0
      })
      logger.debug("Nudge counter reset")
    } catch (error) {
      logger.error("Failed to reset nudge counter", { error })
    }
  }

  async checkThreshold(): Promise<boolean> {
    try {
      const result = await chrome.storage.session.get(STORAGE_KEY)
      return (result[STORAGE_KEY] || 0) >= NUDGE_URL_THRESHOLD
    } catch {
      return false
    }
  }

  private listenTabActivation(): void {
    chrome.tabs.onActivated.addListener(async () => {
      try {
        const result = await chrome.storage.session.get(NUDGE_ACTIVE_KEY)
        const count = result[NUDGE_ACTIVE_KEY] || 0
        if (count > 0) {
          this.sendToActiveTab(count)
        }
      } catch {
        // ignore
      }
    })
  }
}

export const browsingNudgeService = new BrowsingNudgeServiceClass()
export { BrowsingNudgeServiceClass }
