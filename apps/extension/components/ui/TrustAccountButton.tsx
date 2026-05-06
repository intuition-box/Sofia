import { useState, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTrustAccount } from '../../hooks'
import WeightModal from '../modals/WeightModal'
import { createHookLogger } from '../../lib/utils/logger'

const logger = createHookLogger('TrustAccountButton')

interface TrustAccountButtonProps {
  accountTermId: string
  accountLabel: string
  onSuccess?: () => void
  /** Visible button label (default: "Trust"). Accepts ReactNode so callers can include an icon. */
  label?: ReactNode
  /** Pre-selected weight option in the modal (default: 'default' / 0.5 TRUST) */
  initialWeight?: 'minimum' | 'default' | 'strong' | 'high' | 'max'
  /** Extra className appended to the button */
  className?: string
}

const TrustAccountButton = ({ accountTermId, accountLabel, onSuccess, label = 'Trust', initialWeight, className }: TrustAccountButtonProps) => {
  const { trustAccount, loading, error, success, transactionHash } = useTrustAccount()
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [transactionSuccess, setTransactionSuccess] = useState(false)
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const [localTransactionHash, setLocalTransactionHash] = useState<string | null>(null)

  // Create a fake triplet object for WeightModal display
  const mockTriplet = {
    id: `trust-${accountTermId}`,
    triplet: {
      subject: 'I',
      predicate: 'trust',
      object: accountLabel
    },
    url: '',
    description: `Trust relationship with ${accountLabel}`,
    intention: 'trusted' as const
  }

  const handleButtonClick = () => {
    setShowWeightModal(true)
    setTransactionError(null)
    setTransactionSuccess(false)
    setLocalTransactionHash(null)
  }

  const handleWeightSubmit = async (customWeights?: (bigint | null)[]) => {
    try {
      const customWeight = customWeights?.[0] || undefined
      await trustAccount(accountTermId, accountLabel, customWeight)

      // Success will be detected by the useEffect watching the hook's success state
      // The hook will update transactionHash and success states

      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      logger.error('Failed to trust account', err)
      setTransactionError(err instanceof Error ? err.message : 'Failed to create trust')
    }
  }

  // Sync states from hook - wait for loading to finish before updating
  useEffect(() => {
    logger.debug('Hook state changed', { loading, success, error, transactionHash })

    // Only update when not loading (transaction finished)
    if (!loading) {
      if (success && transactionHash) {
        logger.info('Success with txHash', { transactionHash })
        setTransactionSuccess(true)
        setLocalTransactionHash(transactionHash)
        setTransactionError(null)
      } else if (success && !transactionHash) {
        logger.info('Success without txHash (triple exists)')
        setTransactionSuccess(true)
        setTransactionError(null)
        setLocalTransactionHash(null)
      } else if (error) {
        logger.error('Transaction error', error)
        setTransactionSuccess(false)
        setTransactionError(error)
        setLocalTransactionHash(null)
      }
    }
  }, [loading, success, error, transactionHash])

  const handleModalClose = () => {
    setShowWeightModal(false)
    setTransactionError(null)
    setTransactionSuccess(false)
    setLocalTransactionHash(null)
  }

  return (
    <>
      <button
        className={`follow-button trust-page-button salmon-gradient-button ${loading ? 'loading' : ''} ${transactionSuccess ? 'success' : ''} ${className || ''}`}
        onClick={handleButtonClick}
        disabled={loading}
      >
        {loading ? 'Processing...' : label}
      </button>

      {showWeightModal && createPortal(
        <WeightModal
          isOpen={showWeightModal}
          triplets={[mockTriplet]}
          isProcessing={loading}
          transactionSuccess={transactionSuccess}
          transactionError={transactionError || error}
          transactionHash={localTransactionHash || undefined}
          initialWeight={initialWeight}
          onClose={handleModalClose}
          onSubmit={handleWeightSubmit}
        />,
        document.body
      )}
    </>
  )
}

export default TrustAccountButton
