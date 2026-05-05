import { defineChain } from 'viem';

/**
 * Intuition Mainnet Chain Definition
 */
export const intuitionMainnet = defineChain({
  id: 1155,
  name: 'Intuition Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Trust',
    symbol: 'TRUST',
  },
  rpcUrls: {
    default: { http: ['https://rpc.intuition.systems'] },
    public: { http: ['https://rpc.intuition.systems'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.intuition.systems' },
  },
});

/**
 * Contract addresses
 */
export const MULTIVAULT_ADDRESS = '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e' as const;
export const SOFIA_PROXY_ADDRESS = '0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c' as const;

/**
 * Blockchain transaction config
 */
export const BLOCKCHAIN_CONFIG = {
  DEFAULT_GAS: 500000n,
  MAX_FEE_PER_GAS: 1000000000n, // 1 gwei
  MAX_PRIORITY_FEE_PER_GAS: 100000000n, // 0.1 gwei
} as const;

/**
 * Explorer URLs for transaction links
 */
export const EXPLORER_URLS = {
  TRANSACTION: 'https://explorer.intuition.systems/tx/',
  ADDRESS: 'https://explorer.intuition.systems/address/',
};

/**
 * Chain parameters for MetaMask wallet_addEthereumChain
 * Derived from intuitionMainnet to avoid duplication
 */
export const CHAIN_PARAMS = {
  chainId: `0x${intuitionMainnet.id.toString(16)}`,
  chainName: intuitionMainnet.name,
  nativeCurrency: intuitionMainnet.nativeCurrency,
  rpcUrls: [intuitionMainnet.rpcUrls.default.http[0]],
  blockExplorerUrls: [intuitionMainnet.blockExplorers.default.url],
};
