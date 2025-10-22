import { useState, useCallback, useRef } from 'react'
import { getClients } from '../lib/clients/viemClients'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { useCreateAtom } from './useCreateAtom'
import { useStorage } from "@plasmohq/storage/hook"
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES, SUBJECT_IDS } from '../lib/config/constants'
import type { Address, Hash } from '../types/viem'

const logger = createHookLogger('useTrustPage')

export interface TrustPageResult {
  trustPage: (url: string) => Promise<void>
  loading: boolean
  error: string | null
  success: boolean
  tripleVaultId: string | null
}

export const useTrustPage = (): TrustPageResult => {
  const { createAtomWithMultivault } = useCreateAtom()
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

  // Cache for trust predicate atom - create once per session
  const trustPredicateCache = useRef<string | null>(null)

  // Get universal "I" subject atom (same for all users)
  const getUserAtom = useCallback(async () => {
    return {
      vaultId: SUBJECT_IDS.I,
      success: true,
      ipfsUri: '',
      name: 'I'
    }
  }, [])

  // Get or create "trust" predicate atom
  const getTrustPredicateAtom = useCallback(async () => {
    try {
      // Return cached if available
      if (trustPredicateCache.current) {
        logger.debug('Using cached trust predicate', { vaultId: trustPredicateCache.current })
        return {
          vaultId: trustPredicateCache.current,
          ipfsUri: '',
          name: 'trust'
        }
      }

      logger.debug('Creating trust predicate atom')

      const predicateAtomResult = await createAtomWithMultivault({
        name: 'trust',
        description: 'Predicate representing trust relationship',
        url: ''
      })

      // Cache for reuse
      trustPredicateCache.current = predicateAtomResult.vaultId

      logger.debug('Trust predicate created', { vaultId: predicateAtomResult.vaultId })

      return {
        vaultId: predicateAtomResult.vaultId,
        ipfsUri: '',
        name: 'trust'
      }
    } catch (error) {
      logger.error('Failed to get trust predicate', error)
      throw error
    }
  }, [createAtomWithMultivault])

  const trustPage = useCallback(async (url: string) => {
    try {
      if (!address) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      }

      logger.info('Creating trust triplet for URL', { url })

      // Update refs and state
      loadingRef.current = true
      successRef.current = false
      errorRef.current = null
      setLoading(true)
      setSuccess(false)
      setError(null)

      // Extract domain from URL for atom name
      const urlObj = new URL(url)
      const domain = urlObj.hostname

      logger.debug('Step 1: Getting user atom (I)')
      const userAtom = await getUserAtom()
      logger.debug('User atom obtained', { vaultId: userAtom.vaultId })

      logger.debug('Step 2: Getting trust predicate atom')
      const trustPredicate = await getTrustPredicateAtom()
      logger.debug('Trust predicate obtained', { vaultId: trustPredicate.vaultId })

      logger.debug('Step 3: Creating website atom')
      const websiteAtom = await createAtomWithMultivault({
        name: domain,
        description: `Website: ${domain}`,
        url: url
      })
      logger.debug('Website atom created', { vaultId: websiteAtom.vaultId })

      // Check if triple already exists
      logger.debug('Step 4: Checking if triple exists')
      const tripleCheck = await BlockchainService.checkTripleExists(
        userAtom.vaultId,
        trustPredicate.vaultId,
        websiteAtom.vaultId
      )

      if (tripleCheck.exists) {
        logger.info('Triple already exists', { tripleVaultId: tripleCheck.tripleVaultId })

        loadingRef.current = false
        successRef.current = true
        tripleVaultIdRef.current = tripleCheck.tripleVaultId!

        setLoading(false)
        setSuccess(true)
        setTripleVaultId(tripleCheck.tripleVaultId!)
        return
      }

      // Create the triple
      logger.debug('Step 5: Creating triple on-chain')
      const { walletClient, publicClient } = await getClients()
      const contractAddress = BlockchainService.getContractAddress()

      const tripleCost = await BlockchainService.getTripleCost()
      logger.debug('Triple cost retrieved', { cost: tripleCost.toString() })

      const subjectId = userAtom.vaultId as Address
      const predicateId = trustPredicate.vaultId as Address
      const objectId = websiteAtom.vaultId as Address

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
          [tripleCost]
        ],
        value: tripleCost,
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
          [tripleCost]
        ],
        value: tripleCost,
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

    } catch (error) {
      logger.error('Trust page creation failed', error)

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
  }, [address, getUserAtom, getTrustPredicateAtom, createAtomWithMultivault])

  return {
    trustPage,
    loading,
    error,
    success,
    tripleVaultId
  }
}
