import { useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'

export const usePrivyWalletSync = () => {
  const { user, authenticated } = usePrivy()
  const walletAddress = user?.wallet?.address

  useEffect(() => {
    if (authenticated && walletAddress) {
      // Envoyer au background script
      chrome.runtime.sendMessage({
        type: 'WALLET_CONNECTED',
        address: walletAddress
      }).catch(err => {
        console.warn('Failed to send WALLET_CONNECTED message:', err)
      })
    } else if (!authenticated) {
      chrome.runtime.sendMessage({
        type: 'WALLET_DISCONNECTED'
      }).catch(err => {
        console.warn('Failed to send WALLET_DISCONNECTED message:', err)
      })
    }
  }, [authenticated, walletAddress])

  return { walletAddress, authenticated }
}
