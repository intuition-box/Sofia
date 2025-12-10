/**
 * External Authentication Configuration
 *
 * Since Privy requires HTTPS and Chrome extensions run on chrome-extension:// protocol,
 * we use an external HTTPS page for authentication.
 */

export const AUTH_PAGE_URL = 'https://sofia.intuition.box/auth'

/**
 * Build the full auth URL with callback parameters
 */
export const getAuthUrl = (options?: { autoLogin?: boolean }): string => {
  const url = new URL(AUTH_PAGE_URL)

  // Get the extension ID for chrome.runtime.sendMessage from external page
  const extensionId = chrome.runtime.id
  url.searchParams.set('extensionId', extensionId)

  // Auto-trigger login modal
  if (options?.autoLogin) {
    url.searchParams.set('autoLogin', 'true')
  }

  return url.toString()
}
