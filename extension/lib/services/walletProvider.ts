let cachedProvider: any = null

export const getWalletProvider = async () => {
  if (!cachedProvider) {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      cachedProvider = (window as any).ethereum
    } else {
      throw new Error('No wallet found. Please install MetaMask, Rabby, or another Web3 wallet.')
    }
  }
  return cachedProvider
}

export const cleanupProvider = () => {
  if (cachedProvider) {
    try {
      if (cachedProvider.removeAllListeners) {
        cachedProvider.removeAllListeners()
      }
      cachedProvider = null
      console.log('🧹 Wallet provider cleaned up')
    } catch (error) {
      console.error('Error cleaning up provider:', error)
    }
  }
}
