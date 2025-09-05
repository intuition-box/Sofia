import type { Address } from 'viem'
import { intuitionTestnet } from './config'

export type ChainConfig = {
    chainId: number
    name: string
    rpcUrl: string
    contractAddress: `0x${string}`
}

export const getChainEnvConfig = (): ChainConfig => {
    return {
        chainId: intuitionTestnet.id,
        name: intuitionTestnet.name,
        rpcUrl: 'https://testnet.rpc.intuition.systems',
        contractAddress: '0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d' as Address,
    }
}