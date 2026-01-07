import { useState } from 'react'
import { useWalletFromStorage } from '../../hooks/useWalletFromStorage'
import FollowModal from '../modals/FollowModal'
import { useFollowAccount } from '../../hooks/useFollowAccount'
import type { AccountAtom } from '../../hooks/useGetAtomAccount'
import '../styles/FollowButton.css'

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
    console.log('🔄 FollowButton - Follow button clicked', {
      accountId: account.id,
      accountLabel: account.label,
      userAddress: address
    })

    if (!address) {
      console.warn('⚠️ FollowButton - No wallet connected')
      // TODO: Show connect wallet message
      return
    }

    setShowModal(true)
  }

  const handleFollow = async (trustAmount: string) => {
    console.log('💰 FollowButton - Follow initiated', {
      accountId: account.id,
      accountLabel: account.label,
      trustAmount,
      userAddress: address
    })

    try {
      const result = await followAccount(account, trustAmount)

      if (result.success) {
        console.log('✅ FollowButton - Follow transaction successful', {
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
        console.error('❌ FollowButton - Follow transaction failed', result.error)
        return {
          success: false,
          error: result.error
        }
      }
    } catch (error) {
      console.error('❌ FollowButton - Follow transaction failed', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      }
    }
  }

  const handleModalClose = () => {
    console.log('🚪 FollowButton - Modal closed')
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