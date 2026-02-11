import { useState } from 'react'
import { useWalletFromStorage, useFollowAccount, type AccountAtom } from '../../hooks'
import FollowModal from '../modals/FollowModal'
import { createHookLogger } from '../../lib/utils/logger'
import '../styles/FollowButton.css'

const logger = createHookLogger('FollowButton')

interface FollowButtonProps {
  account: AccountAtom
  onFollowSuccess?: () => void
}

const FollowButton = ({
  account,
  onFollowSuccess
}: FollowButtonProps) => {
  const { walletAddress: address } = useWalletFromStorage()
  const { followAccount, isLoading } = useFollowAccount()
  const [showModal, setShowModal] = useState(false)
  const [shouldRefreshOnClose, setShouldRefreshOnClose] = useState(false)

  const handleFollowClick = () => {
    logger.debug('Follow button clicked', {
      accountId: account.id,
      accountLabel: account.label,
      userAddress: address
    })

    if (!address) {
      logger.warn('No wallet connected')
      return
    }

    setShowModal(true)
  }

  const handleFollow = async (trustAmount: string) => {
    logger.info('Follow initiated', {
      accountId: account.id,
      accountLabel: account.label,
      trustAmount,
      userAddress: address
    })

    try {
      const result = await followAccount(account, trustAmount)

      if (result.success) {
        logger.info('Follow transaction successful', {
          transactionHash: result.transactionHash,
          tripleVaultId: result.tripleVaultId
        })

        // Don't refresh here - will refresh when modal closes to avoid re-render
        setShouldRefreshOnClose(true)

        // Return result to modal in the expected format
        return {
          success: true,
          txHash: result.transactionHash,
        }
      } else {
        logger.error('Follow transaction failed', result.error)
        return {
          success: false,
          error: result.error
        }
      }
    } catch (error) {
      logger.error('Follow transaction failed', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      }
    }
  }

  const handleModalClose = () => {
    logger.debug('Modal closed')
    setShowModal(false)

    // Refresh followers list if transaction was successful
    if (shouldRefreshOnClose) {
      setShouldRefreshOnClose(false)
      onFollowSuccess?.()
    }
  }

  return (
    <>
      <button
        className={`follow-button salmon-gradient-button ${isLoading ? 'loading' : ''}`}
        onClick={handleFollowClick}
        disabled={isLoading || !address}
      >
        {isLoading ? '...' : 'Follow'}
      </button>

      {showModal && (
        <FollowModal
          accountLabel={account.label}
          onFollow={handleFollow}
          onClose={handleModalClose}
        />
      )}
    </>
  )
}

export default FollowButton