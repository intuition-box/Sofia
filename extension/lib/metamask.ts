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
      // Nettoyer les listeners si possible
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

export const connectWallet = async () => {
  try {
    const provider = await getMetaProvider()
    console.log(provider)
    const accounts = await provider.request({
      method: "eth_requestAccounts"
    })
    console.log("accounts", accounts)
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found")
    }
    
    return accounts[0]
  } catch (error) {
    console.error("Error connecting to wallet", error)
    throw error
  }
}

export const disconnectWallet = async () => {
  try {
    const provider = await getMetaProvider()
    console.log(provider)
    await provider.request({
      method: "wallet_revokePermissions",
      params: [{ eth_accounts: {} }]
    })
    console.log("🔌 Wallet permissions revoked")
    
    // Clean up provider after disconnection
    cleanupProvider()
    
    return true
  } catch (error) {
    console.error("Error disconnecting wallet", error)
    // Clean up even on error
    cleanupProvider()
    throw error
  }
}