import { useStorage } from "@plasmohq/storage/hook"
import { getClients } from '../lib/clients/viemClients'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { sessionWallet } from '../lib/services/sessionWallet'
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES } from '../lib/config/constants'
import type { TripleOnChainResult } from '../types/blockchain'
import type { Address, Hash } from 'viem'
import type { AccountAtom } from './useGetAtomAccount'

const logger = createHookLogger('useCreateFollowTriples')

export const useCreateFollowTriples = () => {
  const [address] = useStorage<string>("metamask-account")
  const [useSessionWallet] = useStorage<boolean>("sofia-use-session-wallet", false)


  // Use the official follow atom ID directly
  const getFollowPredicateId = (): string => {
    return '0x8f9b5dc2e7b8bd12f6762c839830672f1d13c08e72b5f09f194cafc153f2df8a'
  }

  // Helper function to determine which wallet to use
  const shouldUseSessionWallet = (transactionValue: bigint): boolean => {
    if (!useSessionWallet) return false

    const sessionStatus = sessionWallet.getStatus()
    if (!sessionStatus.isReady) return false

    return sessionWallet.canExecute(transactionValue)
  }

  // Helper function to execute transaction with appropriate wallet
  const executeTransaction = async (txParams: any): Promise<Hash> => {
    const canUseSession = shouldUseSessionWallet(txParams.value || 0n)

    const viemParams = {
      ...txParams,
      address: txParams.address as Address,
      account: txParams.account as Address
    }

    if (canUseSession) {
      return await sessionWallet.executeTransaction(viemParams) as Hash
    } else {
      const { walletClient } = await getClients()
      return await walletClient.writeContract(viemParams)
    }
  }

  // Helper function to create triple only (without deposit)
  const createTripleOnly = async (
    thingAtomId: string,
    predicateTermId: string,
    targetTermId: string
  ): Promise<{ tripleVaultId: string; txHash: string }> => {
    const { publicClient } = await getClients()

    console.log('🔨 createTripleOnly - Creating new follow triple', {
      thingAtomId,
      predicateTermId,
      targetTermId
    })

    // Use amount from working transaction for triple creation
    const minimalAmount = BigInt('12000000002000000') // Amount from working transaction

    // Simulate first to validate
    const simulation = await publicClient.simulateContract({
      address: BlockchainService.getContractAddress() as Address,
      abi: MultiVaultAbi,
      functionName: 'createTriples',
      args: [[thingAtomId as Address], [predicateTermId as Address], [targetTermId as Address], [minimalAmount]],
      value: minimalAmount,
      account: address as Address
    })

    // Estimate gas
    const gasEstimate = await publicClient.estimateContractGas({
      address: BlockchainService.getContractAddress() as Address,
      abi: MultiVaultAbi,
      functionName: 'createTriples',
      args: [[thingAtomId as Address], [predicateTermId as Address], [targetTermId as Address], [minimalAmount]],
      value: minimalAmount,
      account: address as Address
    })

    const txParams = {
      address: BlockchainService.getContractAddress() as Address,
      abi: MultiVaultAbi,
      functionName: 'createTriples',
      args: [
        [thingAtomId as Address],
        [predicateTermId as Address],
        [targetTermId as Address],
        [minimalAmount]
      ],
      value: minimalAmount,
      chain: SELECTED_CHAIN,
      gas: gasEstimate,
      maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
      account: address
    }

    const hash = await executeTransaction(txParams)

    console.log('🕒 Waiting for triple creation transaction receipt...', { hash })
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      timeout: 60000
    })

    if (receipt.status !== 'success') {
      throw new Error(`Triple creation failed with status: ${receipt.status}. Hash: ${hash}`)
    }

    const tripleIds = simulation.result as Address[]
    const tripleVaultId = tripleIds[0]

    console.log('✅ Triple created successfully', {
      txHash: hash,
      tripleVaultId: tripleVaultId
    })
    console.log(`🔗 Transaction: https://testnet.explorer.intuition.systems/tx/${hash}`)

    return {
      tripleVaultId,
      txHash: hash
    }
  }

  // Helper function to make deposit in existing triple
  const makeDepositInTriple = async (
    tripleVaultId: string,
    depositAmount: bigint
  ): Promise<{ txHash: string }> => {
    const { publicClient } = await getClients()

    // Determine which wallet/address will be used for the transaction
    const canUseSession = shouldUseSessionWallet(depositAmount)
    let receiverAddress: string
    let accountForTx: string

    if (canUseSession) {
      // Use session wallet address as receiver
      const sessionStatus = sessionWallet.getStatus()
      receiverAddress = sessionStatus.address || address
      accountForTx = receiverAddress
      console.log('💰 makeDepositInTriple - Using session wallet', {
        sessionAddress: receiverAddress,
        mainAddress: address
      })
    } else {
      // Use main wallet address
      receiverAddress = address
      accountForTx = address
      console.log('💰 makeDepositInTriple - Using main wallet', {
        mainAddress: address
      })
    }

    console.log('💰 makeDepositInTriple - Making deposit in existing triple', {
      tripleVaultId,
      depositAmount: depositAmount.toString(),
      receiverAddress,
      usingSessionWallet: canUseSession
    })

    // Estimate gas for deposit
    const gasEstimate = await publicClient.estimateContractGas({
      address: BlockchainService.getContractAddress() as Address,
      abi: MultiVaultAbi,
      functionName: 'deposit',
      args: [receiverAddress as Address, tripleVaultId as `0x${string}`, 1n, 0n],
      value: depositAmount,
      account: accountForTx as Address
    })

    const txParams = {
      address: BlockchainService.getContractAddress() as Address,
      abi: MultiVaultAbi,
      functionName: 'deposit',
      args: [
        receiverAddress as Address,
        tripleVaultId as `0x${string}`,
        1n,
        0n
      ],
      value: depositAmount,
      chain: SELECTED_CHAIN,
      gas: gasEstimate,
      maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
      account: accountForTx
    }

    const hash = await executeTransaction(txParams)

    console.log('🕒 Waiting for deposit transaction receipt...', { hash })
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      timeout: 60000
    })

    if (receipt.status !== 'success') {
      throw new Error(`Deposit failed with status: ${receipt.status}. Hash: ${hash}`)
    }

    console.log('✅ Deposit successful', {
      txHash: hash,
      tripleVaultId: tripleVaultId
    })
    console.log(`🔗 Transaction: https://testnet.explorer.intuition.systems/tx/${hash}`)

    return {
      txHash: hash
    }
  }

  const createFollowTriple = async (
    targetUser: AccountAtom,
    customWeight: bigint
  ): Promise<TripleOnChainResult> => {
    try {
      if (!address) {
        throw new Error('No wallet connected')
      }

      console.log('🔗 createFollowTriple - Starting follow process according to task.md', {
        currentUser: address,
        targetUser: targetUser.label,
        targetTermId: targetUser.termId,
        customWeight: customWeight.toString()
      })

      // OPTIMIZED: Get user atom + use official follow atom ID directly + use indexer termId for target
      console.log('🚀 createFollowTriple - Getting user atom and using official follow atom ID')
      
    
      const userTermId = "0x8d61ecf6e15472e15b1a0f63cd77f62aa57e6edcd3871d7a841f1056fb42b216"
      const predicateTermId = getFollowPredicateId()
      const targetTermId = targetUser.termId

      console.log('🔗 createFollowTriple - Using Thing atom for follow triple', {
        thingAtomId,
        predicateTermId,
        targetTermId,
        userLabel: address,
        predicateLabel: 'follow (official)',
        targetLabel: targetUser.label,
        predicateSource: 'official_atom'
      })

      // STEP 1: Vérification si le triple existe (selon task.md)
      console.log('🔍 STEP 1: Vérification si le triple existe')
      const tripleCheck = await BlockchainService.checkTripleExists(
        thingAtomId,
        predicateTermId,
        targetTermId
      )

      console.log('📋 Triple existence check result', {
        tripleExists: tripleCheck.exists,
        tripleVaultId: tripleCheck.tripleVaultId
      })

      if (tripleCheck.exists) {
        console.log('✅ createFollowTriple - Follow relationship already exists, returning existing triple')
        return {
          success: true,
          tripleVaultId: tripleCheck.tripleVaultId!,
          subjectVaultId: userTermId,
          predicateVaultId: predicateTermId,
          objectVaultId: targetTermId,
          source: 'existing',
          tripleHash: tripleCheck.tripleHash
        }
      }

      // Create the follow triple using termIds directly
      const { publicClient } = await getClients()
      const defaultCost = await BlockchainService.getTripleCost()
      const tripleCost = customWeight !== undefined ? customWeight : defaultCost

      console.log('💰 createFollowTriple - Final amount calculation', {
        customWeight: customWeight?.toString(),
        defaultCost: defaultCost.toString(),
        isUsingDefault: customWeight === undefined,
        finalTripleCost: tripleCost.toString()
      })

      // Simulate first to validate and get the result
      const simulation = await publicClient.simulateContract({
        address: BlockchainService.getContractAddress() as Address,
        abi: MultiVaultAbi,
        functionName: 'createTriples',
        args: [[userTermId as Address], [predicateTermId as Address], [targetTermId as Address], [tripleCost]],
        value: tripleCost,
        account: address as Address
      })

      const txParams = {
        address: BlockchainService.getContractAddress() as Address,
        abi: MultiVaultAbi,
        functionName: 'createTriples',
        args: [
          [userTermId as Address],
          [predicateTermId as Address],
          [targetTermId as Address],
          [tripleCost]
        ],
        value: tripleCost,
        chain: SELECTED_CHAIN,
        // Remove hardcoded gas - let Viem estimate automatically
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
        account: address
      }

      const hash = await executeTransaction(txParams)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      // Use the simulation result (done before transaction)
      const tripleIds = simulation.result as Address[]
      const tripleVaultId = tripleIds[0]

      return {
        success: true,
        tripleVaultId: tripleVaultId,
        txHash: depositResult.txHash,
        subjectVaultId: thingAtomId,
        predicateVaultId: predicateTermId,
        objectVaultId: targetTermId,
        source: tripleCheck.exists ? 'deposit' : 'created',
        tripleHash: tripleVaultId
      }

    } catch (error) {
      logger.error('Follow triple creation failed', error)
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      throw new Error(`Follow triple creation failed: ${errorMessage}`)
    }
  }

  return {
    createFollowTriple
  }
}