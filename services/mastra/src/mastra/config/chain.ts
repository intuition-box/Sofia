import { defineChain } from 'viem';

/**
 * Intuition Mainnet Chain definition
 */
export const intuitionMainnet = defineChain({
  id: 1155,
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
});

export const RPC_URL = 'https://rpc.intuition.systems';
