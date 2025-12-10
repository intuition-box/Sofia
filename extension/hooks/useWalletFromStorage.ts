import { useState, useEffect } from 'react'
import { getAuthUrl } from '../lib/config/externalAuth'

interface WalletState {
  walletAddress: string | null
  authenticated: boolean
  isLoading: boolean
  ready: boolean
}

/**
 * Hook to read wallet address from chrome.storage.session
 * This replaces usePrivy() in the sidepanel context
 */
export const useWalletFromStorage = (): WalletState => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initial check
    const checkWallet = async () => {
      try {
        const result = await chrome.storage.session.get('walletAddress')
        setWalletAddress(result.walletAddress || null)
      } catch (error) {
        console.error('Error reading wallet from storage:', error)
        setWalletAddress(null)
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
      if (area === 'session' && changes.walletAddress) {
        const newValue = changes.walletAddress.newValue || null
        setWalletAddress(newValue)
      }
    }

    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  return {
    walletAddress,
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
 * Disconnects the wallet
 */
export const disconnectWallet = async () => {
  try {
    await chrome.runtime.sendMessage({ type: 'WALLET_DISCONNECTED' })
  } catch (error) {
    console.error('Error disconnecting wallet:', error)
    // Fallback: clear directly
    await chrome.storage.session.remove('walletAddress')
  }
}
