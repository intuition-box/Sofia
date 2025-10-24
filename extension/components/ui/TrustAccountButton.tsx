import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTrustAccount } from '../../hooks/useTrustAccount'
import WeightModal from '../modals/WeightModal'
import type { EchoTriplet } from '../../types/blockchain'

interface TrustAccountButtonProps {
  accountVaultId: string
  accountLabel: string
  onSuccess?: () => void
}

const TrustAccountButton = ({ accountVaultId, accountLabel, onSuccess }: TrustAccountButtonProps) => {
  const { trustAccount, loading, error, success } = useTrustAccount()
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [transactionSuccess, setTransactionSuccess] = useState(false)
  const [transactionError, setTransactionError] = useState<string | null>(null)

  // Create a fake triplet object for WeightModal display
  const mockTriplet: EchoTriplet = {
    id: `trust-${accountVaultId}`,
    triplet: {
      subject: 'I',
      predicate: 'trust',
      object: accountLabel
    },
    url: '',
    description: `Trust relationship with ${accountLabel}`,
    timestamp: Date.now(),
    sourceMessageId: '',
    status: 'available'
  }

  const handleButtonClick = () => {
    setShowWeightModal(true)
    setTransactionError(null)
    setTransactionSuccess(false)
  }

  const handleWeightSubmit = async (customWeights?: (bigint | null)[]) => {
    try {
      const customWeight = customWeights?.[0] || undefined
      await trustAccount(accountVaultId, accountLabel, customWeight)

      setTransactionSuccess(true)

      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error('Failed to trust account:', err)
      setTransactionError(err instanceof Error ? err.message : 'Failed to create trust')
    }
  }

  const handleModalClose = () => {
    setShowWeightModal(false)
    setTransactionError(null)
    setTransactionSuccess(false)
  }

  return (
    <>
      <button
        className={`trust-page-button salmon-gradient-button ${loading ? 'loading' : ''} ${transactionSuccess ? 'success' : ''}`}
        onClick={handleButtonClick}
        disabled={loading}
      >
        <span className="trust-button-content">
          {loading ? 'Processing...' : 'TRUST'}
        </span>
      </button>

      {showWeightModal && createPortal(
        <WeightModal
          isOpen={showWeightModal}
          triplets={[mockTriplet]}
          isProcessing={loading}
          transactionSuccess={transactionSuccess}
          transactionError={transactionError || error}
          onClose={handleModalClose}
          onSubmit={handleWeightSubmit}
        />,
        document.body
      )}
    </>
  )
}

export default TrustAccountButton
