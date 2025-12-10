import { usePrivy } from '@privy-io/react-auth'

/**
 * Hook to get the connected wallet address from Privy
 * This replaces the previous useStorage("metamask-account") pattern
 */
export const useWalletAddress = () => {
  const { user, authenticated } = usePrivy()
  const address = user?.wallet?.address || null

  return {
    address,
    isConnected: authenticated && !!address
  }
}
