import { useWalletFromStorage } from './useWalletFromStorage'

/**
 * Hook to get the connected wallet address from chrome.storage.session
 * This replaces the previous usePrivy pattern
 */
export const useWalletAddress = () => {
  const { walletAddress, authenticated } = useWalletFromStorage()

  return {
    address: walletAddress,
    isConnected: authenticated && !!walletAddress
  }
}
