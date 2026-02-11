import { useSyncExternalStore } from 'react'
import { getAuthUrl } from '../lib/config/externalAuth'
import { selectProviderByName, selectProviderByAddress, clearProviderSelection } from '../lib/services/walletProvider'
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
let lastSyncedKey: string | null = null
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

async function syncProvider(address: string | null, type: string | null) {
  if (!address) {
    lastSyncedKey = null
    return
  }

  const syncKey = `${address}-${type}`
  if (syncKey === lastSyncedKey) return
  lastSyncedKey = syncKey

  try {
    if (type) {
      const result = await selectProviderByName(type)
      if (result.found) {
        logger.debug('Synced to provider by type', { selectedProvider: result.selectedProvider })
        return
      }
      logger.warn('Wallet type not found, trying by address')
    } else {
      logger.warn('No walletType stored, falling back to address lookup (deprecated)')
    }

    // Deprecated fallback: query all wallets by address (may trigger popups)
    const result = await selectProviderByAddress(address)
    if (result.found) {
      logger.debug('Synced to provider by address', { selectedProvider: result.selectedProvider })
    } else {
      logger.warn('No provider found for wallet')
    }
  } catch (err) {
    logger.warn('Could not sync provider', err instanceof Error ? err.message : err)
  }
}

function initializeStore() {
  if (initialized) return
  initialized = true

  // Initial read from storage
  chrome.storage.session.get(['walletAddress', 'walletType']).then(result => {
    const address = result.walletAddress || null
    const type = result.walletType || null

    sharedState = {
      walletAddress: address,
      walletType: type,
      authenticated: !!address,
      isLoading: false,
      ready: true,
    }
    notifyListeners()
    syncProvider(address, type)
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
    syncProvider(address, type)
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
 * Disconnects the wallet from extension AND from Privy on the landing page
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

  // 2. Clear wallet provider cache (best effort, may fail on restricted pages)
  try {
    await clearProviderSelection()
  } catch (error) {
    logger.warn('Could not clear provider selection', error)
  }

  // 3. Trigger external Privy logout last (opens a tab, may auto-reconnect)
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
