import type { Address } from 'viem'
import { intuitionTestnet } from './config'

import logger from './logger'

const intuitionRpcUrl = 'https://testnet.rpc.intuition.systems'
const multiVaultContractAddressIntuition = '0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d'

type ChainId = typeof intuitionTestnet.id

export type ChainConfig = {
    chainId: number
    name: string
    rpcUrl: string
    rpcUrl: string
    contractAddress: `0x${string}`
}

export type ChainEnv = 'development' | 'staging' | 'production'

export const DEFAULT_CHAIN_ENV = 'development'

export const getChainEnvConfig = (env: string): ChainConfig => {
    const chainOptions: Record<ChainEnv, ChainConfig> = {
        development: {
            chainId: intuitionTestnet.id,
            name: intuitionTestnet.name,
            rpcUrl: intuitionRpcUrl,
            contractAddress: multiVaultContractAddressIntuition as Address,
        },
        staging: {
            chainId: intuitionTestnet.id,
            name: intuitionTestnet.name,
            rpcUrl: intuitionRpcUrl,
            contractAddress: multiVaultContractAddressIntuition as Address,
        },
        production: {
            chainId: intuitionTestnet.id,
            name: intuitionTestnet.name,
            rpcUrl: intuitionRpcUrl,
            contractAddress: multiVaultContractAddressIntuition as Address,
        },
    }

    if (!env) {
        console.error(
            `No chain environment specified. Defaulting to ${DEFAULT_CHAIN_ENV}.`,
        )
        return chainOptions[DEFAULT_CHAIN_ENV]
    }
    if (!(env in chainOptions)) {
        logger(`No config for provided environment: ${env}.`)
        return chainOptions[DEFAULT_CHAIN_ENV]
    }
    return chainOptions[env as ChainEnv]
}