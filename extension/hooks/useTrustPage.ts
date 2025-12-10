import { useState, useCallback, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useCreateTripleOnChain } from './useCreateTripleOnChain'
import { createHookLogger } from '../lib/utils/logger'
import { ERROR_MESSAGES } from '../lib/config/constants'

const logger = createHookLogger('useTrustPage')

export interface TrustPageResult {
  trustPage: (url: string, customWeight?: bigint) => Promise<void>
  loading: boolean
  error: string | null
  success: boolean
  tripleVaultId: string | null
  operationType: 'created' | 'deposit' | null
}

export const useTrustPage = (): TrustPageResult => {
  const { createTripleOnChain } = useCreateTripleOnChain()
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

  const trustPage = useCallback(async (url: string, customWeight?: bigint) => {
    try {
      if (!address) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
      }

      logger.info('Creating trust triplet for URL', { url, customWeight: customWeight?.toString() })

      // Update refs and state
      loadingRef.current = true
      successRef.current = false
      errorRef.current = null
      setLoading(true)
      setSuccess(false)
      setError(null)

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

      logger.debug('Creating trust triple via useCreateTripleOnChain', { pageLabel })

      // Use useCreateTripleOnChain which handles:
      // - Proxy approval
      // - Atom pinning to IPFS
      // - Atom creation on-chain
      // - Triple creation OR deposit if it already exists
      // - Proper executeTransaction with session wallet support
      const result = await createTripleOnChain(
        'trusts',  // predicateName - mapped to PREDICATE_IDS.TRUSTS
        {
          name: pageLabel,
          description: `Page: ${pageLabel}`,
          url: url,
          image: faviconUrl
        },
        customWeight
      )

      logger.info('✅ Trust triplet operation successful', {
        tripleVaultId: result.tripleVaultId,
        txHash: result.txHash,
        source: result.source
      })

      loadingRef.current = false
      successRef.current = true
      tripleVaultIdRef.current = result.tripleVaultId

      setLoading(false)
      setSuccess(true)
      setTripleVaultId(result.tripleVaultId)
      setOperationType(result.source as 'created' | 'deposit')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      const errorStack = error instanceof Error ? error.stack : String(error)
      console.error('❌ Trust page creation failed:', errorMessage)
      console.error('Stack trace:', errorStack)
      logger.error('Trust page creation failed', { message: errorMessage, stack: errorStack })

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

  return {
    trustPage,
    loading,
    error,
    success,
    tripleVaultId,
    operationType
  }
}
