import { createWalletClient, custom, createPublicClient, http } from 'viem'
import { SELECTED_CHAIN } from '../config/chainConfig'
import { createBoundProvider, selectProviderByName } from '../services/walletProvider'
import { createServiceLogger } from '../utils/logger'

const logger = createServiceLogger('ViemClients')

/**
 * Wait for a tab to finish loading (content scripts inject on "complete")
 */
function waitForTabReady(tabId: number, timeout: number): Promise<void> {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener)
            logger.warn('Tab load timeout, proceeding anyway', { tabId })
            resolve() // resolve, not reject — let wallet request surface errors
        }, timeout)

        const listener = (
            updatedTabId: number,
            changeInfo: chrome.tabs.TabChangeInfo
        ) => {
            if (updatedTabId === tabId && changeInfo.status === "complete") {
                clearTimeout(timer)
                chrome.tabs.onUpdated.removeListener(listener)
                // Small delay for content script init after page complete
                setTimeout(resolve, 300)
            }
        }
        chrome.tabs.onUpdated.addListener(listener)
    })
}

/**
 * Ensure there's an HTTPS tab available for wallet transactions.
 * Returns the tabId to pin all subsequent wallet requests to.
 */
async function ensureHttpsTabForWallet(): Promise<number> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const activeTab = tabs[0]

    // Check if current tab is HTTPS
    if (activeTab?.url?.startsWith('https://') && activeTab.id) {
        return activeTab.id
    }

    // No HTTPS tab available - open one
    logger.warn('No HTTPS tab available, opening doc.sofia.intuition.box/values')
    const newTab = await chrome.tabs.create({
        url: 'https://doc.sofia.intuition.box/values',
        active: true
    })

    if (!newTab.id) {
        throw new Error("Failed to create HTTPS tab for wallet")
    }

    // Wait for tab to finish loading (content scripts inject on "complete")
    await waitForTabReady(newTab.id, 10000)
    return newTab.id
}

/**
 * Get only the public client for read-only operations
 * This is faster and doesn't require wallet access
 */
export const getPublicClient = () => {
    return createPublicClient({
        chain: SELECTED_CHAIN,
        transport: http(SELECTED_CHAIN.rpcUrls.default.http[0]),
    })
}

export const getClients = async () => {
    // Capture tabId once — all wallet requests in this flow use this tab
    // Prevents race conditions when user switches tabs during multi-step flows
    const tabId = await ensureHttpsTabForWallet()

    // Always re-select the provider on the current tab's content script.
    // Content scripts lose their selectedProvider state on page navigation
    // or service worker restart, causing "No wallet found" errors.
    const storage = await chrome.storage.session.get(['walletType'])
    if (storage.walletType) {
        await selectProviderByName(storage.walletType, tabId)
    }

    // Create a provider bound to this specific tabId (closure, no shared state)
    const provider = createBoundProvider(tabId)

    const accounts = await provider.request({
        method: 'eth_requestAccounts',
    })
    const address = accounts[0]

    const walletClient = createWalletClient({
        account: address,
        chain: SELECTED_CHAIN,
        transport: custom(provider),
    })

    const chainId = await walletClient.getChainId()

    if (chainId !== SELECTED_CHAIN.id) {
        await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${SELECTED_CHAIN.id.toString(16)}` }],
        })
    }

    // Use HTTP transport for public client to avoid wallet RPC issues
    // Automatically uses the correct RPC based on SELECTED_CHAIN (testnet or mainnet)
    const publicClient = createPublicClient({
        chain: SELECTED_CHAIN,
        transport: http(SELECTED_CHAIN.rpcUrls.default.http[0]),
    })

    logger.debug('Clients ready', { tabId })
    return { walletClient, publicClient }
}
