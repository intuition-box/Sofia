/**
 * Wallet connection types (MetaMask integration)
 * Extends existing wallet functionality with tracking data
 */

// MetaMask connection data
export interface MetaMaskConnection {
  account: string;
  chainId: string;
  isConnected: boolean;
  networkName?: string;
}

// Wallet connection state
export interface WalletState {
  isConnected: boolean;
  account: string | null;
  chainId: string | null;
  error: string | null;
  isLoading: boolean;
}

// Wallet connection events
export interface WalletEvent {
  type: 'connect' | 'disconnect' | 'account_change' | 'chain_change' | 'error';
  data?: {
    account?: string;
    chainId?: string;
    error?: string;
  };
}