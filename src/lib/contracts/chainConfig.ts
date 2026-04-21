import { defineChain } from 'viem'
import { SOFIA_PROXY_ADDRESS, MULTIVAULT_ADDRESS } from '../../config'

/** Intuition mainnet (chain ID 1155) */
export const intuitionChain = defineChain({
  id: 1155,
  name: 'Intuition',
  nativeCurrency: { name: 'TRUST', symbol: 'TRUST', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.intuition.systems'] } },
  blockExplorers: { default: { name: 'Explorer', url: 'https://explorer.intuition.systems' } },
})

export const INTUITION_RPC_URL = 'https://rpc.intuition.systems'
export const PROXY_ADDRESS = SOFIA_PROXY_ADDRESS
export const MULTI_VAULT_ADDRESS = MULTIVAULT_ADDRESS
