import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
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
  const { user } = usePrivy()
  const address = user?.wallet?.address
  const { followAccount, isLoading } = useFollowAccount()
  const [showModal, setShowModal] = useState(false)

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

        setShowModal(false)
        onFollowSuccess?.()
      } else {
        console.error('❌ FollowButton - Follow transaction failed', result.error)
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('❌ FollowButton - Follow transaction failed', error)
    }
  }

  const handleModalClose = () => {
    console.log('🚪 FollowButton - Modal closed')
    setShowModal(false)
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