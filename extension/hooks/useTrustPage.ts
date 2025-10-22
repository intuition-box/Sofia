/**
 * useTrustPage Hook
 * Creates "I trust [website]" triplets
 * Uses universal "I" subject and "trust" predicate for all users
 */

import { useState, useCallback } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { useCreateAtom } from './useCreateAtom'
import { getClients } from '../lib/clients/viemClients'
import { MultiVaultAbi } from '../ABI/MultiVault'
import { SELECTED_CHAIN } from '../lib/config/chainConfig'
import { sessionWallet } from '../lib/services/sessionWallet'
import { BlockchainService } from '../lib/services/blockchainService'
import { createHookLogger } from '../lib/utils/logger'
import { BLOCKCHAIN_CONFIG, ERROR_MESSAGES, SUBJECT_IDS } from '../lib/config/constants'
import type { Address, Hash } from '../types/viem'

const logger = createHookLogger('useTrustPage')

// Predicate "trust" - will be created once and reused
const TRUST_PREDICATE_NAME = 'trust'

export interface TrustPageResult {
  trustPage: (url: string) => Promise<void>
  loading: boolean
  error: string | null
  success: boolean
  tripleVaultId: string | null
}

export const useTrustPage = (): TrustPageResult => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tripleVaultId, setTripleVaultId] = useState<string | null>(null)
  const [account] = useStorage<string>("metamask-account")
  const [useSessionWallet] = useStorage<boolean>("sofia-use-session-wallet", false)
  const { createAtomWithMultivault } = useCreateAtom()

  // Cache for trust predicate to avoid recreating
  let trustPredicateVaultId: string | null = null

  // Get the universal "I" subject atom (same for all users)
  const getUserAtom = useCallback(async () => {
    if (!account) {
      throw new Error('No wallet connected')
    }

    return {
      vaultId: SUBJECT_IDS.I,
      success: true,
      ipfsUri: '',
      name: 'I'
    }
  }, [account])

  // Get or create the "trust" predicate atom
  const getTrustPredicateAtom = useCallback(async () => {
    // Return cached if available
    if (trustPredicateVaultId) {
      return {
        vaultId: trustPredicateVaultId,
        ipfsUri: '',
        name: TRUST_PREDICATE_NAME
      }
    }

    // Create trust predicate atom
    const predicateAtomResult = await createAtomWithMultivault({
      name: TRUST_PREDICATE_NAME,
      description: `Predicate representing trust relationship`,
      url: ''
    })

    trustPredicateVaultId = predicateAtomResult.vaultId

    return {
      vaultId: predicateAtomResult.vaultId,
      ipfsUri: '',
      name: TRUST_PREDICATE_NAME
    }
  }, [createAtomWithMultivault])

  // Determine which wallet to use
  const shouldUseSessionWallet = useCallback((transactionValue: bigint): boolean => {
    if (!useSessionWallet) return false

    const sessionStatus = sessionWallet.getStatus()
    if (!sessionStatus.isReady) return false

    return sessionWallet.canExecute(transactionValue)
  }, [useSessionWallet])

  // Execute transaction with appropriate wallet
  const executeTransaction = useCallback(async (txParams: any): Promise<Hash> => {
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
  }, [shouldUseSessionWallet])

  const trustPage = useCallback(async (url: string) => {
    if (!account) {
      setError('Please connect your wallet first')
      return
    }

    if (!url) {
      setError('No URL provided')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)
    setTripleVaultId(null)

    try {
      logger.info('Creating trust triplet for URL:', url)

      // Extract domain for display name
      const domain = new URL(url).hostname

      // Get atoms: I, trust, [website]
      const userAtom = await getUserAtom()
      const trustPredicate = await getTrustPredicateAtom()
      const websiteAtom = await createAtomWithMultivault({
        name: domain,
        description: `Website: ${domain}`,
        url: url
      })

      // Check if triple already exists
      const tripleCheck = await BlockchainService.checkTripleExists(
        userAtom.vaultId,
        trustPredicate.vaultId,
        websiteAtom.vaultId
      )

      if (tripleCheck.exists) {
        logger.info('Trust relationship already exists:', tripleCheck.tripleVaultId)
        setSuccess(true)
        setTripleVaultId(tripleCheck.tripleVaultId!)
        setTimeout(() => setSuccess(false), 3000)
        return
      }

      // Create the triple on-chain
      const { walletClient, publicClient } = await getClients()
      const contractAddress = BlockchainService.getContractAddress()
      const tripleCost = await BlockchainService.getTripleCost()

      const subjectId = userAtom.vaultId as Address
      const predicateId = trustPredicate.vaultId as Address
      const objectId = websiteAtom.vaultId as Address

      const txParams = {
        address: contractAddress,
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
        account: account
      }

      const hash = await executeTransaction(txParams)
      logger.info('Trust triple transaction sent:', hash)

      const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as Address })

      if (receipt.status !== 'success') {
        throw new Error(`${ERROR_MESSAGES.TRANSACTION_FAILED}: ${receipt.status}`)
      }

      // Get the triple vault ID
      const simulation = await publicClient.simulateContract({
        address: contractAddress as Address,
        abi: MultiVaultAbi,
        functionName: 'createTriples',
        args: [[subjectId], [predicateId], [objectId], [tripleCost]],
        value: tripleCost,
        account: walletClient.account
      })

      const tripleIds = simulation.result as Address[]
      const createdTripleVaultId = tripleIds[0]

      logger.info('Trust triplet created successfully:', createdTripleVaultId)
      setSuccess(true)
      setTripleVaultId(createdTripleVaultId)

      // Reset success after 3 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 3000)

    } catch (error) {
      logger.error('Trust page failed:', error)

      // Check if error is "triple already exists" - treat as success
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('MultiVault_TripleExists')) {
        logger.info('Triple already exists (from transaction error), treating as success')

        // Extract the triple ID from the error message (first 0x... hash)
        const tripleIdMatch = errorMessage.match(/\(0x[a-fA-F0-9]{64}/)
        const existingTripleId = tripleIdMatch ? tripleIdMatch[0].substring(1) : null

        setSuccess(true)
        setTripleVaultId(existingTripleId)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [account, getUserAtom, getTrustPredicateAtom, createAtomWithMultivault, executeTransaction])

  return {
    trustPage,
    loading,
    error,
    success,
    tripleVaultId
  }
}
