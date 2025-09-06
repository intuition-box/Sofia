import { useState, useEffect } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { getClients } from '../lib/viemClients'
import { ATOM_WALLET_FACTORY_ADDRESS, MULTIVAULT_CONTRACT_ADDRESS } from '../lib/config'
import { ATOM_WALLET_FACTORY_ABI, ATOM_WALLET_ABI, MULTIVAULT_V2_ABI } from '../contracts/abis'
import { encodeFunctionData, stringToHex, keccak256, type Address } from 'viem'
import { useCreateAtom } from './useCreateAtom'

export interface SmartAccountInfo {
  address: Address
  isDeployed: boolean
  balance: bigint
  owner: Address
}

export interface UserOperation {
  target: Address
  value: bigint
  data: `0x${string}`
  description: string
}

export const useSmartAccount = () => {
  const [address] = useStorage<string>("metamask-account")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [accountInfo, setAccountInfo] = useState<SmartAccountInfo | null>(null)
  
  // Use existing hook for atom creation
  const createAtomHook = useCreateAtom()

  // Compute AtomWallet address from atomId
  const computeWalletAddress = async (atomId: string): Promise<Address> => {
    if (!atomId) throw new Error('AtomId is required')

    try {
      const { publicClient } = await getClients()

      const walletAddress = await publicClient.readContract({
        address: ATOM_WALLET_FACTORY_ADDRESS,
        abi: ATOM_WALLET_FACTORY_ABI,
        functionName: 'computeAtomWalletAddr',
        args: [atomId]
      }) as Address

      return walletAddress
    } catch (error) {
      console.error('❌ Failed to compute wallet address:', error)
      throw error
    }
  }

  // Initialize Smart Account info - requires atomId from created atom
  const initializeSmartAccount = async (atomId: string, customAddress?: string) => {
    const targetAddress = customAddress || address
    console.log('🔍 initializeSmartAccount called with atomId:', atomId, 'address:', targetAddress)
    if (!targetAddress) {
      console.log('❌ No address provided to initializeSmartAccount')
      return null
    }
    if (!atomId) {
      console.log('❌ No atomId provided to initializeSmartAccount')
      return null
    }

    try {
      console.log('🚀 Computing wallet address from atomId...')
      const { publicClient } = await getClients()
      const walletAddress = await computeWalletAddress(atomId)
      console.log('📍 Computed wallet address:', walletAddress)

      // Check if wallet is deployed
      console.log('🔍 Checking if wallet is deployed...')
      const code = await publicClient.getBytecode({ address: walletAddress })
      const isDeployed = code !== undefined && code !== '0x'
      console.log('🏭 Wallet deployed:', isDeployed, 'code length:', code?.length || 0)

      let balance = 0n
      let owner = targetAddress as Address

      if (isDeployed) {
        console.log('📊 Getting wallet info (balance & owner)...')
        // Get wallet info
        const [walletBalance, walletOwner] = await Promise.all([
          publicClient.getBalance({ address: walletAddress }),
          publicClient.readContract({
            address: walletAddress,
            abi: ATOM_WALLET_ABI,
            functionName: 'owner'
          }) as Promise<Address>
        ])
        
        balance = walletBalance
        owner = walletOwner
        console.log('💰 Balance:', balance.toString(), 'Owner:', owner)
      }

      const info: SmartAccountInfo = {
        address: walletAddress,
        isDeployed,
        balance,
        owner
      }

      console.log('✅ Smart Account info created:', info)
      setAccountInfo(info)
      return info

    } catch (error) {
      console.error('❌ Smart account initialization failed:', error)
      setError(error as Error)
      return null
    }
  }

  // Deploy AtomWallet for current user
  const deployAtomWallet = async (customAddress?: string): Promise<string> => {
    const targetAddress = customAddress || address
    if (!targetAddress) throw new Error('No MetaMask account connected')
    
    setIsLoading(true)
    setError(null)

    try {
      const { walletClient, publicClient } = await getClients()

      console.log('🚀 Deploying AtomWallet for user:', targetAddress)

      // Step 1: Create user atom with existing hook
      console.log('📝 Creating user atom with useCreateAtom hook...')
      const atomResult = await createAtomHook.createAtomWithMultivault({
        name: `User Profile - ${targetAddress}`,
        description: `Smart Wallet user profile for ${targetAddress}`,
        url: `https://app.intuition.systems/user/${targetAddress}`,
        image: ''
      })

      const userAtomId = atomResult.vaultId
      console.log('✅ User atom created!')
      console.log('📋 User AtomID:', userAtomId)
      console.log('🔗 Atom creation tx:', atomResult.txHash)
      console.log('🏭 Factory Address:', ATOM_WALLET_FACTORY_ADDRESS)

      // Step 2: Check if wallet already exists for this atomId
      const predictedAddress = await computeWalletAddress(userAtomId)
      console.log('📍 Predicted wallet address:', predictedAddress)

      const existingCode = await publicClient.getBytecode({ address: predictedAddress })
      console.log('🔍 Existing bytecode length:', existingCode?.length || 0)
      
      if (existingCode !== undefined && existingCode !== '0x' && existingCode.length > 2) {
        console.log('⚠️ AtomWallet already exists at this address!')
        
        // Try to get the owner to confirm it's the right wallet
        try {
          const owner = await publicClient.readContract({
            address: predictedAddress,
            abi: ATOM_WALLET_ABI,
            functionName: 'owner'
          }) as string
          
          console.log('👤 Existing wallet owner:', owner)
          console.log('👤 Current user:', targetAddress)
          
          if (owner.toLowerCase() === targetAddress.toLowerCase()) {
            console.log('✅ Wallet already belongs to current user!')
            await initializeSmartAccount(userAtomId, targetAddress)
            return 'already-deployed'
          } else {
            throw new Error(`AtomWallet already deployed but owned by different address: ${owner}`)
          }
        } catch (ownerError) {
          console.error('❌ Could not verify wallet ownership:', ownerError)
          throw new Error(`AtomWallet exists at ${predictedAddress} but cannot verify ownership`)
        }
      }

      // Step 3: Deploy the AtomWallet
      console.log('🚀 Deploying AtomWallet...')
      
      const txHash = await walletClient.writeContract({
        address: ATOM_WALLET_FACTORY_ADDRESS,
        abi: ATOM_WALLET_FACTORY_ABI,
        functionName: 'deployAtomWallet',
        args: [userAtomId]
      })

      console.log('🔗 AtomWallet deployment tx:', txHash)

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      
      console.log('📋 Deployment receipt:', receipt)
      
      if (receipt.status !== 'success') {
        throw new Error(`Deployment failed: ${receipt.status}`)
      }
      
      console.log('✅ AtomWallet deployed successfully!')
      
      // Refresh account info with the atomId
      await initializeSmartAccount(userAtomId, targetAddress)
      
      return txHash
    } catch (error) {
      console.error('❌ AtomWallet deployment failed:', error)
      
      // Log more details about the error
      if (error && typeof error === 'object' && 'cause' in error) {
        console.error('📋 Error cause:', error.cause)
      }
      if (error && typeof error === 'object' && 'details' in error) {
        console.error('📋 Error details:', error.details)
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(new Error(`Deployment failed: ${errorMessage}`))
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Execute batch operations via AtomWallet
  const executeBatch = async (operations: UserOperation[]): Promise<string> => {
    if (!accountInfo?.address) {
      throw new Error('Smart account not initialized')
    }

    if (!accountInfo.isDeployed) {
      throw new Error('AtomWallet not deployed. Please deploy first.')
    }

    setIsLoading(true)
    setError(null)

    try {
      const { walletClient, publicClient } = await getClients()

      console.log('🔄 Executing', operations.length, 'operations via AtomWallet')

      const targets = operations.map(op => op.target)
      const values = operations.map(op => op.value) 
      const dataArray = operations.map(op => op.data)

      // Calculate total value needed
      const totalValue = values.reduce((sum, val) => sum + val, 0n)

      const txHash = await walletClient.writeContract({
        address: accountInfo.address,
        abi: ATOM_WALLET_ABI,
        functionName: 'executeBatch',
        args: [targets, values, dataArray],
        value: totalValue,
        gas: BigInt(1000000 + (operations.length * 500000))
      })

      console.log('🔗 Batch execution tx:', txHash)

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      
      if (receipt.status !== 'success') {
        throw new Error(`Batch execution failed: ${receipt.status}`)
      }

      console.log('✅ Batch operations executed successfully')
      
      // Refresh account info
      await initializeSmartAccount()
      
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

  // Execute single operation (wrapper around executeBatch)
  const executeOperation = async (operation: UserOperation): Promise<string> => {
    return executeBatch([operation])
  }

  // Helper to create atom operation
  const createAtomOperation = async (atomData: {
    name: string
    description?: string
    url: string
  }): Promise<UserOperation> => {
    try {
      const { publicClient } = await getClients()

      // Get atom cost
      const atomCost = await publicClient.readContract({
        address: MULTIVAULT_CONTRACT_ADDRESS,
        abi: MULTIVAULT_V2_ABI,
        functionName: 'getAtomCost'
      }) as bigint

      // Simple IPFS URI (in production, use actual IPFS pinning)
      const ipfsUri = `temp://${atomData.name}-${Date.now()}`
      const encodedData = stringToHex(ipfsUri)

      const callData = encodeFunctionData({
        abi: MULTIVAULT_V2_ABI,
        functionName: 'createAtoms',
        args: [[encodedData], [atomCost]]
      })

      return {
        target: MULTIVAULT_CONTRACT_ADDRESS,
        value: atomCost,
        data: callData,
        description: `Create atom: ${atomData.name}`
      }
    } catch (error) {
      console.error('❌ Failed to create atom operation:', error)
      throw error
    }
  }

  // Auto-initialize when address changes
  useEffect(() => {
    console.log('🔍 useSmartAccount useEffect - address changed:', address)
    if (address) {
      console.log('🚀 Initializing Smart Account for address:', address)
      initializeSmartAccount().catch(console.error)
    } else {
      console.log('❌ No address provided, clearing account info')
      setAccountInfo(null)
    }
  }, [address])

  return {
    // State
    isLoading,
    error,
    accountInfo,
    
    // Core functions
    initializeSmartAccount,
    deployAtomWallet,
    executeOperation,
    executeBatch,
    
    // Helpers
    createAtomOperation,
    computeWalletAddress
  }
}