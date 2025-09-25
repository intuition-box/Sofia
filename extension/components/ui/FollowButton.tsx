import { useState } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import FollowModal from './FollowModal'
import { useFollowAccount } from '../../hooks/useFollowAccount'
import type { AccountAtom } from '../../hooks/useGetAtomAccount'

interface FollowButtonProps {
  account: AccountAtom
  isFollowing?: boolean
  onFollowChange?: (isFollowing: boolean) => void
}

const FollowButton = ({
  account,
  isFollowing = false,
  onFollowChange
}: FollowButtonProps) => {
  const [address] = useStorage<string>("metamask-account")
  const { followAccount, unfollowAccount, isLoading } = useFollowAccount()
  const [showModal, setShowModal] = useState(false)

  const handleFollowClick = () => {
    console.log('🔄 FollowButton - Follow button clicked', {
      accountId: account.id,
      accountLabel: account.label,
      userAddress: address,
      currentlyFollowing: isFollowing
    })

    if (!address) {
      console.warn('⚠️ FollowButton - No wallet connected')
      // TODO: Show connect wallet message
      return
    }

    if (isFollowing) {
      handleUnfollow()
    } else {
      setShowModal(true)
    }
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

        onFollowChange?.(true)
        setShowModal(false)
      } else {
        console.error('❌ FollowButton - Follow transaction failed', result.error)
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('❌ FollowButton - Follow transaction failed', error)
    }
  }

  const handleUnfollow = async () => {
    console.log('🔄 FollowButton - Unfollow initiated', {
      accountId: account.id,
      accountLabel: account.label,
      userAddress: address
    })

    try {
      const result = await unfollowAccount(account)

      if (result.success) {
        console.log('✅ FollowButton - Unfollow transaction successful', {
          transactionHash: result.transactionHash
        })

        onFollowChange?.(false)
      } else {
        console.error('❌ FollowButton - Unfollow transaction failed', result.error)
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('❌ FollowButton - Unfollow transaction failed', error)
    }
  }

  const handleModalClose = () => {
    console.log('🚪 FollowButton - Modal closed')
    setShowModal(false)
  }

  return (
    <>
      <button
        className={`follow-button ${isFollowing ? 'following' : 'not-following'} ${isLoading ? 'loading' : ''}`}
        onClick={handleFollowClick}
        disabled={isLoading || !address}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          border: 'none',
          cursor: isLoading || !address ? 'not-allowed' : 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          backgroundColor: isFollowing ? '#ef4444' : '#3b82f6',
          color: 'white',
          opacity: isLoading || !address ? 0.6 : 1
        }}
      >
        {isLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
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