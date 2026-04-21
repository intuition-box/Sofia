import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"
import { EXCLUDED_URL_PATTERNS, RESTRICTED_DOMAINS } from "../background/constants"
import { createServiceLogger } from "../lib/utils/logger"

const storage = new Storage()
const logger = createServiceLogger('Tracking')

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

// Function to check if tracking is enabled
async function isTrackingEnabled(): Promise<boolean> {
  try {
    const enabled: boolean | string | null = await storage.get("tracking_enabled")
    // Handle different possible types
    if (enabled === false || enabled === "false") {
      return false
    }
    // Default to true if not set or any other value
    return true
  } catch (error) {
    logger.error("Error checking tracking status", error)
    return true // Default to enabled on error
  }
}

function shouldIgnoreFrame(): boolean {
  const url = window.location.href
  const hostname = window.location.hostname

  if (window !== window.top && (
    EXCLUDED_URL_PATTERNS.some(pattern => hostname.includes(pattern) || url.includes(pattern)) ||
    RESTRICTED_DOMAINS.some(domain => hostname.includes(domain))
  )) {
    return true
  }

  if (url.length > 200) {
    return true
  }

  return false
}

async function getCurrentTabId(): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage({ type: "GET_TAB_ID" }, (response) => {
        if (chrome.runtime.lastError || !response?.tabId) {
          return reject("Impossible d'obtenir le tabId")
        }
        resolve(response.tabId)
      })
    } catch (err) {
      reject(err)
    }
  })
}

async function extractRealData() {
  const enabled = await isTrackingEnabled()
  logger.debug("Tracking enabled check", { enabled })
  
  if (!enabled) {
    logger.info("Tracking disabled - PAGE_DATA not sent")
    return
  }
  
  logger.info("Tracking active - extracting page data")

  const title = document.title || ""
  const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute("content") || ""
  const description = document.querySelector('meta[name="description"]')?.getAttribute("content") || ""
  const ogType = document.querySelector('meta[property="og:type"]')?.getAttribute("content") || ""
  const h1 = document.querySelector("h1")?.textContent?.trim() || ""

  const pageData = {
    title,
    keywords,
    description,
    ogType,
    h1,
    url: window.location.href,
    timestamp: Date.now()
  }

  try {
    logger.debug("Sending PAGE_DATA", pageData)
    chrome.runtime.sendMessage({
      type: "PAGE_DATA",
      data: pageData,
      tabId: await getCurrentTabId(),
      pageLoadTime: Date.now()
    })
    logger.info("PAGE_DATA sent successfully")
  } catch (error) {
    logger.error("Error sending PAGE_DATA", error)
  }
}

function startWhenReady() {
  logger.info("startWhenReady called", { url: window.location.href })
  
  if (shouldIgnoreFrame()) {
    logger.debug("Frame ignored", { hostname: window.location.hostname })
    return
  }

  logger.debug("Document ready state", { readyState: document.readyState })
  
  if (document.readyState === "loading") {
    logger.debug("Waiting for DOMContentLoaded")
    document.addEventListener("DOMContentLoaded", () => {
      logger.debug("DOMContentLoaded - starting extraction in 1s")
      setTimeout(extractRealData, 1000)
    })
  } else {
    logger.debug("DOM ready - starting extraction in 1s")
    setTimeout(extractRealData, 1000)
  }
}

// Variables for duration tracking
let pageStartTime = Date.now()
let trackingTimerId: ReturnType<typeof setTimeout> | null = null
let hasTrackedUrl = false

// Minimum time on page before tracking (3 seconds)
const MIN_TIME_BEFORE_TRACK = 3000

// Track URL for Intention Groups after minimum time
async function trackUrlAfterDelay() {
  if (hasTrackedUrl) return

  const enabled = await isTrackingEnabled()
  if (!enabled) return

  if (shouldIgnoreFrame()) return

  hasTrackedUrl = true
  const url = window.location.href
  const title = document.title || url

  logger.info("Tracking URL after 3s", { url })

  try {
    chrome.runtime.sendMessage({
      type: "TRACK_URL",
      data: {
        url,
        title,
        duration: Date.now() - pageStartTime
      }
    })
  } catch (error) {
    logger.error("Error tracking URL", error)
  }
}

// Start tracking timer when page loads
function startTrackingTimer() {
  if (trackingTimerId) {
    clearTimeout(trackingTimerId)
  }
  hasTrackedUrl = false
  pageStartTime = Date.now()

  trackingTimerId = setTimeout(trackUrlAfterDelay, MIN_TIME_BEFORE_TRACK)
}

// Track page duration on visibility change or before unload
async function sendPageDuration() {
  const duration = Date.now() - pageStartTime
  const url = window.location.href
  logger.debug("Sending PAGE_DURATION", { duration, url })

  try {
    chrome.runtime.sendMessage({
      type: "PAGE_DURATION",
      data: { duration, url }
    })
    logger.info("PAGE_DURATION sent", { url, duration })
  } catch (error) {
    logger.error("Error sending PAGE_DURATION", error)
  }
}

// Send duration when page becomes hidden or user leaves
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    logger.debug("Page hidden - sending duration")
    sendPageDuration()
    // Also track URL if user stayed long enough
    if (Date.now() - pageStartTime >= MIN_TIME_BEFORE_TRACK) {
      trackUrlAfterDelay()
    }
  }
})

// Send duration before page unloads
window.addEventListener("beforeunload", () => {
  logger.debug("Page unloading - sending duration")
  sendPageDuration()
})

// Track URL changes in SPAs (like GitHub)
let lastTrackedUrl = window.location.href

function checkUrlChange() {
  const currentUrl = window.location.href
  if (currentUrl !== lastTrackedUrl) {
    logger.info("SPA navigation detected", { url: currentUrl })
    lastTrackedUrl = currentUrl
    startTrackingTimer()
  }
}

// Check for URL changes periodically (for SPAs)
setInterval(checkUrlChange, 1000)

// Initialize tracking
startWhenReady()
startTrackingTimer()