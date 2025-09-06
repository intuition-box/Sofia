import { defineChain } from "viem"

// Définir le testnet Intuition avec le vrai chainId
export const intuitionTestnet = defineChain({
  id: 13579, // Vrai chainId d'Intuition testnet
  name: 'Intuition Testnet',
  network: 'intuition-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://testnet.rpc.intuition.systems'] },
    default: { http: ['https://testnet.rpc.intuition.systems'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://testnet.explorer.intuition.systems' },
  },
})

export const SELECTED_CHAIN = intuitionTestnet
export const DEFAULT_CHAIN_ID = SELECTED_CHAIN.id.toString()
export const MULTIVAULT_CONTRACT_ADDRESS = "0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d"

// AtomWallet contracts addresses 
export const ATOM_WALLET_FACTORY_ADDRESS = "0x1f178395C23e4dF21F7457d0D068D193BA06225b"
export const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789" // Standard ERC-4337 EntryPoint