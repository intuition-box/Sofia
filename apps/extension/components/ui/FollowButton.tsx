import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { formatUnits } from 'viem'
import { useWalletFromStorage, useFollowAccount, type AccountAtom } from '../../hooks'
import WeightModal from '../modals/WeightModal'
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
  const [transactionSuccess, setTransactionSuccess] = useState(false)
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  const mockTriplet = {
    id: `follow-${account.termId}`,
    triplet: {
      subject: 'I',
      predicate: 'follow',
      object: account.label
    },
    description: '',
    url: ''
  }

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

    setTransactionSuccess(false)
    setTransactionError(null)
    setTransactionHash(null)
    setShowModal(true)
  }

  const handleWeightSubmit = async (customWeights?: (bigint | null)[]) => {
    const weightWei = customWeights?.[0]
    // Convert bigint wei to string TRUST for useFollowAccount
    const trustAmount = weightWei
      ? formatUnits(weightWei, 18)
      : '0.01'

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
        setTransactionSuccess(true)
        setTransactionError(null)
        setTransactionHash(result.transactionHash || null)
        setShouldRefreshOnClose(true)
      } else {
        logger.error('Follow transaction failed', result.error)
        setTransactionError(result.error || 'Transaction failed')
      }
    } catch (error) {
      logger.error('Follow transaction failed', error)
      setTransactionError(error instanceof Error ? error.message : 'Transaction failed')
    }
  }

  const handleModalClose = () => {
    logger.debug('Modal closed')
    setShowModal(false)
    setTransactionSuccess(false)
    setTransactionError(null)
    setTransactionHash(null)

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

      {showModal && createPortal(
        <WeightModal
          isOpen={showModal}
          triplets={[mockTriplet]}
          isProcessing={isLoading}
          transactionSuccess={transactionSuccess}
          transactionError={transactionError || undefined}
          transactionHash={transactionHash || undefined}
          estimateOptions={{ isNewTriple: true, newAtomCount: 0 }}
          submitLabel="Follow"
          onClose={handleModalClose}
          onSubmit={handleWeightSubmit}
        />,
        document.body
      )}
    </>
  )
}

export default FollowButton
