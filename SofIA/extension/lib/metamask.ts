import createMetaMaskProvider from "metamask-extension-provider"

export const getMetaProvider = async () => {
  const provider = createMetaMaskProvider()
  return provider
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
    return true
  } catch (error) {
    console.error("Error disconnecting wallet", error)
    throw error
  }
}