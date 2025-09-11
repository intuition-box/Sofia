import type { PlasmoCSConfig } from "plasmo"
import type { PlasmoMessage } from "~types/messaging"
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

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
    console.error("Error checking tracking status:", error)
    return true // Default to enabled on error
  }
}

function shouldIgnoreFrame(): boolean {
  const url = window.location.href
  const hostname = window.location.hostname

  const ignoredDomains = [
    "googletagmanager.com",
    "doubleclick.net",
    "amazon-adsystem.com",
    "google.com/recaptcha",
    "adtrafficquality.google",
    "contextual.media.net",
    "rubiconproject.com",
    "pubmatic.com",
    "jscache.com",
    "indexww.com",
    "a-mo.net",
    "casalemedia.com"
  ]

  if (window !== window.top && ignoredDomains.some(domain => hostname.includes(domain))) {
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
  if (!(await isTrackingEnabled())) {
    console.log("🔒 Tracking disabled - PAGE_DATA not sent")
    return
  }

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
    chrome.runtime.sendMessage({
      type: "PAGE_DATA",
      data: pageData,
      tabId: await getCurrentTabId(),
      pageLoadTime: Date.now()
    } as PlasmoMessage)
  } catch (error) {
    console.error("Error sending PAGE_DATA:", error)
  }
}

function startWhenReady() {
  if (shouldIgnoreFrame()) {
    return
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(extractRealData, 1000)
    })
  } else {
    setTimeout(extractRealData, 1000)
  }
}

// Initialize tracking
startWhenReady()