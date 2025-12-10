import { useState, useCallback, useRef } from 'react'
import { getClients } from '../lib/clients/viemClients'
import { SofiaFeeProxyAbi } from '../ABI/SofiaFeeProxy'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { usePrivy } from '@privy-io/react-auth'
import { useCreateAtom } from './useCreateAtom'
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES, SUBJECT_IDS, PREDICATE_IDS } from '../lib/config/constants'
import type { Address } from '../types/viem'

const logger = createHookLogger('useTrustAccount')

// Curve ID for creation deposits (1 = linear/upvote, 2 = progressive/shares)
const CREATION_CURVE_ID = 1n

// Minimum deposit for triple creation (0.01 TRUST in wei)
const MIN_TRIPLE_DEPOSIT = 10000000000000000n // 10^16 wei = 0.01 ether

export interface TrustAccountResult {
  trustAccount: (accountVaultId: string, accountLabel: string, customWeight?: bigint) => Promise<void>
  loading: boolean
  error: string | null
  success: boolean
  tripleVaultId: string | null
  operationType: 'created' | 'deposit' | null
}

export const useTrustAccount = (): TrustAccountResult => {
  const { ensureProxyApproval } = useCreateAtom()
  const { user } = usePrivy()
  const address = user?.wallet?.address

  // Use refs to preserve state during re-renders from parent
  const loadingRef = useRef(false)
  const successRef = useRef(false)
  const errorRef = useRef<string | null>(null)
  const tripleVaultIdRef = useRef<string | null>(null)

  // Local state for component updates
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tripleVaultId, setTripleVaultId] = useState<string | null>(null)
  const [operationType, setOperationType] = useState<'created' | 'deposit' | null>(null)

  // Get universal "I" subject atom (same for all users)
  const getUserAtom = useCallback(async () => {
    return {
      vaultId: SUBJECT_IDS.I,
      success: true,
      ipfsUri: '',
      name: 'I'
    }
  }, [])

  // Get the existing "trusts" predicate atom (no need to create, it already exists on-chain)
  const getTrustPredicateAtom = useCallback(async () => {
    // Use the existing TRUSTS predicate from the blockchain
    return {
      vaultId: PREDICATE_IDS.TRUSTS,
      ipfsUri: '',
      name: 'trusts'
    }
  }, [])

  const trustAccount = useCallback(async (accountVaultId: string, accountLabel: string, customWeight?: bigint) => {
    try {
      if (!address) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      }

      // Ensure proxy is approved before any creation (one-time approval)
      await ensureProxyApproval()

      logger.info('Creating trust triplet for account', { accountVaultId, accountLabel, customWeight: customWeight?.toString() })

      // Update refs and state
      loadingRef.current = true
      successRef.current = false
      errorRef.current = null
      setLoading(true)
      setSuccess(false)
      setError(null)

      logger.debug('Step 1: Getting user atom (I)')
      const userAtom = await getUserAtom()
      logger.debug('User atom obtained', { vaultId: userAtom.vaultId })

      logger.debug('Step 2: Getting trust predicate atom')
      const trustPredicate = await getTrustPredicateAtom()
      logger.debug('Trust predicate obtained', { vaultId: trustPredicate.vaultId })

      logger.debug('Step 3: Using existing account atom', { accountVaultId, accountLabel })

      // Check if triple already exists
      logger.debug('Step 4: Checking if triple exists')
      const tripleCheck = await BlockchainService.checkTripleExists(
        userAtom.vaultId,
        trustPredicate.vaultId,
        accountVaultId
      )

      if (tripleCheck.exists) {
        // Triple exists - deposit on it instead of just returning
        const { walletClient, publicClient } = await getClients()
        const contractAddress = BlockchainService.getContractAddress()

        // Calculate deposit amount
        let depositAmount: bigint
        if (customWeight !== undefined) {
          depositAmount = customWeight
        } else {
          const feeCost = await BlockchainService.getTripleCost()
          depositAmount = feeCost
        }
        const curveId = 1n // Curve ID for triple deposits (linear/upvote)

        logger.debug('Triple exists, performing deposit instead', {
          tripleVaultId: tripleCheck.tripleVaultId,
          desiredAmount: customWeight?.toString(),
          desiredAmountInTRUST: customWeight ? Number(customWeight) / 1e18 : 'N/A',
          depositAmount: depositAmount.toString(),
          depositAmountInTRUST: Number(depositAmount) / 1e18
        })

        // Calculate total cost including Sofia fees
        const totalDepositCost = await BlockchainService.getTotalDepositCost(depositAmount)

        // Simulate deposit first
        await publicClient.simulateContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'deposit',
          args: [
            address as Address,                    // receiver
            tripleCheck.tripleVaultId as Address,  // termId
            curveId,                               // curveId
            0n                                     // minShares
          ],
          value: totalDepositCost,
          account: walletClient.account
        })

        // Execute deposit
        const hash = await walletClient.writeContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'deposit',
          args: [
            address as Address,
            tripleCheck.tripleVaultId as Address,
            curveId,
            0n
          ],
          value: totalDepositCost,
          chain: SELECTED_CHAIN,
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: address as Address
        })

        const receipt = await publicClient.waitForTransactionReceipt({ hash })

        if (receipt.status !== 'success') {
          throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
        }

        logger.info('✅ Deposit on existing triple successful', {
          tripleVaultId: tripleCheck.tripleVaultId,
          txHash: hash
        })

        loadingRef.current = false
        successRef.current = true
        tripleVaultIdRef.current = tripleCheck.tripleVaultId!

        setLoading(false)
        setSuccess(true)
        setTripleVaultId(tripleCheck.tripleVaultId!)
        setOperationType('deposit')
        return
      }

      // Create the triple
      logger.debug('Step 5: Creating triple on-chain')
      const { walletClient, publicClient } = await getClients()
      const contractAddress = BlockchainService.getContractAddress()

      const tripleCost = await BlockchainService.getTripleCost()

      // EXACT pattern from useCreateTripleOnChain.ts (lines 234-266):
      // depositAmount = what user wants to deposit (without tripleCost)
      // multiVaultCost = tripleCost + depositAmount
      // totalCost = getTotalCreationCost(1, depositAmount, multiVaultCost)
      // args assets = [depositAmount] (WITHOUT tripleCost)
      const depositAmount = customWeight !== undefined && customWeight > 0n ? customWeight : MIN_TRIPLE_DEPOSIT
      const multiVaultCost = tripleCost + depositAmount
      const totalCost = await BlockchainService.getTotalCreationCost(1, depositAmount, multiVaultCost)

      logger.debug('Triple creation cost', {
        tripleCost: tripleCost.toString(),
        tripleCostInTRUST: Number(tripleCost) / 1e18,
        depositAmount: depositAmount.toString(),
        depositAmountInTRUST: Number(depositAmount) / 1e18,
        multiVaultCost: multiVaultCost.toString(),
        multiVaultCostInTRUST: Number(multiVaultCost) / 1e18,
        totalCost: totalCost.toString(),
        totalCostInTRUST: Number(totalCost) / 1e18,
        customWeight: customWeight?.toString(),
        customWeightInTRUST: customWeight ? Number(customWeight) / 1e18 : 'none'
      })

      const subjectId = userAtom.vaultId as Address
      const predicateId = trustPredicate.vaultId as Address
      const objectId = accountVaultId as Address

      const txParams = {
        address: contractAddress,
        abi: SofiaFeeProxyAbi as unknown as any[],
        functionName: 'createTriples',
        args: [
          address,          // receiver - user gets the shares
          [subjectId],
          [predicateId],
          [objectId],
          [depositAmount],  // assets WITHOUT tripleCost - EXACT pattern from useCreateTripleOnChain
          CREATION_CURVE_ID  // curveId
        ],
        value: totalCost,   // Total including Sofia fees
        chain: SELECTED_CHAIN,
        gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
        account: address as Address
      }

      logger.debug('Sending transaction to MetaMask')
      const hash = await walletClient.writeContract(txParams)

      const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as Address })

      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      // Simulate to get the result after successful transaction
      const simulation = await publicClient.simulateContract({
        address: contractAddress as Address,
        abi: SofiaFeeProxyAbi,
        functionName: 'createTriples',
        args: [address as Address, [subjectId], [predicateId], [objectId], [depositAmount], CREATION_CURVE_ID],
        value: totalCost,
        account: walletClient.account
      })

      const tripleIds = simulation.result as Address[]
      const expectedTripleVaultId = tripleIds[0]

      logger.info('✅ Trust triplet created successfully', {
        tripleVaultId: expectedTripleVaultId,
        txHash: hash
      })

      loadingRef.current = false
      successRef.current = true
      tripleVaultIdRef.current = expectedTripleVaultId

      setLoading(false)
      setSuccess(true)
      setTripleVaultId(expectedTripleVaultId)
      setOperationType('created')

    } catch (error) {
      logger.error('Trust account creation failed', error)

      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR

      // Check if error is due to triple already existing
      if (errorMessage.includes('MultiVault_TripleExists')) {
        logger.info('Triple already exists (caught from transaction error), treating as success')

        loadingRef.current = false
        successRef.current = true

        setLoading(false)
        setSuccess(true)
        setError(null)
      } else {
        loadingRef.current = false
        errorRef.current = errorMessage

        setLoading(false)
        setError(errorMessage)
      }
    }
  }, [address, getUserAtom, getTrustPredicateAtom, ensureProxyApproval])

  return {
    trustAccount,
    loading,
    error,
    success,
    tripleVaultId,
    operationType
  }
}
