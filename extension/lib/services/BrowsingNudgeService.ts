/**
 * BrowsingNudgeService
 *
 * Tracks URL visit count since last certification/cart action.
 * When threshold is reached, notifies the active tab's content script to show a nudge.
 * Counter stored in chrome.storage.session (resets on browser restart).
 *
 * Runs in background context (imported by messageHandlers).
 */

import { createServiceLogger } from "../utils/logger"

const logger = createServiceLogger("BrowsingNudge")

const STORAGE_KEY = "browsingNudgeCount"
export const NUDGE_URL_THRESHOLD = 15

class BrowsingNudgeServiceClass {
  async incrementAndCheck(): Promise<boolean> {
    try {
      const result = await chrome.storage.session.get(STORAGE_KEY)
      const count = (result[STORAGE_KEY] || 0) + 1
      await chrome.storage.session.set({ [STORAGE_KEY]: count })

      if (count >= NUDGE_URL_THRESHOLD) {
        logger.info("Nudge threshold reached", { count })
        this.sendToActiveTab()
        return true
      }
      return false
    } catch (error) {
      logger.error("Failed to increment nudge counter", { error })
      return false
    }
  }

  private async sendToActiveTab(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })
      if (tab?.id) {
        chrome.tabs
          .sendMessage(tab.id, { type: "BROWSING_NUDGE" })
          .catch(() => {})
      }
    } catch {
      // No active tab — ignore
    }
  }

  async resetCounter(): Promise<void> {
    try {
      await chrome.storage.session.set({ [STORAGE_KEY]: 0 })
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
}

export const browsingNudgeService = new BrowsingNudgeServiceClass()
export { BrowsingNudgeServiceClass }
