
import createMetaMaskProvider from "metamask-extension-provider"

export const getMetaProvider = async () => {
  const provider = createMetaMaskProvider()
  // provider
  //   .on("accountsChanged", handleAccountsChanged)
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

// let currentAccount: any = null
// // eth_accounts always returns an array.
// function handleAccountsChanged(accounts: any) {
//   if (accounts.length === 0) {
//     // MetaMask is locked or the user has not connected any accounts.
//     console.log("Please connect to MetaMask.")
//   } else if (accounts[0] !== currentAccount) {
//     currentAccount = accounts[0]
//   }
// }