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
    const accounts = await provider.request({
      method: "wallet_revokePermissions",
      params: [{ eth_accounts: {} }]
    })
    return accounts[0]
  } catch (error) {
    console.error("Error connecting to wallet", error)
    throw error
  }
}