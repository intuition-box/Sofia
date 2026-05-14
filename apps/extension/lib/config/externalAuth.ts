/**
 * External Authentication Configuration
 *
 * Since Privy requires HTTPS and Chrome extensions run on chrome-extension:// protocol,
 * we use an external HTTPS page for authentication.
 *
 * Override the URL via PLASMO_PUBLIC_AUTH_URL in .env.development to point at
 * a local landing (e.g. http://localhost:3000/auth) and validate the SIWE
 * handshake end-to-end before publishing.
 */

const AUTH_PAGE_URL =
  process.env.PLASMO_PUBLIC_AUTH_URL || 'https://sofia.intuition.box/auth'

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
