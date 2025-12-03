import { useState, useCallback, useRef } from 'react'
import { getClients } from '../lib/clients/viemClients'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { useStorage } from "@plasmohq/storage/hook"
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES, SUBJECT_IDS, PREDICATE_IDS } from '../lib/config/constants'
import type { Address } from '../types/viem'

const logger = createHookLogger('useTrustAccount')

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
  const [address] = useStorage<string>("metamask-account")

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

        // Calculate deposit amount including fees
        // User wants to deposit customWeight (after fees), so we need to calculate how much to send
        let depositAmount: bigint
        if (customWeight !== undefined) {
          depositAmount = await BlockchainService.calculateAmountWithFees(customWeight)
        } else {
          const feeCost = await BlockchainService.getTripleCost()
          depositAmount = feeCost
        }
        const curveId = 2n // Curve ID for triple deposits

        logger.debug('Triple exists, performing deposit instead', {
          tripleVaultId: tripleCheck.tripleVaultId,
          desiredAmount: customWeight?.toString(),
          desiredAmountInTRUST: customWeight ? Number(customWeight) / 1e18 : 'N/A',
          depositAmount: depositAmount.toString(),
          depositAmountInTRUST: Number(depositAmount) / 1e18
        })

        // Simulate deposit first
        await publicClient.simulateContract({
          address: contractAddress as Address,
          abi: MultiVaultAbi,
          functionName: 'deposit',
          args: [
            address as Address,                    // receiver
            tripleCheck.tripleVaultId as Address,  // termId
            curveId,                               // curveId
            0n                                     // minShares
          ],
          value: depositAmount,
          account: walletClient.account
        })

        // Execute deposit
        const hash = await walletClient.writeContract({
          address: contractAddress as Address,
          abi: MultiVaultAbi,
          functionName: 'deposit',
          args: [
            address as Address,
            tripleCheck.tripleVaultId as Address,
            curveId,
            0n
          ],
          value: depositAmount,
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

      const feeCost = await BlockchainService.getTripleCost()

      // Step 1: Create triple with minimum deposit + fee
      const creationCost = MIN_TRIPLE_DEPOSIT + feeCost

      logger.debug('Triple creation cost', {
        creationCost: creationCost.toString(),
        creationCostInTRUST: Number(creationCost) / 1e18,
        feeCost: feeCost.toString(),
        feeCostInTRUST: Number(feeCost) / 1e18,
        minDeposit: MIN_TRIPLE_DEPOSIT.toString(),
        minDepositInTRUST: Number(MIN_TRIPLE_DEPOSIT) / 1e18,
        customWeight: customWeight?.toString(),
        customWeightInTRUST: customWeight ? Number(customWeight) / 1e18 : 'none'
      })

      const subjectId = userAtom.vaultId as Address
      const predicateId = trustPredicate.vaultId as Address
      const objectId = accountVaultId as Address

      // Simulate first to validate
      logger.debug('Simulating transaction')
      const simulation = await publicClient.simulateContract({
        address: contractAddress as Address,
        abi: MultiVaultAbi,
        functionName: 'createTriples',
        args: [
          [subjectId],
          [predicateId],
          [objectId],
          [creationCost]
        ],
        value: creationCost,
        account: walletClient.account
      })

      const expectedTripleIds = simulation.result as Address[]
      const expectedTripleVaultId = expectedTripleIds[0]
      logger.debug('Simulation successful', { expectedTripleVaultId })

      logger.debug('Sending transaction to MetaMask')
      const hash = await walletClient.writeContract({
        address: contractAddress as Address,
        abi: MultiVaultAbi,
        functionName: 'createTriples',
        args: [
          [subjectId],
          [predicateId],
          [objectId],
          [creationCost]
        ],
        value: creationCost,
        chain: SELECTED_CHAIN,
        gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
        account: address as Address
      })

      logger.debug('Transaction sent', { hash })

      // Wait for confirmation
      logger.debug('Waiting for transaction confirmation')
      const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as Address })

      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      // Step 2: If customWeight > minDeposit, deposit the rest on Curve 2
      if (customWeight !== undefined && customWeight > MIN_TRIPLE_DEPOSIT) {
        const additionalDesiredDeposit = customWeight - MIN_TRIPLE_DEPOSIT
        // Calculate amount to send including fees
        const additionalDeposit = await BlockchainService.calculateAmountWithFees(additionalDesiredDeposit)
        const curveId = 2n

        logger.debug('Depositing additional amount on Curve 2', {
          tripleVaultId: expectedTripleVaultId,
          desiredAdditionalDeposit: additionalDesiredDeposit.toString(),
          desiredAdditionalDepositInTRUST: Number(additionalDesiredDeposit) / 1e18,
          additionalDeposit: additionalDeposit.toString(),
          additionalDepositInTRUST: Number(additionalDeposit) / 1e18
        })

        const depositHash = await walletClient.writeContract({
          address: contractAddress as Address,
          abi: MultiVaultAbi,
          functionName: 'deposit',
          args: [
            address as Address,              // receiver
            expectedTripleVaultId as Address, // termId
            curveId,                         // curveId = 2 (Deposit/Share curve)
            0n                               // minShares
          ],
          value: additionalDeposit,
          chain: SELECTED_CHAIN,
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: address as Address
        })

        const depositReceipt = await publicClient.waitForTransactionReceipt({ hash: depositHash })

        if (depositReceipt.status !== 'success') {
          throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: Deposit failed - ${depositReceipt.status}`)
        }

        logger.debug('Additional deposit on Curve 2 successful', { depositHash })
      }

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
  }, [address, getUserAtom, getTrustPredicateAtom])

  return {
    trustAccount,
    loading,
    error,
    success,
    tripleVaultId,
    operationType
  }
}
