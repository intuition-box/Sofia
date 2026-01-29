import { useState, useEffect, useRef } from 'react'
import { getAuthUrl } from '../lib/config/externalAuth'
import { selectProviderByName, selectProviderByAddress, clearProviderSelection } from '../lib/services/walletProvider'

interface WalletState {
  walletAddress: string | null
  walletType: string | null
  authenticated: boolean
  isLoading: boolean
  ready: boolean
}

/**
 * Hook to read wallet address and type from chrome.storage.session
 * This replaces usePrivy() in the sidepanel context
 */
export const useWalletFromStorage = (): WalletState => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletType, setWalletType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const lastSyncedKey = useRef<string | null>(null)

  // Sync wallet provider when address or type changes
  useEffect(() => {
    const syncKey = `${walletAddress}-${walletType}`
    if (walletAddress && syncKey !== lastSyncedKey.current) {
      lastSyncedKey.current = syncKey

      // Prefer selecting by wallet type (reliable), fallback to address (less reliable)
      const selectProvider = async () => {
        if (walletType) {
          // The proper way: select by wallet name/type
          const result = await selectProviderByName(walletType)
          if (result.found) {
            console.log('✅ [useWalletFromStorage] Synced to provider by type:', result.selectedProvider)
            return
          }
          console.warn('⚠️ [useWalletFromStorage] Wallet type not found, trying by address...')
        }

        // Fallback: try to find by address (less reliable)
        const result = await selectProviderByAddress(walletAddress)
        if (result.found) {
          console.log('✅ [useWalletFromStorage] Synced to provider by address:', result.selectedProvider)
        } else {
          console.warn('⚠️ [useWalletFromStorage] No provider found for wallet')
        }
      }

      selectProvider().catch(err => {
        // This may fail on restricted pages where content scripts can't run
        console.warn('⚠️ [useWalletFromStorage] Could not sync provider:', err.message)
      })
    }
  }, [walletAddress, walletType])

  useEffect(() => {
    // Initial check
    const checkWallet = async () => {
      try {
        const result = await chrome.storage.session.get(['walletAddress', 'walletType'])
        setWalletAddress(result.walletAddress || null)
        setWalletType(result.walletType || null)
      } catch (error) {
        console.error('Error reading wallet from storage:', error)
        setWalletAddress(null)
        setWalletType(null)
      } finally {
        setIsLoading(false)
      }
    }
    checkWallet()

    // Listen for changes
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area === 'session') {
        if (changes.walletAddress) {
          setWalletAddress(changes.walletAddress.newValue || null)
        }
        if (changes.walletType) {
          setWalletType(changes.walletType.newValue || null)
        }
      }
    }

    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  return {
    walletAddress,
    walletType,
    authenticated: !!walletAddress,
    isLoading,
    ready: !isLoading,
  }
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
