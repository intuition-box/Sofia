import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
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
  const { user } = usePrivy()
  const address = user?.wallet?.address
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

      // Validate that accountTermId is a bytes32 (66 chars) and not a wallet address (42 chars)
      if (accountTermId.length !== 66) {
        logger.warn('Invalid accountTermId - expected bytes32 (66 chars) but got', {
          accountTermId,
          length: accountTermId.length
        })
        setStatus({
          isFollowing: false,
          isTrusting: false,
          loading: false,
          error: 'Invalid account term ID'
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

        logger.debug('Status check complete', {
          isFollowing: followCheck.exists,
          isTrusting: trustCheck.exists,
          followTripleId: followCheck.tripleVaultId,
          trustTripleId: trustCheck.tripleVaultId
        })

        setStatus({
          isFollowing: followCheck.exists,
          isTrusting: trustCheck.exists,
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

    // Validate term ID length
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

      setStatus({
        isFollowing: followCheck.exists,
        isTrusting: trustCheck.exists,
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
