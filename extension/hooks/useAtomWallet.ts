import { useState, useEffect } from 'react'
import { getClients } from '../lib/viemClients'
import { ATOM_WALLET_ABI, ATOM_WALLET_FACTORY_ABI } from '../contracts/abis'
import { ATOM_WALLET_FACTORY_ADDRESS, ENTRY_POINT_ADDRESS, MULTIVAULT_CONTRACT_ADDRESS } from '../lib/config'
import { useStorage } from "@plasmohq/storage/hook"
import { encodeFunctionData } from 'viem'

export interface AtomWalletInfo {
  address: string
  isDeployed: boolean
  owner: string
  deposit: bigint
}

export interface BatchOperation {
  target: string
  value: bigint
  data: `0x${string}`
  description: string
}

export const useAtomWallet = () => {
  const [address] = useStorage<string>("metamask-account")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [walletInfo, setWalletInfo] = useState<AtomWalletInfo | null>(null)

  // Compute AtomWallet address for a given atomId
  const computeWalletAddress = async (atomId: string): Promise<string> => {
    try {
      const { publicClient } = await getClients()
      
      const walletAddress = await publicClient.readContract({
        address: ATOM_WALLET_FACTORY_ADDRESS,
        abi: ATOM_WALLET_FACTORY_ABI,
        functionName: 'computeAtomWalletAddr',
        args: [atomId as `0x${string}`]
      }) as string

      return walletAddress
    } catch (error) {
      console.error('❌ Failed to compute wallet address:', error)
      throw error
    }
  }

  // Deploy AtomWallet for a given atomId
  const deployAtomWallet = async (atomId: string): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🚀 Deploying AtomWallet for atomId:', atomId)
      
      const { walletClient, publicClient } = await getClients()

      // Deploy via factory
      const txHash = await walletClient.writeContract({
        address: ATOM_WALLET_FACTORY_ADDRESS,
        abi: ATOM_WALLET_FACTORY_ABI,
        functionName: 'deployAtomWallet',
        args: [atomId as `0x${string}`],
        gas: 3000000n
      })

      console.log('🔗 AtomWallet deployment tx:', txHash)

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash
      })

      if (receipt.status !== 'success') {
        throw new Error(`AtomWallet deployment failed: ${receipt.status}`)
      }

      // Get the deployed wallet address
      const walletAddress = await computeWalletAddress(atomId)
      console.log('✅ AtomWallet deployed at:', walletAddress)

      return walletAddress
    } catch (error) {
      console.error('❌ AtomWallet deployment failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(new Error(`AtomWallet deployment failed: ${errorMessage}`))
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Check if wallet is already deployed and get its info
  const getWalletInfo = async (walletAddress: string): Promise<AtomWalletInfo> => {
    try {
      const { publicClient } = await getClients()

      // Check if contract exists (has code)
      const code = await publicClient.getBytecode({ address: walletAddress as `0x${string}` })
      const isDeployed = code !== undefined && code !== '0x'

      if (!isDeployed) {
        return {
          address: walletAddress,
          isDeployed: false,
          owner: '0x0000000000000000000000000000000000000000',
          deposit: 0n
        }
      }

      // Get wallet info if deployed
      const [owner, deposit] = await Promise.all([
        publicClient.readContract({
          address: walletAddress as `0x${string}`,
          abi: ATOM_WALLET_ABI,
          functionName: 'owner'
        }) as Promise<string>,
        publicClient.readContract({
          address: walletAddress as `0x${string}`,
          abi: ATOM_WALLET_ABI,
          functionName: 'getDeposit'
        }) as Promise<bigint>
      ])

      return {
        address: walletAddress,
        isDeployed: true,
        owner,
        deposit
      }
    } catch (error) {
      console.error('❌ Failed to get wallet info:', error)
      throw error
    }
  }

  // Execute a single operation through AtomWallet
  const executeOperation = async (
    walletAddress: string,
    target: string,
    value: bigint,
    data: `0x${string}`
  ): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 Executing operation via AtomWallet:', { walletAddress, target, value: value.toString() })
      
      const { walletClient, publicClient } = await getClients()

      const txHash = await walletClient.writeContract({
        address: walletAddress as `0x${string}`,
        abi: ATOM_WALLET_ABI,
        functionName: 'execute',
        args: [target as `0x${string}`, value, data],
        gas: 2000000n
      })

      console.log('🔗 Operation tx:', txHash)

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash
      })

      if (receipt.status !== 'success') {
        throw new Error(`Operation failed: ${receipt.status}`)
      }

      console.log('✅ Operation executed successfully')
      return txHash
    } catch (error) {
      console.error('❌ Operation execution failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(new Error(`Operation execution failed: ${errorMessage}`))
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Execute batch operations through AtomWallet
  const executeBatch = async (
    walletAddress: string,
    operations: BatchOperation[]
  ): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 Executing batch operations via AtomWallet:', operations.length, 'operations')
      
      const { walletClient, publicClient } = await getClients()

      const targets = operations.map(op => op.target as `0x${string}`)
      const values = operations.map(op => op.value)
      const dataArray = operations.map(op => op.data)

      const txHash = await walletClient.writeContract({
        address: walletAddress as `0x${string}`,
        abi: ATOM_WALLET_ABI,
        functionName: 'executeBatch',
        args: [targets, values, dataArray],
        gas: BigInt(1000000 + (operations.length * 500000)) // Scale gas with operations
      })

      console.log('🔗 Batch operation tx:', txHash)

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash
      })

      if (receipt.status !== 'success') {
        throw new Error(`Batch operation failed: ${receipt.status}`)
      }

      console.log('✅ Batch operations executed successfully')
      return txHash
    } catch (error) {
      console.error('❌ Batch execution failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(new Error(`Batch execution failed: ${errorMessage}`))
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Helper to create batch operations for atom/triple creation
  const createAtomOperation = (atomData: { name: string; description?: string; url: string }): BatchOperation => {
    // This will be implemented to create the operation for createAtoms
    const data = encodeFunctionData({
      abi: [], // We'll need to add the specific function ABI
      functionName: 'createAtoms',
      args: [] // Will be filled with actual atom data
    })

    return {
      target: MULTIVAULT_CONTRACT_ADDRESS,
      value: 0n, // Will be calculated based on atom cost
      data: data as `0x${string}`,
      description: `Create atom: ${atomData.name}`
    }
  }

  return {
    // State
    isLoading,
    error,
    walletInfo,
    
    // Core functions
    computeWalletAddress,
    deployAtomWallet,
    getWalletInfo,
    executeOperation,
    executeBatch,
    
    // Helpers
    createAtomOperation
  }
}