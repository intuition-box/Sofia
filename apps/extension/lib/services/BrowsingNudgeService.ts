/**
 * BrowsingNudgeService
 *
 * Tracks URL visit count since last certification/cart action.
 * When the threshold is reached, surfaces a red numbered badge on the
 * extension icon (via BadgeService) instead of an in-page overlay.
 * Counter stored in chrome.storage.session (resets on browser restart).
 *
 * Runs in background context (imported by messageHandlers).
 */

import { createServiceLogger } from "../utils/logger"
import { badgeService } from "./BadgeService"

const logger = createServiceLogger("BrowsingNudge")

const STORAGE_KEY = "browsingNudgeCount"
const NUDGE_ACTIVE_KEY = "browsingNudgeActive"
export const NUDGE_URL_THRESHOLD = 15
const STARTUP_GRACE_PERIOD_MS = 30_000

class BrowsingNudgeServiceClass {
  private startupTime = Date.now()

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
        await badgeService.refreshBadge()
        return true
      }
      return false
    } catch (error) {
      logger.error("Failed to increment nudge counter", { error })
      return false
    }
  }

  async resetCounter(): Promise<void> {
    try {
      await chrome.storage.session.set({
        [STORAGE_KEY]: 0,
        [NUDGE_ACTIVE_KEY]: 0
      })
      await badgeService.refreshBadge()
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
