import { useState, useEffect } from 'react'
import { useWalletFromStorage } from './useWalletFromStorage'
import { BlockchainService } from '../lib/services/blockchainService'
import { SUBJECT_IDS, PREDICATE_IDS } from '../lib/config/constants'
import { createHookLogger } from '../lib/utils/logger'

const logger = createHookLogger('useCheckFollowStatus')

export interface FollowStatus {
  isFollowing: boolean
  isTrusting: boolean
  followTripleId?: string
  trustTripleId?: string
  loading: boolean
  error: string | null
}

/**
 * Hook to check if the current user follows and/or trusts an account
 * @param accountTermId - The term ID of the account to check
 * @returns Follow and trust status with loading/error states
 */
export const useCheckFollowStatus = (accountTermId?: string) => {
  const { walletAddress: address } = useWalletFromStorage()
  const [status, setStatus] = useState<FollowStatus>({
    isFollowing: false,
    isTrusting: false,
    loading: true,
    error: null
  })

  useEffect(() => {
    const checkStatus = async () => {
      if (!address || !accountTermId) {
        setStatus({
          isFollowing: false,
          isTrusting: false,
          loading: false,
          error: null
        })
        return
      }

      // accountTermId from Intuition API can be either:
      // - bytes32 (66 chars): the actual termId hash
      // - address (42 chars): for some atom types, term_id contains the vaultId instead
      // For follow/trust check, we need the termId (bytes32)
      // If we receive an address, we can't reliably check - skip for now
      if (!accountTermId.startsWith('0x')) {
        logger.warn('Invalid accountTermId - must start with 0x', {
          accountTermId
        })
        setStatus({
          isFollowing: false,
          isTrusting: false,
          loading: false,
          error: 'Invalid account ID format'
        })
        return
      }

      // If it's an address (42 chars), we can't check follow status reliably
      // because calculateTripleId expects termIds (bytes32), not vaultIds
      if (accountTermId.length === 42) {
        logger.warn('accountTermId is a vaultId (address), not a termId - cannot check follow status', {
          accountTermId
        })
        setStatus({
          isFollowing: false,
          isTrusting: false,
          loading: false,
          error: null // No error, just can't check
        })
        return
      }

      // Validate it's a proper bytes32 (66 chars)
      if (accountTermId.length !== 66) {
        logger.warn('Invalid accountTermId - expected bytes32 (66 chars) or address (42 chars)', {
          accountTermId,
          length: accountTermId.length
        })
        setStatus({
          isFollowing: false,
          isTrusting: false,
          loading: false,
          error: 'Invalid account ID'
        })
        return
      }

      try {
        setStatus(prev => ({ ...prev, loading: true, error: null }))

        logger.debug('Checking follow and trust status', {
          userAddress: address,
          accountTermId
        })

        // Check if "I follow [account]" triple exists
        const followCheck = await BlockchainService.checkTripleExists(
          SUBJECT_IDS.I,
          PREDICATE_IDS.FOLLOW,
          accountTermId
        )

        // Check if "I trusts [account]" triple exists
        const trustCheck = await BlockchainService.checkTripleExists(
          SUBJECT_IDS.I,
          PREDICATE_IDS.TRUSTS,
          accountTermId
        )

        // Triple existence is global - we need to check if THIS user has shares
        let userIsFollowing = false
        let userIsTrusting = false

        if (followCheck.exists && followCheck.tripleVaultId) {
          const shares = await BlockchainService.getUserSharesInTriple(address, followCheck.tripleVaultId)
          userIsFollowing = shares > 0n
        }

        if (trustCheck.exists && trustCheck.tripleVaultId) {
          const shares = await BlockchainService.getUserSharesInTriple(address, trustCheck.tripleVaultId)
          userIsTrusting = shares > 0n
        }

        logger.debug('Status check complete', {
          isFollowing: userIsFollowing,
          isTrusting: userIsTrusting,
          followTripleId: followCheck.tripleVaultId,
          trustTripleId: trustCheck.tripleVaultId
        })

        setStatus({
          isFollowing: userIsFollowing,
          isTrusting: userIsTrusting,
          followTripleId: followCheck.tripleVaultId || undefined,
          trustTripleId: trustCheck.tripleVaultId || undefined,
          loading: false,
          error: null
        })

      } catch (error) {
        logger.error('Failed to check follow/trust status', error)
        setStatus({
          isFollowing: false,
          isTrusting: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    checkStatus()
  }, [address, accountTermId])

  /**
   * Manually refetch the follow/trust status
   */
  const refetch = async () => {
    if (!address || !accountTermId) return

    // Validate ID format
    if (!accountTermId.startsWith('0x')) {
      logger.warn('Invalid accountTermId in refetch', { accountTermId })
      return
    }

    // Skip if it's an address (42 chars) instead of termId (66 chars)
    if (accountTermId.length === 42) {
      logger.warn('Cannot refetch status for vaultId (address)', { accountTermId })
      return
    }

    if (accountTermId.length !== 66) {
      logger.warn('Invalid accountTermId in refetch', {
        accountTermId,
        length: accountTermId.length
      })
      return
    }

    try {
      setStatus(prev => ({ ...prev, loading: true }))

      const followCheck = await BlockchainService.checkTripleExists(
        SUBJECT_IDS.I,
        PREDICATE_IDS.FOLLOW,
        accountTermId
      )

      const trustCheck = await BlockchainService.checkTripleExists(
        SUBJECT_IDS.I,
        PREDICATE_IDS.TRUSTS,
        accountTermId
      )

      let userIsFollowing = false
      let userIsTrusting = false

      if (followCheck.exists && followCheck.tripleVaultId) {
        const shares = await BlockchainService.getUserSharesInTriple(address, followCheck.tripleVaultId)
        userIsFollowing = shares > 0n
      }

      if (trustCheck.exists && trustCheck.tripleVaultId) {
        const shares = await BlockchainService.getUserSharesInTriple(address, trustCheck.tripleVaultId)
        userIsTrusting = shares > 0n
      }

      setStatus({
        isFollowing: userIsFollowing,
        isTrusting: userIsTrusting,
        followTripleId: followCheck.tripleVaultId || undefined,
        trustTripleId: trustCheck.tripleVaultId || undefined,
        loading: false,
        error: null
      })
    } catch (error) {
      logger.error('Failed to refetch status', error)
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }

  return {
    ...status,
    refetch
  }
}
