import type { PlasmoCSConfig } from "plasmo"
import { createStore, type EIP1193Provider } from "mipd"
import { createServiceLogger } from "../lib/utils/logger"

const logger = createServiceLogger('WalletBridge')

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
let selectedProvider: EIP1193Provider | null = null
let selectedProviderName: string = ""

// Initialize mipd store for EIP-6963 provider discovery
function initializeProviderStore() {
  if (providerStore) return providerStore

  try {
    providerStore = createStore()

    // Listen for new providers (discovery only, no auto-selection)
    providerStore.subscribe((providers) => {
      logger.debug("Providers discovered", { providers: providers.map(p => p.info.name) })
    })

    logger.info("mipd store initialized")
    return providerStore
  } catch (error) {
    logger.error("Failed to initialize mipd store", error)
    return null
  }
}

// Clear provider selection (used on disconnect)
function clearProviderSelection(): void {
  logger.debug("Clearing provider selection")
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

  logger.debug("Looking for provider by name", { walletType, normalizedType })
  logger.debug("Available providers", { providers: providers.map(p => ({ name: p.info.name, rdns: p.info.rdns })) })

  for (const providerDetail of providers) {
    const name = providerDetail.info.name.toLowerCase()
    const rdns = (providerDetail.info.rdns || "").toLowerCase()

    // Match by name or rdns (e.g., "metamask" matches "MetaMask" or "io.metamask")
    // Also check if normalized type is contained in name (e.g., "rabby" in "rabby wallet")
    if (name.includes(normalizedType) || rdns.includes(normalizedType) || normalizedType.includes(name.split(" ")[0])) {
      selectedProvider = providerDetail.provider
      selectedProviderName = providerDetail.info.name
      logger.info("Selected provider by name", { selectedProviderName })
      setupProviderListeners()
      return true
    }
  }

  logger.warn("No provider found with name", { walletType })
  return false
}

// @deprecated - Use selectProviderByName() instead. This queries all wallets and may trigger unwanted popups.
async function selectProviderByAddress(targetAddress: string): Promise<boolean> {
  logger.warn("selectProviderByAddress is deprecated — walletType should be provided at connection time")

  if (!providerStore) return false

  const providers = providerStore.getProviders()
  const normalizedTarget = targetAddress.toLowerCase()

  logger.debug("Looking for provider with address", { normalizedTarget })

  for (const providerDetail of providers) {
    try {
      // Get accounts from this provider without prompting
      const accounts = await providerDetail.provider.request({ method: "eth_accounts", params: [] })
      const normalizedAccounts = (accounts as string[]).map(a => a.toLowerCase())

      logger.debug(`${providerDetail.info.name} accounts`, { normalizedAccounts })

      if (normalizedAccounts.includes(normalizedTarget)) {
        selectedProvider = providerDetail.provider
        selectedProviderName = providerDetail.info.name
        logger.info("Selected provider by address", { selectedProviderName })
        return true
      }
    } catch (error) {
      logger.warn(`Could not get accounts from ${providerDetail.info.name}`, error)
    }
  }

  logger.warn("No provider found with address", { normalizedTarget })
  return false
}

// Get the explicitly selected provider (no fallback - provider must be selected first)
function getProvider(): EIP1193Provider | null {
  return selectedProvider
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

  logger.debug("Received request", { method, params })

  // ==========================================================================
  // INTERNAL BRIDGE METHODS - handled locally, no external wallet involved
  // ==========================================================================

  // List providers
  if (method === "wallet_listProviders") {
    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      result: getAvailableProviders()
    }, window.location.origin)
    return
  }

  // Clear provider selection (on disconnect)
  if (method === "wallet_clearProviderSelection") {
    clearProviderSelection()
    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      result: { cleared: true }
    }, window.location.origin)
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
      }, window.location.origin)
      return
    }
    const found = selectProviderByName(walletType)
    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      result: { found, selectedProvider: selectedProviderName }
    }, window.location.origin)
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
      }, window.location.origin)
      return
    }
    const found = await selectProviderByAddress(address)
    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      result: { found, selectedProvider: selectedProviderName }
    }, window.location.origin)
    return
  }

  // ==========================================================================
  // EXTERNAL RPC METHODS - forwarded to selected wallet provider
  // ==========================================================================

  // Security: check if method is in the allowed RPC whitelist
  if (!ALLOWED_RPC_METHODS.includes(method)) {
    logger.warn("Method not allowed", { method })
    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      error: { code: -32601, message: `Method not allowed: ${method}` }
    }, window.location.origin)
    return
  }

  // Forward to wallet provider
  const provider = getProvider()

  if (!provider) {
    logger.error("No provider available")
    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      error: { code: -32002, message: "No wallet found. Please install MetaMask, Rabby, or another Web3 wallet." }
    }, window.location.origin)
    return
  }

  try {
    const result = await provider.request({ method, params })
    logger.debug("Request successful", { method, result })

    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      result
    }, window.location.origin)
  } catch (error: unknown) {
    logger.error("Request failed", { method, error })

    const errCode = error instanceof Object && 'code' in error ? (error as { code: number }).code : -32603
    const errMessage = error instanceof Error ? error.message : "Unknown error"

    window.postMessage({
      type: "SOFIA_WALLET_RESPONSE",
      requestId,
      error: {
        code: errCode,
        message: errMessage
      }
    }, window.location.origin)
  }
}

// Forward wallet events to the extension
const forwardEvent = (eventName: string) => (data: any) => {
  logger.debug(`Event: ${eventName}`, data)
  window.postMessage({
    type: "SOFIA_WALLET_EVENT",
    event: eventName,
    data
  }, window.location.origin)
}

// Track active listeners for cleanup on provider switch
let activeListenerCleanup: (() => void) | null = null

// Listen for wallet events and forward them
function setupProviderListeners() {
  // Cleanup previous listeners first (prevents duplicates on provider switch)
  if (activeListenerCleanup) {
    activeListenerCleanup()
    activeListenerCleanup = null
  }

  const provider = getProvider()
  if (!provider) return

  const handlers: Record<string, (data: any) => void> = {
    accountsChanged: forwardEvent("accountsChanged"),
    chainChanged: forwardEvent("chainChanged"),
    connect: forwardEvent("connect"),
    disconnect: forwardEvent("disconnect"),
  }

  try {
    for (const [event, handler] of Object.entries(handlers)) {
      provider.on?.(event, handler)
    }

    activeListenerCleanup = () => {
      for (const [event, handler] of Object.entries(handlers)) {
        try {
          provider.removeListener?.(event, handler)
        } catch {
          // Provider may not support removeListener
        }
      }
    }

    logger.debug("Provider listeners set up")
  } catch (error) {
    logger.warn("Could not set up provider listeners", error)
  }
}

// Initialize
function init() {
  logger.info("Initializing wallet bridge...")

  // Initialize EIP-6963 provider discovery
  initializeProviderStore()

  // Listen for messages from extension
  window.addEventListener("message", handleWalletRequest)

  // Provider listeners are set up when a provider is selected (selectProviderByName)

  logger.info("Wallet bridge ready")
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
