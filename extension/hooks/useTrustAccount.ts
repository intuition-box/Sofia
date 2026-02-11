import { useState, useCallback, useRef } from 'react'
import { getClients } from '../lib/clients/viemClients'
import { SofiaFeeProxyAbi } from '../ABI/SofiaFeeProxy'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { useWalletFromStorage } from './useWalletFromStorage'
import { BlockchainService } from '../lib/services'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES, SUBJECT_IDS, PREDICATE_IDS } from '../lib/config/constants'
import type { Address, Hex } from 'viem'

const logger = createHookLogger('useTrustAccount')

export interface TrustAccountResult {
  trustAccount: (accountTermId: string, accountLabel: string, customWeight?: bigint) => Promise<void>
  loading: boolean
  error: string | null
  success: boolean
  tripleVaultId: string | null
  operationType: 'created' | 'deposit' | null
  transactionHash: string | null
}

export const useTrustAccount = (): TrustAccountResult => {
  const { walletAddress: address } = useWalletFromStorage()

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
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  const trustAccount = useCallback(async (accountTermId: string, accountLabel: string, customWeight?: bigint) => {
    try {
      if (!address) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      }

      // Validate accountTermId is bytes32 (66 characters including 0x)
      if (accountTermId.length !== 66) {
        const errorMsg = `Invalid termId format: ${accountTermId} (length: ${accountTermId.length}). Expected bytes32 (66 chars).`
        logger.error(errorMsg)
        throw new Error(errorMsg)
      }

      logger.info('Creating trust triplet for account', { 
        accountTermId, 
        accountLabel, 
        customWeight: customWeight?.toString(),
        isBytes32: accountTermId.length === 66
      })

      // Update refs and state - reset everything at the start of a new transaction
      loadingRef.current = true
      successRef.current = false
      errorRef.current = null
      setLoading(true)
      setSuccess(false)
      setError(null)
      setTransactionHash(null)
      setTripleVaultId(null)
      setOperationType(null)

      // EXACT same logic as Follow
      const userTermId = SUBJECT_IDS.I as Hex
      const predicateTermId = PREDICATE_IDS.TRUSTS as Hex
      const targetTermId = accountTermId as Hex

      logger.debug('Trust triple components', {
        userTermId,
        predicateTermId,
        targetTermId
      })

      const { publicClient, walletClient } = await getClients()
      const contractAddress = BlockchainService.getContractAddress()
      const defaultCost = await BlockchainService.getTripleCost()

      // Determine the amount to use
      const depositAmount = customWeight !== undefined && customWeight > 0n ? customWeight : defaultCost

      logger.debug('Trust amount calculation', {
        defaultCost: defaultCost.toString(),
        defaultCostInTRUST: Number(defaultCost) / 1e18,
        customWeight: customWeight?.toString(),
        depositAmount: depositAmount.toString(),
        depositAmountInTRUST: Number(depositAmount) / 1e18
      })

      // Check if the triple already exists
      const tripleCheck = await BlockchainService.checkTripleExists(
        userTermId,
        predicateTermId,
        targetTermId
      )

      logger.debug('Triple existence check', {
        exists: tripleCheck.exists,
        tripleVaultId: tripleCheck.tripleVaultId
      })

      let hash: Address
      let resultTripleVaultId: Address

      if (tripleCheck.exists && tripleCheck.tripleHash) {
        // Triple exists - use deposit()
        logger.debug('Triple exists, using deposit() with amount:', depositAmount.toString())

        const tripleTermId = tripleCheck.tripleHash as Hex
        const curveId = 1n

        logger.debug('deposit args', {
          receiver: address,
          termIdPassed: tripleTermId,
          looksLikeBytes32: tripleTermId.length === 66
        })

        // Calculate total cost including Sofia fees
        const totalDepositCost = await BlockchainService.getTotalDepositCost(depositAmount)

        hash = await walletClient.writeContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'deposit',
          args: [
            address as Address,
            tripleTermId,
            curveId,
            0n
          ],
          value: totalDepositCost,
          chain: SELECTED_CHAIN,
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: address as Address
        })

        resultTripleVaultId = tripleCheck.tripleHash as Address
        setOperationType('deposit')
      } else {
        // Triple doesn't exist - use createTriples()
        logger.debug('Triple does not exist, using createTriples()')

        const userShareAmount = depositAmount > 0n ? depositAmount : defaultCost
        const multiVaultCost = userShareAmount + defaultCost
        const totalCreationCost = await BlockchainService.getTotalCreationCost(1, userShareAmount, multiVaultCost)
        const curveId = 1n

        logger.debug('createTriples cost breakdown', {
          userShareAmount: userShareAmount.toString(),
          userShareAmountInTRUST: Number(userShareAmount) / 1e18,
          creationFees: defaultCost.toString(),
          creationFeesInTRUST: Number(defaultCost) / 1e18,
          multiVaultCost: multiVaultCost.toString(),
          totalCreationCost: totalCreationCost.toString(),
          totalCreationCostInTRUST: Number(totalCreationCost) / 1e18
        })

        // Simulate first
        const simulation = await publicClient.simulateContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'createTriples',
          args: [
            address as Address,
            [userTermId],
            [predicateTermId],
            [targetTermId],
            [userShareAmount],
            curveId
          ],
          value: totalCreationCost,
          account: address as Address
        })

        hash = await walletClient.writeContract({
          address: contractAddress as Address,
          abi: SofiaFeeProxyAbi,
          functionName: 'createTriples',
          args: [
            address as Address,
            [userTermId],
            [predicateTermId],
            [targetTermId],
            [userShareAmount],
            curveId
          ],
          value: totalCreationCost,
          chain: SELECTED_CHAIN,
          maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
          account: address as Address
        })

        const tripleIds = simulation.result as Address[]
        resultTripleVaultId = tripleIds[0]
        setOperationType('created')
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      logger.info('✅ Trust transaction successful', {
        hash,
        tripleVaultId: resultTripleVaultId,
        method: tripleCheck.exists ? 'deposit' : 'createTriples'
      })

      loadingRef.current = false
      successRef.current = true
      tripleVaultIdRef.current = resultTripleVaultId

      setLoading(false)
      setSuccess(true)
      setTripleVaultId(resultTripleVaultId)
      setTransactionHash(hash)

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
  }, [address])

  return {
    trustAccount,
    loading,
    error,
    success,
    tripleVaultId,
    operationType,
    transactionHash
  }
}
