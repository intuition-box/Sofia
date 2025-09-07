import { useState, useEffect } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { getClients } from '../lib/viemClients'
import { ATOM_WALLET_FACTORY_ADDRESS, MULTIVAULT_CONTRACT_ADDRESS, SELECTED_CHAIN, ENTRY_POINT_ADDRESS } from '../lib/config'
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
        name: targetAddress,
        description: `SofIA browser user on Intuition Testnet`,
        url: `https://testnet.explorer.intuition.systems/address/${targetAddress}`
      })

      const userAtomId = atomResult.vaultId
      console.log('✅ User atom created!')
      console.log('📋 User AtomID:', userAtomId)
      console.log('🔗 Atom creation tx:', atomResult.txHash)
      console.log('🏭 Factory Address:', ATOM_WALLET_FACTORY_ADDRESS)


      // Step 4: Verify atomId exists before deployment
      console.log('🔍 Verifying atomId exists in MultiVault...')
      const atomExists = await publicClient.readContract({
        address: MULTIVAULT_CONTRACT_ADDRESS,
        abi: MULTIVAULT_V2_ABI,
        functionName: 'isTermCreated',
        args: [userAtomId]
      }) as boolean
      
      console.log('📊 AtomId exists in MultiVault:', atomExists)
      
      if (!atomExists) {
        throw new Error(`AtomId ${userAtomId} not found in MultiVault - cannot deploy AtomWallet`)
      }
      
      // Step 5: Deploy the AtomWallet
      console.log('🚀 Deploying AtomWallet...')
      
      // Get deposit amount 
      console.log('💰 Getting atomDepositAmount for factory call...')
      let depositAmount = BigInt(0)
      
      try {
        depositAmount = await publicClient.readContract({
          address: MULTIVAULT_CONTRACT_ADDRESS,
          abi: MULTIVAULT_V2_ABI,
          functionName: 'getAtomCost'
        }) as bigint
        console.log('💰 Atom deposit amount:', depositAmount.toString())
      } catch (error) {
        console.error('⚠️ Could not get atomDepositAmount:', error)
        depositAmount = BigInt('1000000001000000')
        console.log('💰 Using fallback deposit amount:', depositAmount.toString())
      }

      console.log('🔧 Deploying AtomWallet with deposit amount...')

      const txHash = await walletClient.writeContract({
        address: ATOM_WALLET_FACTORY_ADDRESS,
        abi: ATOM_WALLET_FACTORY_ABI,
        functionName: 'deployAtomWallet',
        args: [userAtomId],
        account: targetAddress as `0x${string}`,
        chain: SELECTED_CHAIN,
        gas: BigInt(500000),
        value: depositAmount 
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

  return {
    accountInfo,
    isLoading,
    error,
    deployAtomWallet,
    initializeSmartAccount,
    getAccountBalance: async () => {
      if (!accountInfo) return BigInt(0)
      const { publicClient } = await getClients()
      return await publicClient.getBalance({ address: accountInfo.address })
    }
  }
}

export default useSmartAccount