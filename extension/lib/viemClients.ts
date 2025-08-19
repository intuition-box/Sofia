import { createWalletClient, custom, createPublicClient } from 'viem'
import { SELECTED_CHAIN } from './config'
import { getMetaProvider } from './metamask'

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

    const publicClient = createPublicClient({
        chain: SELECTED_CHAIN,
        transport: custom(provider),
    })

    console.log("Clients ready.")
    return { walletClient, publicClient }
}