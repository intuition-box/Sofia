/**
 * Blockchain configuration for Sofia Indexer
 * Using same config as Sofia extension
 */

import type { ChainConfig } from '../src/types.js'

export const CHAINS = {
  INTUITION_TESTNET: {
    id: 13579,
    name: 'Intuition Testnet',
    network: 'intuition-testnet',
    rpcUrl: 'https://testnet.rpc.intuition.systems',
    multivaultAddress: '0xB92EA1B47E4ABD0a520E9138BB59dBd1bC6C475B',
    explorer: 'https://testnet.explorer.intuition.systems',
    nativeCurrency: {
      decimals: 18,
      name: 'Trust',
      symbol: 'TRUST'
    }
  } satisfies ChainConfig
} as const

export const DEFAULT_CHAIN = CHAINS.INTUITION_TESTNET