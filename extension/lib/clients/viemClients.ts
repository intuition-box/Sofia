import { createWalletClient, custom, createPublicClient, http } from 'viem'
import { SELECTED_CHAIN } from '../config/chainConfig'
import { getWalletProvider, selectProviderByName } from '../services/walletProvider'
import { createServiceLogger } from '../utils/logger'

const logger = createServiceLogger('ViemClients')

/**
 * Ensure there's an HTTPS tab available for wallet transactions
 * Content scripts can only inject on HTTPS pages
 */
async function ensureHttpsTabForWallet(): Promise<void> {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const activeTab = tabs[0]

        // Check if current tab is HTTPS
        if (activeTab?.url && activeTab.url.startsWith('https://')) {
            return // Already on HTTPS, we're good
        }

        // No HTTPS tab available - open one
        logger.warn('No HTTPS tab available, opening sofia.intuition.box/values')
        await chrome.tabs.create({
            url: 'https://sofia.intuition.box/values',
            active: true
        })

        // Wait a bit for the tab to load and content script to inject
        await new Promise(resolve => setTimeout(resolve, 1500))
    } catch (error) {
        logger.error('Failed to ensure HTTPS tab', error)
        // Don't throw - let the wallet request handle the error
    }
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
    // Ensure we have an HTTPS tab for wallet operations
    await ensureHttpsTabForWallet()

    // Always re-select the provider on the current tab's content script.
    // Content scripts lose their selectedProvider state on page navigation
    // or service worker restart, causing "No wallet found" errors.
    const storage = await chrome.storage.session.get(['walletType'])
    if (storage.walletType) {
        await selectProviderByName(storage.walletType)
    }

    const provider = await getWalletProvider()

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

    logger.debug('Clients ready')
    return { walletClient, publicClient }
}
