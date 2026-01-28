import type { PlasmoCSConfig } from "plasmo"
import { createStore } from "mipd"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false,
  world: "MAIN" // Important: run in MAIN world to access window.ethereum
}

// Allowed RPC methods for security (whitelist)
const ALLOWED_METHODS = [
  // Account/connection
  "eth_requestAccounts",
  "eth_accounts",
  "wallet_requestPermissions",
  "wallet_getPermissions",

  // Chain
  "eth_chainId",
  "wallet_switchEthereumChain",
  "wallet_addEthereumChain",
  "net_version",

  // Read operations
  "eth_call",
  "eth_estimateGas",
  "eth_getBalance",
  "eth_getBlockByNumber",
  "eth_getTransactionByHash",
  "eth_getTransactionReceipt",
  "eth_getCode",
  "eth_getLogs",
  "eth_blockNumber",
  "eth_gasPrice",
  "eth_maxPriorityFeePerGas",
  "eth_feeHistory",

  // Write operations (require user approval in wallet)
  "eth_sendTransaction",
  "eth_signTransaction",
  "eth_sign",
  "personal_sign",
  "eth_signTypedData",
  "eth_signTypedData_v3",
  "eth_signTypedData_v4",

  // Wallet metadata
  "wallet_getCapabilities",
  "wallet_sendCalls",
]

// Store for discovered providers
let providerStore: ReturnType<typeof createStore> | null = null
let selectedProvider: any = null

// Initialize mipd store for EIP-6963 provider discovery
function initializeProviderStore() {
  if (providerStore) return providerStore

  try {
    providerStore = createStore()

    // Listen for new providers
    providerStore.subscribe((providers) => {
      console.log("🔌 [WalletBridge] Providers discovered:", providers.map(p => p.info.name))

      // Select the first available provider (or priority: Rabby > MetaMask > others)
      if (providers.length > 0) {
        const rabby = providers.find(p => p.info.rdns?.includes("rabby"))
        const metamask = providers.find(p => p.info.rdns?.includes("metamask"))

        selectedProvider = rabby?.provider || metamask?.provider || providers[0].provider
        console.log("✅ [WalletBridge] Selected provider:",
          rabby ? "Rabby" : metamask ? "MetaMask" : providers[0].info.name
        )
      }
    })

    console.log("🔌 [WalletBridge] mipd store initialized")
    return providerStore
  } catch (error) {
    console.error("❌ [WalletBridge] Failed to initialize mipd store:", error)
    return null
  }
}

// Fallback to window.ethereum if no EIP-6963 providers found
function getProvider(): any {
  if (selectedProvider) {
    return selectedProvider
  }

  // Fallback to legacy window.ethereum
  if (typeof window !== "undefined" && (window as any).ethereum) {
    console.log("⚠️ [WalletBridge] Using fallback window.ethereum")
    return (window as any).ethereum
  }

  return null
}

// List available wallet providers
function getAvailableProviders(): Array<{ name: string; rdns: string; uuid: string }> {
  if (!providerStore) return []

  const providers = providerStore.getProviders()
  return providers.map(p => ({
    name: p.info.name,
    rdns: p.info.rdns || "",
    uuid: p.info.uuid
  }))
}

// Handle incoming wallet requests from extension
async function handleWalletRequest(event: MessageEvent) {
  // Only handle messages from our extension
  if (event.source !== window) return
  if (event.data?.type !== "SOFIA_WALLET_REQUEST") return

  const { requestId, method, params } = event.data

  console.log("📨 [WalletBridge] Received request:", method, params)

  // Security: check if method is allowed
  if (!ALLOWED_METHODS.includes(method)) {
    console.warn("🚫 [WalletBridge] Method not allowed:", method)
    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      error: { code: -32601, message: `Method not allowed: ${method}` }
    }, "*")
    return
  }

  // Special case: list providers
  if (method === "wallet_listProviders") {
    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      result: getAvailableProviders()
    }, "*")
    return
  }

  const provider = getProvider()

  if (!provider) {
    console.error("❌ [WalletBridge] No provider available")
    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      error: { code: -32002, message: "No wallet found. Please install MetaMask, Rabby, or another Web3 wallet." }
    }, "*")
    return
  }

  try {
    const result = await provider.request({ method, params })
    console.log("✅ [WalletBridge] Request successful:", method, result)

    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      result
    }, "*")
  } catch (error: any) {
    console.error("❌ [WalletBridge] Request failed:", method, error)

    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      error: {
        code: error.code || -32603,
        message: error.message || "Unknown error"
      }
    }, "*")
  }
}

// Listen for wallet events and forward them
function setupProviderListeners() {
  const provider = getProvider()
  if (!provider) return

  const forwardEvent = (eventName: string) => (data: any) => {
    console.log(`📢 [WalletBridge] Event: ${eventName}`, data)
    window.postMessage({
      type: "SOFIA_WALLET_EVENT",
      event: eventName,
      data
    }, "*")
  }

  try {
    provider.on?.("accountsChanged", forwardEvent("accountsChanged"))
    provider.on?.("chainChanged", forwardEvent("chainChanged"))
    provider.on?.("connect", forwardEvent("connect"))
    provider.on?.("disconnect", forwardEvent("disconnect"))
    console.log("👂 [WalletBridge] Provider listeners set up")
  } catch (error) {
    console.warn("⚠️ [WalletBridge] Could not set up provider listeners:", error)
  }
}

// Initialize
function init() {
  console.log("🌉 [WalletBridge] Initializing wallet bridge...")

  // Initialize EIP-6963 provider discovery
  initializeProviderStore()

  // Listen for messages from extension
  window.addEventListener("message", handleWalletRequest)

  // Set up provider event listeners after a short delay (wait for providers)
  setTimeout(setupProviderListeners, 500)

  console.log("✅ [WalletBridge] Wallet bridge ready")
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
