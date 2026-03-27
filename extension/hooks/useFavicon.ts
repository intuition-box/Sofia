/**
 * useFavicon Hook
 * Loads a favicon URL for a given page URL using Google's favicon service
 */

import { useState, useEffect } from "react"
import { getFaviconUrl } from "~/lib/utils"

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

    const result = getFaviconUrl(url, 32)
    if (result) {
      setFaviconUrl(result)
      setFaviconError(false)
    } else {
      setFaviconUrl(null)
      setFaviconError(true)
    }
  }, [url])

  return { faviconUrl, faviconError }
}
