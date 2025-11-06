import { createWalletClient, custom, createPublicClient, http } from 'viem'
import { SELECTED_CHAIN } from '../config/chainConfig'
import { getMetaProvider } from '../services/metamask'

export const getClients = async () => {
    const provider = await getMetaProvider()

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

    // Use HTTP transport for public client to avoid MetaMask RPC issues
    // Automatically uses the correct RPC based on SELECTED_CHAIN (testnet or mainnet)
    const publicClient = createPublicClient({
        chain: SELECTED_CHAIN,
        transport: http(SELECTED_CHAIN.rpcUrls.default.http[0]),
    })

    console.log("Clients ready.")
    return { walletClient, publicClient }
}