import createMetaMaskProvider from "metamask-extension-provider"

let cachedProvider: any = null

export const getMetaProvider = async () => {
  if (!cachedProvider) {
    cachedProvider = createMetaMaskProvider()
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
      console.log('🧹 MetaMask provider cleaned up')
    } catch (error) {
      console.error('Error cleaning up provider:', error)
    }
  }
}
