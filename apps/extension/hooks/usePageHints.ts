/**
 * usePageHints — the active tab's metadata (title, description, keywords…),
 * read again whenever the page changes. Feeds the tag suggestions.
 */
import { useEffect, useState } from "react"

import { readActiveTabMetadata } from "~/lib/addToSofia/pageMetadata"

export function usePageHints(currentUrl: string | null): string {
  const [hints, setHints] = useState("")

  useEffect(() => {
    if (!currentUrl) {
      setHints("")
      return
    }
    let cancelled = false
    void readActiveTabMetadata().then((text) => {
      if (!cancelled) setHints(text)
    })
    return () => {
      cancelled = true
    }
  }, [currentUrl])

  return hints
}
