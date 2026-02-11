import { useSyncExternalStore } from 'react'
import { getAuthUrl } from '../lib/config/externalAuth'
import { selectProviderByName, selectProviderByAddress, clearProviderSelection } from '../lib/services/walletProvider'

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
        console.log('✅ [useWalletFromStorage] Synced to provider by type:', result.selectedProvider)
        return
      }
      console.warn('⚠️ [useWalletFromStorage] Wallet type not found, trying by address...')
    } else {
      console.warn('⚠️ [useWalletFromStorage] No walletType stored — falling back to address lookup (deprecated)')
    }

    // Deprecated fallback: query all wallets by address (may trigger popups)
    const result = await selectProviderByAddress(address)
    if (result.found) {
      console.log('✅ [useWalletFromStorage] Synced to provider by address:', result.selectedProvider)
    } else {
      console.warn('⚠️ [useWalletFromStorage] No provider found for wallet')
    }
  } catch (err) {
    console.warn('⚠️ [useWalletFromStorage] Could not sync provider:', err instanceof Error ? err.message : err)
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
    console.error('Error reading wallet from storage:', error)
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
  // Always trigger external logout first (redirect to Privy logout)
  try {
    await triggerExternalLogout()
  } catch (error) {
    console.error('Error triggering external logout:', error)
  }

  // Then clear local state
  try {
    await clearProviderSelection()
    await chrome.runtime.sendMessage({ type: 'WALLET_DISCONNECTED' })
  } catch (error) {
    console.error('Error clearing wallet state:', error)
    // Fallback: clear directly
    await chrome.storage.session.remove(['walletAddress', 'walletType'])
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
    console.log('🔓 [disconnectWallet] Triggering logout on existing auth tab')
  } else {
    // Open new visible tab to logout
    await chrome.tabs.create({ url: logoutUrl, active: true })
    console.log('🔓 [disconnectWallet] Opening auth page to logout')
  }
}
