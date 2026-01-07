import { useState, useEffect } from 'react'
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
  const { trustAccount, loading, error, success, transactionHash } = useTrustAccount()
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [transactionSuccess, setTransactionSuccess] = useState(false)
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const [localTransactionHash, setLocalTransactionHash] = useState<string | null>(null)

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
    setLocalTransactionHash(null)
  }

  const handleWeightSubmit = async (customWeights?: (bigint | null)[]) => {
    try {
      const customWeight = customWeights?.[0] || undefined
      await trustAccount(accountVaultId, accountLabel, customWeight)

      // Success will be detected by the useEffect watching the hook's success state
      // The hook will update transactionHash and success states

      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error('Failed to trust account:', err)
      setTransactionError(err instanceof Error ? err.message : 'Failed to create trust')
    }
  }

  // Sync states from hook - wait for loading to finish before updating
  useEffect(() => {
    console.log('📊 TrustAccountButton - Hook state changed:', { loading, success, error, transactionHash })

    // Only update when not loading (transaction finished)
    if (!loading) {
      if (success && transactionHash) {
        console.log('✅ TrustAccountButton - Success with txHash:', transactionHash)
        setTransactionSuccess(true)
        setLocalTransactionHash(transactionHash)
        setTransactionError(null)
      } else if (success && !transactionHash) {
        console.log('✅ TrustAccountButton - Success without txHash (triple exists)')
        setTransactionSuccess(true)
        setTransactionError(null)
        setLocalTransactionHash(null)
      } else if (error) {
        console.log('❌ TrustAccountButton - Error:', error)
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
        className={`trust-page-button salmon-gradient-button ${loading ? 'loading' : ''} ${transactionSuccess ? 'success' : ''}`}
        onClick={handleButtonClick}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Trust'}
      </button>

      {showWeightModal && createPortal(
        <WeightModal
          isOpen={showWeightModal}
          triplets={[mockTriplet]}
          isProcessing={loading}
          transactionSuccess={transactionSuccess}
          transactionError={transactionError || error}
          transactionHash={localTransactionHash || undefined}
          onClose={handleModalClose}
          onSubmit={handleWeightSubmit}
        />,
        document.body
      )}
    </>
  )
}

export default TrustAccountButton
