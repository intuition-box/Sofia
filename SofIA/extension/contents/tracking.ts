import type { PlasmoCSConfig } from "plasmo"
import type { PlasmoMessage } from "~types/messaging"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

// Variables globales pour le suivi
let pageLoadTime = Date.now()
let isPageVisible = true
let scrollCount = 0

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
  } catch {}
}

function testAndExtractData() {
  if (shouldIgnoreFrame()) return

  chrome.runtime
    .sendMessage({
      type: "TEST_MESSAGE",
      data: { url: window.location.href, title: document.title, timestamp: Date.now() }
    } as PlasmoMessage)
    .then(() => {
      setTimeout(() => extractRealData(), 500)
    })
    .catch(() => {
      setTimeout(() => extractRealData(), 1000)
    })
}

document.addEventListener("visibilitychange", async () => {
  if (shouldIgnoreFrame()) return

  if (document.visibilityState === "hidden" && isPageVisible) {
    const duration = Date.now() - pageLoadTime
    chrome.runtime.sendMessage({
      type: "PAGE_DURATION",
      data: {
        url: window.location.href,
        duration,
        timestamp: Date.now()
      },
      tabId: await getCurrentTabId()
    } as PlasmoMessage).catch(() => {})
    isPageVisible = false
  } else if (document.visibilityState === "visible" && !isPageVisible) {
    pageLoadTime = Date.now()
    isPageVisible = true
  }
})

// Scroll tracking
let scrollTimeout: NodeJS.Timeout
let lastScrollTime = Date.now()

window.addEventListener("scroll", () => {
  if (shouldIgnoreFrame()) return

  const now = Date.now()

  const deltaT = now - lastScrollTime
  lastScrollTime = now

  scrollCount++
  clearTimeout(scrollTimeout)

  scrollTimeout = setTimeout(() => {
    chrome.runtime.sendMessage({
      type: "SCROLL_DATA",
      data: {
        scrollY: window.scrollY,
        timestamp: Date.now(),
        url: window.location.href,
        scrollCount
      }
    } as PlasmoMessage).catch(() => {})
  }, 100)
})

let currentUrl = window.location.href
const observer = new MutationObserver(() => {
  if (shouldIgnoreFrame()) return

  if (window.location.href !== currentUrl) {
    const duration = Date.now() - pageLoadTime
    chrome.runtime.sendMessage({
      type: "PAGE_DURATION",
      data: {
        url: currentUrl,
        duration,
        timestamp: Date.now()
      },
      tabId: getCurrentTabId()
    } as PlasmoMessage).catch(() => {})

    currentUrl = window.location.href
    pageLoadTime = Date.now()
    scrollCount = 0
    setTimeout(testAndExtractData, 100)
  }
})

if (!shouldIgnoreFrame() && document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}

window.addEventListener("beforeunload", () => {
  if (shouldIgnoreFrame()) return

  const duration = Date.now() - pageLoadTime

  getCurrentTabId().then((tabId) => {
    chrome.runtime.sendMessage({
      type: "PAGE_DURATION",
      data: {
        url: window.location.href,
        duration,
        timestamp: Date.now()
      },
      tabId
    } as PlasmoMessage).catch(() => {})
  })
})

function startWhenReady() {
  if (shouldIgnoreFrame()) return

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(testAndExtractData, 100)
    })
  } else {
    setTimeout(testAndExtractData, 100)
  }
}

startWhenReady()

export {}
