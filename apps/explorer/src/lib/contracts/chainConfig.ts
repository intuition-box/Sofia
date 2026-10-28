import { defineChain } from 'viem'
import {
  MULTIVAULT_ADDRESS,
  PUBLIC_RPC_URL,
  RPC_URL,
  SOFIA_PROXY_ADDRESS,
} from '../../config'

/** Intuition mainnet (chain ID 1155) */
export const intuitionChain = defineChain({
  id: 1155,
  name: 'Intuition',
  nativeCurrency: { name: 'TRUST', symbol: 'TRUST', decimals: 18 },
  // Public RPC: wallets (MetaMask, Privy) may store it for the network, and
  // the Sofia proxy only answers Sofia's own origins
  rpcUrls: { default: { http: [PUBLIC_RPC_URL] } },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.intuition.systems' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
  },
})

/** Every read/write transport of the explorer (see RPC_URL) */
export const INTUITION_RPC_URL = RPC_URL
export const PROXY_ADDRESS = SOFIA_PROXY_ADDRESS
export const MULTI_VAULT_ADDRESS = MULTIVAULT_ADDRESS
