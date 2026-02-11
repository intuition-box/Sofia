/**
 * Wallet Provider Bridge
 * Communicates with wallet via content script (walletBridge.ts + walletRelay.ts)
 * Works in sidepanel/popup context by messaging the content script in the active tab
 */

let requestCounter = 0
let eventListeners: Map<string, Set<(data: any) => void>> = new Map()

// Generate unique request ID
function generateRequestId(): string {
  return `wallet_${Date.now()}_${++requestCounter}`
}

// Get the active tab ID
async function getActiveTabId(): Promise<number> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      if (!tabs[0]?.id) {
        reject(new Error("No active tab found"))
        return
      }
      resolve(tabs[0].id)
    })
  })
}

// Check if the active tab is on an HTTPS page (required for content script injection)
async function isActiveTabHttps(): Promise<boolean> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const url = tabs[0]?.url
    return !!url && url.startsWith('https://')
  } catch {
    return false
  }
}

// Send a request to the wallet via the content script bridge
async function sendWalletRequest(method: string, params?: any[]): Promise<any> {
  const tabId = await getActiveTabId()
  const requestId = generateRequestId()

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Wallet request timeout: ${method}`))
    }, 60000) // 60s timeout for user interactions (signing, etc.)

    chrome.tabs.sendMessage(
      tabId,
      {
        type: "WALLET_REQUEST",
        requestId,
        method,
        params
      },
      async (response) => {
        clearTimeout(timeout)

        if (chrome.runtime.lastError) {
          // Check if the error is because we're not on an HTTPS page
          const isHttps = await isActiveTabHttps()
          if (!isHttps) {
            reject(new Error("Wallet unavailable: navigate to an HTTPS page (e.g. sofia.intuition.box/values) to sign transactions."))
            return
          }
          reject(new Error(chrome.runtime.lastError.message || "Failed to communicate with wallet bridge"))
          return
        }

        if (!response) {
          reject(new Error("No response from wallet bridge. Make sure you have a wallet extension installed."))
          return
        }

        if (response.error) {
          const error = new Error(response.error.message || "Wallet error")
          ;(error as any).code = response.error.code
          reject(error)
          return
        }

        resolve(response.result)
      }
    )
  })
}

// EIP-1193 compatible provider interface
const walletProvider = {
  // Main request method (EIP-1193)
  request: async ({ method, params }: { method: string; params?: any[] }): Promise<any> => {
    console.log("🔌 [WalletProvider] Request:", method, params)
    return sendWalletRequest(method, params)
  },

  // Legacy methods for compatibility
  send: async (method: string, params?: any[]): Promise<any> => {
    return sendWalletRequest(method, params)
  },

  sendAsync: (
    request: { method: string; params?: any[] },
    callback: (error: any, result: any) => void
  ): void => {
    sendWalletRequest(request.method, request.params)
      .then((result) => callback(null, { result }))
      .catch((error) => callback(error, null))
  },

  // Event handling
  on: (event: string, callback: (data: any) => void): void => {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set())
    }
    eventListeners.get(event)!.add(callback)
  },

  removeListener: (event: string, callback: (data: any) => void): void => {
    eventListeners.get(event)?.delete(callback)
  },

  removeAllListeners: (event?: string): void => {
    if (event) {
      eventListeners.delete(event)
    } else {
      eventListeners.clear()
    }
  },

  // Provider metadata
  isMetaMask: false,
  isRabby: false,
  isSofiaBridge: true
}

// Listen for wallet events from the content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "WALLET_EVENT") {
    const { event, data } = message
    console.log("📢 [WalletProvider] Event received:", event, data)

    const listeners = eventListeners.get(event)
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error("Error in wallet event listener:", error)
        }
      })
    }
  }
})

// Cached provider instance
let cachedProvider: typeof walletProvider | null = null

export const getWalletProvider = async () => {
  if (!cachedProvider) {
    // Verify we can communicate with the bridge
    try {
      // Try to get chainId as a connectivity test
      await walletProvider.request({ method: "eth_chainId" })
      console.log("✅ [WalletProvider] Bridge connection verified")
    } catch (error) {
      console.warn("⚠️ [WalletProvider] Bridge test failed, wallet may not be installed:", error)
      // Don't throw here - let the actual request handle the error
    }
    cachedProvider = walletProvider
  }
  return cachedProvider
}

export const cleanupProvider = () => {
  if (cachedProvider) {
    try {
      cachedProvider.removeAllListeners()
      cachedProvider = null
      console.log("🧹 Wallet provider cleaned up")
    } catch (error) {
      console.error("Error cleaning up provider:", error)
    }
  }
}

// Utility to list available wallet providers
export const listWalletProviders = async (): Promise<Array<{ name: string; rdns: string; uuid: string }>> => {
  try {
    return await sendWalletRequest("wallet_listProviders")
  } catch (error) {
    console.error("Failed to list wallet providers:", error)
    return []
  }
}

// Select the wallet provider by name/type (the proper way)
// walletType can be: 'metamask', 'rabby', 'coinbase', etc.
export const selectProviderByName = async (walletType: string): Promise<{ found: boolean; selectedProvider: string }> => {
  try {
    console.log("🔍 [WalletProvider] Selecting provider by name:", walletType)
    const result = await sendWalletRequest("wallet_selectProviderByName", [walletType])
    console.log("✅ [WalletProvider] Provider selected:", result)
    return result
  } catch (error) {
    console.error("Failed to select provider by name:", error)
    return { found: false, selectedProvider: "" }
  }
}

/**
 * @deprecated Use selectProviderByName() instead. This queries all wallets
 * and may trigger unwanted connection popups. walletType should be provided at connection time.
 */
export const selectProviderByAddress = async (address: string): Promise<{ found: boolean; selectedProvider: string }> => {
  try {
    console.log("🔍 [WalletProvider] Selecting provider for address:", address)
    const result = await sendWalletRequest("wallet_selectProviderByAddress", [address])
    console.log("✅ [WalletProvider] Provider selected:", result)
    return result
  } catch (error) {
    console.error("Failed to select provider by address:", error)
    return { found: false, selectedProvider: "" }
  }
}

// Clear the provider selection (call on disconnect)
// This ensures a fresh wallet selection on next connection
export const clearProviderSelection = async (): Promise<void> => {
  try {
    console.log("🧹 [WalletProvider] Clearing provider selection")
    await sendWalletRequest("wallet_clearProviderSelection", [])
  } catch (error) {
    // May fail on restricted pages, that's OK
    console.warn("Could not clear provider selection:", error)
  }
}
