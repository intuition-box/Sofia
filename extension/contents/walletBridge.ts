import type { PlasmoCSConfig } from "plasmo"
import { createStore } from "mipd"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false,
  world: "MAIN" // Important: run in MAIN world to access window.ethereum
}

// =============================================================================
// METHOD WHITELISTS
// =============================================================================

/**
 * Internal bridge methods - handled locally, never sent to external wallet
 * These are for managing the bridge state (provider selection, etc.)
 */
const INTERNAL_BRIDGE_METHODS = [
  "wallet_listProviders",
  "wallet_selectProviderByName",
  "wallet_selectProviderByAddress",
  "wallet_clearProviderSelection",
]

/**
 * Allowed Ethereum RPC methods - forwarded to the selected wallet provider
 * Security whitelist to prevent malicious sites from calling dangerous methods
 */
const ALLOWED_RPC_METHODS = [
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
let selectedProviderName: string = ""

// Initialize mipd store for EIP-6963 provider discovery
function initializeProviderStore() {
  if (providerStore) return providerStore

  try {
    providerStore = createStore()

    // Listen for new providers
    providerStore.subscribe((providers) => {
      console.log("🔌 [WalletBridge] Providers discovered:", providers.map(p => p.info.name))

      // Don't auto-select if we already have a manually selected provider
      if (selectedProvider && selectedProviderName) {
        console.log("🔌 [WalletBridge] Keeping manually selected provider:", selectedProviderName)
        return
      }

      // Default: select first available (will be overridden by selectProviderByAddress)
      if (providers.length > 0 && !selectedProvider) {
        selectedProvider = providers[0].provider
        selectedProviderName = providers[0].info.name
        console.log("✅ [WalletBridge] Default provider:", selectedProviderName)
      }
    })

    console.log("🔌 [WalletBridge] mipd store initialized")
    return providerStore
  } catch (error) {
    console.error("❌ [WalletBridge] Failed to initialize mipd store:", error)
    return null
  }
}

// Clear provider selection (used on disconnect)
function clearProviderSelection(): void {
  console.log("🧹 [WalletBridge] Clearing provider selection")
  selectedProvider = null
  selectedProviderName = ""
}

// Normalize wallet type for matching (handles various formats like "rabby_wallet" → "rabby")
function normalizeWalletType(walletType: string): string {
  return walletType
    .toLowerCase()
    .replace(/_wallet$/, "")  // Remove "_wallet" suffix
    .replace(/_/g, " ")       // Replace underscores with spaces
    .trim()
}

// Select provider by name/rdns (the proper way - no guessing)
function selectProviderByName(walletType: string): boolean {
  if (!providerStore) return false

  const providers = providerStore.getProviders()
  const normalizedType = normalizeWalletType(walletType)

  console.log("🔍 [WalletBridge] Looking for provider by name:", walletType, "→ normalized:", normalizedType)
  console.log("🔍 [WalletBridge] Available providers:", providers.map(p => ({ name: p.info.name, rdns: p.info.rdns })))

  for (const providerDetail of providers) {
    const name = providerDetail.info.name.toLowerCase()
    const rdns = (providerDetail.info.rdns || "").toLowerCase()

    // Match by name or rdns (e.g., "metamask" matches "MetaMask" or "io.metamask")
    // Also check if normalized type is contained in name (e.g., "rabby" in "rabby wallet")
    if (name.includes(normalizedType) || rdns.includes(normalizedType) || normalizedType.includes(name.split(" ")[0])) {
      selectedProvider = providerDetail.provider
      selectedProviderName = providerDetail.info.name
      console.log("✅ [WalletBridge] Selected provider by name:", selectedProviderName)
      return true
    }
  }

  console.warn("⚠️ [WalletBridge] No provider found with name:", walletType)
  return false
}

// Select provider by matching the connected address (fallback, less reliable)
async function selectProviderByAddress(targetAddress: string): Promise<boolean> {
  if (!providerStore) return false

  const providers = providerStore.getProviders()
  const normalizedTarget = targetAddress.toLowerCase()

  console.log("🔍 [WalletBridge] Looking for provider with address:", normalizedTarget)

  for (const providerDetail of providers) {
    try {
      // Get accounts from this provider without prompting
      const accounts = await providerDetail.provider.request({ method: "eth_accounts", params: [] })
      const normalizedAccounts = (accounts as string[]).map(a => a.toLowerCase())

      console.log(`🔍 [WalletBridge] ${providerDetail.info.name} accounts:`, normalizedAccounts)

      if (normalizedAccounts.includes(normalizedTarget)) {
        selectedProvider = providerDetail.provider
        selectedProviderName = providerDetail.info.name
        console.log("✅ [WalletBridge] Selected provider by address:", selectedProviderName)
        return true
      }
    } catch (error) {
      console.warn(`⚠️ [WalletBridge] Could not get accounts from ${providerDetail.info.name}:`, error)
    }
  }

  console.warn("⚠️ [WalletBridge] No provider found with address:", normalizedTarget)
  return false
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

  // ==========================================================================
  // INTERNAL BRIDGE METHODS - handled locally, no external wallet involved
  // ==========================================================================

  // List providers
  if (method === "wallet_listProviders") {
    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      result: getAvailableProviders()
    }, "*")
    return
  }

  // Clear provider selection (on disconnect)
  if (method === "wallet_clearProviderSelection") {
    clearProviderSelection()
    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      result: { cleared: true }
    }, "*")
    return
  }

  // Select provider by name/type (the proper way)
  if (method === "wallet_selectProviderByName") {
    const walletType = params?.[0]
    if (!walletType) {
      window.postMessage({
        type: "SOFIA_WALLET_RESPONSE",
        requestId,
        error: { code: -32602, message: "Missing walletType parameter" }
      }, "*")
      return
    }
    const found = selectProviderByName(walletType)
    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      result: { found, selectedProvider: selectedProviderName }
    }, "*")
    return
  }

  // Select provider by address (fallback, less reliable)
  if (method === "wallet_selectProviderByAddress") {
    const address = params?.[0]
    if (!address) {
      window.postMessage({
        type: "SOFIA_WALLET_RESPONSE",
        requestId,
        error: { code: -32602, message: "Missing address parameter" }
      }, "*")
      return
    }
    const found = await selectProviderByAddress(address)
    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      result: { found, selectedProvider: selectedProviderName }
    }, "*")
    return
  }

  // ==========================================================================
  // EXTERNAL RPC METHODS - forwarded to selected wallet provider
  // ==========================================================================

  // Security: check if method is in the allowed RPC whitelist
  if (!ALLOWED_RPC_METHODS.includes(method)) {
    console.warn("🚫 [WalletBridge] Method not allowed:", method)
    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      error: { code: -32601, message: `Method not allowed: ${method}` }
    }, "*")
    return
  }

  // Forward to wallet provider
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
