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

      // Use the official Thing atom ID from working transaction
      const thingAtomId = '0x8d61ecf6e15472e15b1a0f63cd77f62aa57e6edcd3871d7a841f1056fb42b216'
      const predicateTermId = getFollowPredicateId()
      const targetTermId = targetUser.termId

      console.log('🔗 createFollowTriple - Using Thing atom for follow triple', {
        thingAtomId,
        predicateTermId,
        targetTermId,
        targetLabel: targetUser.label
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

      let tripleVaultId: string
      let createTxHash: string | undefined

      if (!tripleCheck.exists) {
        // STEP 2: S'il n'existe pas, créer le triple (selon task.md)
        console.log('🔨 STEP 2: Triple n\'existe pas, création du triple')

        const creationResult = await createTripleOnly(
          thingAtomId,
          predicateTermId,
          targetTermId
        )

        tripleVaultId = creationResult.tripleVaultId
        createTxHash = creationResult.txHash

        console.log('✅ STEP 2 COMPLETED: Triple créé avec succès', {
          tripleVaultId,
          createTxHash
        })

        // Wait a bit for the triple to be fully indexed on the blockchain
        console.log('⏳ Waiting for triple to be indexed...')
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 seconds delay

      } else {
        tripleVaultId = tripleCheck.tripleVaultId!
        console.log('📋 Triple existe déjà, pas besoin de création', {
          existingTripleVaultId: tripleVaultId
        })
      }

      // STEP 3: Faire le deposit (selon task.md)
      console.log('💰 STEP 3: Faire le deposit dans le triple', {
        tripleVaultId,
        depositAmount: customWeight.toString(),
        wasJustCreated: !tripleCheck.exists
      })

      const depositResult = await makeDepositInTriple(
        tripleVaultId,
        customWeight
      )

      console.log('✅ STEP 3 COMPLETED: Deposit réalisé avec succès', {
        depositTxHash: depositResult.txHash,
        tripleVaultId
      })

      console.log('🎉 PROCESSUS TERMINÉ: Follow relationship établie selon task.md', {
        tripleCreated: !tripleCheck.exists,
        createTxHash: createTxHash || 'N/A (triple existait déjà)',
        depositTxHash: depositResult.txHash,
        finalTripleVaultId: tripleVaultId
      })

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