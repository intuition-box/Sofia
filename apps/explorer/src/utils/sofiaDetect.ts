/**
 * Detect if the Sofia Chrome extension is installed.
 *
 * The extension's content script (tracking.ts) sets
 * `document.documentElement.dataset.sofiaExtension = "true"`
 * on every page it loads on — including this dashboard.
 *
 * When Sofia is installed, getCertifyUrl appends ?sofia_certify=true
 * to the platform URL. The content script detects this param,
 * cleans the URL, and auto-opens the Sofia side panel.
 */

// TODO: replace with real Chrome Web Store URL once published
const CHROME_STORE_URL =
  'https://chromewebstore.google.com/detail/sofia'

function isSofiaInstalled(): boolean {
  return document.documentElement.dataset.sofiaExtension === 'true'
}

export function getCertifyUrl(platformUrl: string): string {
  if (!isSofiaInstalled()) return platformUrl
  try {
    const url = new URL(platformUrl)
    url.searchParams.set('sofia_certify', 'true')
    return url.toString()
  } catch {
    return platformUrl + '?sofia_certify=true'
  }
}

