import { generatePrivateKey, privateKeyToAccount, type LocalAccount } from 'viem/accounts'
import { createWalletClient, createPublicClient, http, formatEther, parseEther, encodeFunctionData } from 'viem'
import { SELECTED_CHAIN } from '../config/chainConfig'
import { getMetaProvider } from './metamask'
import { getClients } from '../clients/viemClients'

interface SessionWalletConfig {
  privateKey: string
  address: string
  balance: string // Stocké en string pour éviter BigInt serialization
  isActive: boolean
  createdAt: number
}

export class SessionWallet {
  private account: LocalAccount | null = null
  private walletClient: any = null
  private config: SessionWalletConfig | null = null

  constructor() {
    this.loadFromStorage()
  }

  // Créer nouveau session wallet
  async createNew(): Promise<SessionWalletConfig> {
    const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(privateKey)
    
    this.account = account
    this.walletClient = createWalletClient({
      account,
      chain: SELECTED_CHAIN,
      transport: http('https://testnet.rpc.intuition.systems')
    })

    this.config = {
      privateKey,
      address: account.address,
      balance: "0",
      isActive: true,
      createdAt: Date.now()
    }

    await this.saveToStorage()
    console.log('🔥 Session wallet created:', account.address)
    
    return this.config
  }

  // Charger wallet existant
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('sofia-session-wallet')
      if (stored) {
        this.config = JSON.parse(stored)
        if (this.config?.privateKey) {
          this.account = privateKeyToAccount(this.config.privateKey as `0x${string}`)
          this.walletClient = createWalletClient({
            account: this.account,
            chain: SELECTED_CHAIN,
            transport: http('https://testnet.rpc.intuition.systems')
          })
          console.log('📂 Session wallet loaded:', this.config.address)
        }
      }
    } catch (error) {
      console.error('Failed to load session wallet:', error)
      this.destroy()
    }
  }

  // Sauvegarder en storage
  private async saveToStorage(): Promise<void> {
    if (this.config) {
      localStorage.setItem('sofia-session-wallet', JSON.stringify(this.config))
    }
  }

  // Obtenir balance actuelle (TRUST)
  async getBalance(): Promise<bigint> {
    if (!this.account) return 0n
    
    try {
      const { publicClient } = await getClients()
      const balance = await publicClient.getBalance({
        address: this.account.address
      })
      
      if (this.config) {
        this.config.balance = balance.toString()
        await this.saveToStorage()
      }
      
      return balance
    } catch (error) {
      console.error('Failed to get TRUST balance:', error)
      return 0n
    }
  }

  // Refill manuel depuis MetaMask (TRUST)
  async refillFromMetaMask(amount: string): Promise<string> {
    if (!this.account) {
      throw new Error('No session wallet created')
    }

    try {
      const provider = await getMetaProvider()
      const accounts = await provider.request({ method: 'eth_accounts' })
      
      if (!accounts || accounts.length === 0) {
        throw new Error('MetaMask not connected')
      }

      const amountWei = parseEther(amount) // TRUST a 18 decimales comme ETH
      
      // Transaction MetaMask → Session wallet (TRUST)
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: this.account.address,
          value: `0x${amountWei.toString(16)}`,
          gas: '0x5208', // 21000 gas for simple transfer
        }]
      })

      console.log('💰 TRUST refill transaction sent:', txHash)
      
      // Attendre confirmation et mettre à jour balance
      setTimeout(async () => {
        await this.getBalance()
      }, 2000)

      return txHash
    } catch (error) {
      console.error('TRUST refill failed:', error)
      throw error
    }
  }

  // Transaction automatique SANS popup avec sendRawTransaction
  async executeTransaction(txParams: any): Promise<string> {
    if (!this.account) {
      throw new Error('Session wallet not ready')
    }

    const currentBalance = await this.getBalance()
    
    if (currentBalance < txParams.value) {
      throw new Error('INSUFFICIENT_BALANCE')
    }

    try {
      console.log('🔥 Session wallet: preparing raw transaction')
      
      // Créer publicClient pour sendRawTransaction
      const publicClient = createPublicClient({
        chain: SELECTED_CHAIN,
        transport: http('https://testnet.rpc.intuition.systems')
      })

      // Encoder les données de la fonction
      const data = encodeFunctionData({
        abi: txParams.abi,
        functionName: txParams.functionName,
        args: txParams.args
      })

      // Préparer la transaction EIP-1559 explicite
      const nonce = await publicClient.getTransactionCount({
        address: this.account.address
      })

      const transactionRequest = {
        to: txParams.address as `0x${string}`,
        value: txParams.value,
        data: data,
        gas: txParams.gas,
        maxFeePerGas: txParams.maxFeePerGas,
        maxPriorityFeePerGas: txParams.maxPriorityFeePerGas,
        chainId: SELECTED_CHAIN.id,
        nonce: nonce
        // Pas besoin de spécifier type, viem le détecte automatiquement avec maxFeePerGas
      }

      console.log('📋 Transaction request:', transactionRequest)

      // Signer la transaction localement
      const signedTransaction = await this.account.signTransaction(transactionRequest)
      
      console.log('🔏 Transaction signed locally')

      // Envoyer la transaction signée
      const hash = await publicClient.sendRawTransaction({
        serializedTransaction: signedTransaction
      })

      console.log('⚡ Raw transaction sent:', hash)
      
      // Mettre à jour balance après transaction
      setTimeout(async () => {
        await this.getBalance()
      }, 2000)
      
      return hash
    } catch (error) {
      console.error('Session wallet raw transaction failed:', error)
      throw error
    }
  }

  // Détruire session wallet
  destroy(): void {
    this.account = null
    this.walletClient = null
    this.config = null
    localStorage.removeItem('sofia-session-wallet')
    console.log('🗑️ Session wallet destroyed')
  }

  // Status du wallet
  getStatus(): {
    isReady: boolean
    address?: string
    balance?: string
    balanceWei?: bigint
  } {
    if (!this.config || !this.account) {
      return { isReady: false }
    }

    return {
      isReady: true,
      address: this.config.address,
      balance: formatEther(BigInt(this.config.balance)),
      balanceWei: BigInt(this.config.balance)
    }
  }

  // Vérifier si transaction possible
  canExecute(value: bigint): boolean {
    return this.config ? BigInt(this.config.balance) >= value : false
  }
}

// Instance singleton
export const sessionWallet = new SessionWallet()