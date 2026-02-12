/**
 * useFavicon Hook
 * Loads a favicon URL for a given page URL using Google's favicon service
 */

import { useState, useEffect } from "react"

export interface FaviconResult {
  faviconUrl: string | null
  faviconError: boolean
}

export const useFavicon = (url: string | null): FaviconResult => {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [faviconError, setFaviconError] = useState(false)

  useEffect(() => {
    if (!url) {
      setFaviconUrl(null)
      setFaviconError(false)
      return
    }

    try {
      const urlObj = new URL(url)
      const faviconPath = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
      setFaviconUrl(faviconPath)
      setFaviconError(false)
    } catch {
      setFaviconUrl(null)
      setFaviconError(true)
    }
  }, [url])

  return { faviconUrl, faviconError }
}
