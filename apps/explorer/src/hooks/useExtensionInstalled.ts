import { useEffect, useState } from 'react'

/**
 * Detect whether the Sofia browser extension is installed.
 *
 * The extension's content script sets
 * `document.documentElement.dataset.sofiaExtension = "true"` on every
 * page it loads on (see apps/extension/contents/tracking.ts and the
 * companion utility in src/utils/sofiaDetect.ts). We mirror that
 * marker into React state and observe further mutations so the value
 * becomes reactive — covers the case where the extension is enabled
 * after the explorer tab is already open.
 */
export function useExtensionInstalled(): boolean {
  const [installed, setInstalled] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.dataset.sofiaExtension === 'true'
  })

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const read = () => {
      setInstalled(root.dataset.sofiaExtension === 'true')
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-sofia-extension'],
    })
    return () => observer.disconnect()
  }, [])

  return installed
}
