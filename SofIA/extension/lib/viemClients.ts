import { createWalletClient, custom, createPublicClient } from 'viem'
import { SELECTED_CHAIN } from './config'
import { getMetaProvider } from './metamask'

export const getClients = async () => {
    const provider = await getMetaProvider()

    // Ne pas demander les comptes ici, on utilisera celui de Sofia
    const walletClient = createWalletClient({
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

    const publicClient = createPublicClient({
        chain: SELECTED_CHAIN,
        transport: custom(provider),
    })

    console.log("Clients ready.")
    return { walletClient, publicClient }
}