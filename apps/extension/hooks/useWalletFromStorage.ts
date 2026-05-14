import { useSyncExternalStore } from 'react'
import { getAuthUrl } from '../lib/config/externalAuth'
import { createHookLogger } from '../lib/utils/logger'

const logger = createHookLogger('useWalletFromStorage')

interface WalletState {
  walletAddress: string | null
  walletType: string | null
  authenticated: boolean
  isLoading: boolean
  ready: boolean
}

// ─── Singleton external store (shared across all hook instances) ───

let sharedState: WalletState = {
  walletAddress: null,
  walletType: null,
  authenticated: false,
  isLoading: true,
  ready: false,
}

let initialized = false
const listeners = new Set<() => void>()

function notifyListeners() {
  for (const listener of listeners) listener()
}

function getSnapshot(): WalletState {
  return sharedState
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (!initialized) initializeStore()
  return () => listeners.delete(listener)
}

function initializeStore() {
  if (initialized) return
  initialized = true

  // Initial read from storage
  chrome.storage.session.get(['walletAddress', 'walletType']).then(result => {
    sharedState = {
      walletAddress: result.walletAddress || null,
      walletType: result.walletType || null,
      authenticated: !!result.walletAddress,
      isLoading: false,
      ready: true,
    }
    notifyListeners()
  }).catch(error => {
    logger.error('Error reading wallet from storage', error)
    sharedState = { ...sharedState, isLoading: false, ready: true }
    notifyListeners()
  })

  // Single listener for all hook instances
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'session') return
    if (!changes.walletAddress && !changes.walletType) return

    const address = changes.walletAddress
      ? (changes.walletAddress.newValue || null)
      : sharedState.walletAddress
    const type = changes.walletType
      ? (changes.walletType.newValue || null)
      : sharedState.walletType

    sharedState = {
      walletAddress: address,
      walletType: type,
      authenticated: !!address,
      isLoading: false,
      ready: true,
    }
    notifyListeners()
  })
}

/**
 * Hook to read wallet address and type from chrome.storage.session
 * Uses a singleton store — all 36+ consumers share one storage listener
 * and one provider sync call instead of duplicating per-instance
 */
export const useWalletFromStorage = (): WalletState => {
  return useSyncExternalStore(subscribe, getSnapshot)
}

/**
 * Opens the external Privy authentication page
 */
export const openAuthTab = () => {
  const authUrl = getAuthUrl({ autoLogin: true })
  chrome.tabs.create({ url: authUrl })
}

/**
 * Disconnects the wallet from the extension AND from Privy on the auth page.
 *
 * The WALLET_DISCONNECTED message handler in background/messageHandlers.ts
 * clears walletAddress + walletType from chrome.storage.session, which is
 * the single source of truth for the wallet selection. No content-script
 * provider state to clear.
 */
export const disconnectWallet = async () => {
  // 1. Clear local state FIRST so the UI reflects disconnected immediately
  try {
    await chrome.runtime.sendMessage({ type: 'WALLET_DISCONNECTED' })
  } catch (error) {
    logger.error('Error sending disconnect message', error)
    // Fallback: clear directly
    await chrome.storage.session.remove(['walletAddress', 'walletType'])
  }

  // 2. Trigger external Privy logout (opens a tab, may auto-reconnect)
  try {
    await triggerExternalLogout()
  } catch (error) {
    logger.error('Error triggering external logout', error)
  }
}

/**
 * Trigger logout on the external Privy auth page
 * This ensures the Privy session is also cleared
 */
async function triggerExternalLogout(): Promise<void> {
  const logoutUrl = 'https://sofia.intuition.box/auth/logout'

  // Try to find an existing tab on the auth domain
  const tabs = await chrome.tabs.query({ url: 'https://sofia.intuition.box/*' })

  if (tabs.length > 0 && tabs[0].id) {
    // Update existing tab and bring it to focus
    await chrome.tabs.update(tabs[0].id, { url: logoutUrl, active: true })
    logger.debug('Triggering logout on existing auth tab')
  } else {
    // Open new visible tab to logout
    await chrome.tabs.create({ url: logoutUrl, active: true })
    logger.debug('Opening auth page to logout')
  }
}
