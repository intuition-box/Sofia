// Types pour la gestion des wallets
// Remplacement de viem par un type simple pour éviter la dépendance
export type Address = string

export interface WalletState {
  isConnected: boolean
  address?: Address
  balance?: string
  chainId?: number
  isConnecting?: boolean
  error?: string
}

export interface WalletConnection {
  connect(): Promise<void>
  disconnect(): Promise<void>
  getBalance(address: Address): Promise<string>
  switchChain(chainId: number): Promise<void>
}

export interface WalletConfig {
  supportedChains: number[]
  defaultChain: number
  autoConnect: boolean
} 