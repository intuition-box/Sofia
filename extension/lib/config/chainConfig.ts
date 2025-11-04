import { defineChain } from "viem"

// Définir le testnet Intuition avec le vrai chainId
export const intuitionTestnet = defineChain({
  id: 13579, // Vrai chainId d'Intuition testnet
  name: 'Intuition Testnet',
  network: 'intuition-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Trust',
    symbol: 'TRUST',
  },
  rpcUrls: {
    public: { http: ['https://testnet.rpc.intuition.systems'] },
    default: { http: ['https://testnet.rpc.intuition.systems'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://testnet.explorer.intuition.systems' },
  },
})

// Définir le mainnet Intuition
export const intuitionMainnet = defineChain({
  id: 1155, // Intuition mainnet chain ID
  name: 'Intuition Mainnet',
  network: 'intuition-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Trust',
    symbol: 'TRUST',
  },
  rpcUrls: {
    public: { http: ['https://rpc.intuition.systems'], webSocket: ['wss://rpc.intuition.systems'] },
    default: { http: ['https://rpc.intuition.systems'], webSocket: ['wss://rpc.intuition.systems'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.intuition.systems' },
  },
})

export const SELECTED_CHAIN = intuitionTestnet
export const DEFAULT_CHAIN_ID = SELECTED_CHAIN.id.toString()
// export const MULTIVAULT_CONTRACT_ADDRESS = "0xB92EA1B47E4ABD0a520E9138BB59dBd1bC6C475B"
export const MULTIVAULT_CONTRACT_ADDRESS = "0x2Ece8D4dEdcB9918A398528f3fa4688b1d2CAB91"
export const MULTIVAULT_CONTRACT_ADDRESS_MAINNET = "0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e"