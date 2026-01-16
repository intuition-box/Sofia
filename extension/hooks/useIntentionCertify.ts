import { useState, useCallback, useRef } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'
import { useCreateTripleOnChain } from './useCreateTripleOnChain'
import { createHookLogger } from '../lib/utils/logger'
import { ERROR_MESSAGES } from '../lib/config/constants'
import { INTENTION_MIN_STAKE, PREDICATE_NAMES } from '../lib/config/chainConfig'
import type { IntentionPurpose } from '../types/discovery'
import { INTENTION_PREDICATES } from '../types/discovery'

const logger = createHookLogger('useIntentionCertify')

export interface IntentionCertifyResult {
  certifyWithIntention: (
    url: string,
    intention: IntentionPurpose,
    customWeight?: bigint
  ) => Promise<void>
  reset: () => void
  loading: boolean
  error: string | null
  success: boolean
  tripleVaultId: string | null
  operationType: 'created' | 'deposit' | null
  transactionHash: string | null
  currentIntention: IntentionPurpose | null
}

export const useIntentionCertify = (): IntentionCertifyResult => {
  const { createTripleOnChain } = useCreateTripleOnChain()
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
  const [currentIntention, setCurrentIntention] = useState<IntentionPurpose | null>(null)

  const certifyWithIntention = useCallback(async (
    url: string,
    intention: IntentionPurpose,
    customWeight?: bigint
  ) => {
    try {
      if (!address) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      }

      // Get the predicate name for this intention
      const predicateName = INTENTION_PREDICATES[intention]

      // Ensure minimum stake is respected
      const weight = customWeight && customWeight >= INTENTION_MIN_STAKE
        ? customWeight
        : INTENTION_MIN_STAKE

      logger.info(`Creating intention certification for URL`, {
        url,
        intention,
        predicateName,
        weight: weight.toString()
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
      setCurrentIntention(intention)

      // Extract domain and path from URL for atom name
      const urlObj = new URL(url)
      const domain = urlObj.hostname
      const pathname = urlObj.pathname

      // Create a more descriptive label: domain + path (without query params)
      const pageLabel = pathname && pathname !== '/'
        ? `${domain}${pathname}`
        : domain

      // Get favicon URL from Google's service
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`

      logger.debug(`Creating intention triple via useCreateTripleOnChain`, {
        pageLabel,
        predicateName,
        intention
      })

      // Use useCreateTripleOnChain which handles:
      // - Proxy approval
      // - Atom pinning to IPFS
      // - Atom creation on-chain
      // - Triple creation OR deposit if it already exists
      // - Proper executeTransaction with session wallet support
      const result = await createTripleOnChain(
        predicateName,  // e.g., 'visits for work'
        {
          name: pageLabel,
          description: `Page: ${pageLabel}`,
          url: url,
          image: faviconUrl
        },
        weight
      )

      logger.info('Intention certification successful', {
        tripleVaultId: result.tripleVaultId,
        txHash: result.txHash,
        source: result.source,
        intention
      })

      loadingRef.current = false
      successRef.current = true
      tripleVaultIdRef.current = result.tripleVaultId

      setLoading(false)
      setSuccess(true)
      setTripleVaultId(result.tripleVaultId)
      setOperationType(result.source as 'created' | 'deposit')
      setTransactionHash(result.txHash)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      const errorStack = error instanceof Error ? error.stack : String(error)
      console.error('Intention certification failed:', errorMessage)
      console.error('Stack trace:', errorStack)
      logger.error('Intention certification failed', { message: errorMessage, stack: errorStack })

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
  }, [address, createTripleOnChain])

  // Reset all state - call this when closing modal or changing page
  const reset = useCallback(() => {
    loadingRef.current = false
    successRef.current = false
    errorRef.current = null
    tripleVaultIdRef.current = null

    setLoading(false)
    setSuccess(false)
    setError(null)
    setTripleVaultId(null)
    setOperationType(null)
    setTransactionHash(null)
    setCurrentIntention(null)
  }, [])

  return {
    certifyWithIntention,
    reset,
    loading,
    error,
    success,
    tripleVaultId,
    operationType,
    transactionHash,
    currentIntention
  }
}
