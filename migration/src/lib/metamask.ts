import createMetaMaskProvider from "metamask-extension-provider";

export const getMetaProvider = async () => {
  const provider = createMetaMaskProvider();
  return provider;
};

export const connectWallet = async () => {
  try {
    const provider = await getMetaProvider();
    console.log("🦊 MetaMask provider created:", provider);
    
    const accounts = await provider.request({
      method: "eth_requestAccounts"
    });
    
    console.log("🔗 Connected accounts:", accounts);
    
    if (accounts && accounts.length > 0) {
      return accounts[0];
    } else {
      throw new Error("No accounts found");
    }
  } catch (error) {
    console.error("❌ Error connecting to wallet:", error);
    throw error;
  }
};

export const disconnectWallet = async () => {
  try {
    const provider = await getMetaProvider();
    await provider.request({
      method: "wallet_revokePermissions",
      params: [{ eth_accounts: {} }]
    });
    console.log("🔌 Wallet disconnected");
  } catch (error) {
    console.error("❌ Error disconnecting wallet:", error);
    throw error;
  }
};

export const getCurrentAccount = async () => {
  try {
    const provider = await getMetaProvider();
    const accounts = await provider.request({
      method: "eth_accounts"
    });
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error("❌ Error getting current account:", error);
    return null;
  }
};