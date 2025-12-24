import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useBalance } from 'wagmi'
import { formatUnits, getAddress } from 'viem'
// Removed Iridescence import - using CSS salmon gradient now
import SofiaLoader from '../ui/SofiaLoader'
import { useWalletFromStorage } from '../../hooks/useWalletFromStorage'
import { EXPLORER_URLS } from '../../lib/config/chainConfig'
import '../styles/Modal.css'

interface FollowModalProps {
  accountLabel: string
  onFollow: (trustAmount: string) => Promise<{ success: boolean, txHash?: string, error?: string }>
  onClose: () => void
}

const FollowModal = ({
  accountLabel,
  onFollow,
  onClose
}: FollowModalProps) => {
  const [trustAmount, setTrustAmount] = useState('0.01')
  const [loading, setLoading] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Get wallet address from storage
  const { walletAddress } = useWalletFromStorage()

  // Get checksum address for balance
  const checksumAddress = walletAddress ? getAddress(walletAddress) : undefined

  const { data: balanceData } = useBalance({
    address: checksumAddress,
  })

  // Parse balance to number (in TRUST)
  const userBalance = balanceData
    ? parseFloat(formatUnits(balanceData.value, balanceData.decimals))
    : 0

  // Predefined amounts
  const predefinedAmounts = [
    { label: 'Minimum', value: '0.01' },
    { label: 'Default', value: '0.5' },
    { label: 'Strong', value: '1' }
  ]

  const handleAmountSelect = (amount: string) => {
    console.log('💰 FollowModal - Amount selected', amount)
    setTrustAmount(amount)
  }

  const handleCustomAmountChange = (e: any) => {
    const value = e.target.value
    console.log('💰 FollowModal - Custom amount entered', value)
    setTrustAmount(value)
  }

  const handleConfirmFollow = async () => {
    console.log('✅ FollowModal - Confirm follow clicked', {
      accountLabel,
      trustAmount
    })

    // Allow empty amount for default weight
    if (trustAmount.trim() !== '') {
      const amount = parseFloat(trustAmount)
      if (amount < 0.01) {
        console.warn('⚠️ FollowModal - Amount too low', amount)
        alert('Minimum amount is 0.01 TRUST')
        return
      }
    }

    setLoading(true)
    setTransactionError(null)
    setIsSuccess(false)
    setTransactionHash(null)
    try {
      const result = await onFollow(trustAmount)
      console.log('📊 FollowModal - Transaction result:', result)

      if (result.success && result.txHash) {
        console.log('✅ FollowModal - Success! Setting txHash:', result.txHash)
        setTransactionHash(result.txHash)
        setIsSuccess(true)
      } else if (result.error) {
        console.error('❌ FollowModal - Error:', result.error)
        setTransactionError(result.error)
      }
    } catch (error) {
      console.error('❌ FollowModal - Follow failed', error)
      setTransactionError(error instanceof Error ? error.message : 'Transaction failed')
    } finally {
      setLoading(false)
      console.log('📊 FollowModal - Final state:', { isSuccess, transactionHash, transactionError })
    }
  }

  const handleBackdropClick = (e: any) => {
    if (e.target === e.currentTarget) {
      console.log('🚪 FollowModal - Backdrop clicked, closing modal')
      onClose()
    }
  }

  // Parse error message to show only essential info
  const parseErrorMessage = (error: string): string => {
    // Extract "Shares addition failed:" or "Weight addition failed:"
    const failedMatch = error.match(/(Shares addition failed|Weight addition failed):/i)
    const failedText = failedMatch ? failedMatch[0] : 'Transaction failed:'

    // Extract "Details:" section
    const detailsMatch = error.match(/Details:\s*(.+?)(?:\n|$)/i)
    const detailsText = detailsMatch ? `Details: ${detailsMatch[1]}` : ''

    return detailsText ? `${failedText}\n${detailsText}` : failedText
  }

  return createPortal(
    <div
      className="modal-overlay"
      onClick={handleBackdropClick}
    >
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            Follow
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Choose how much TRUST to stake on this follow relationship
          </p>

          {/* Triple Display */}
          <div className="modal-triplet-info">
            <p>
              <span className="subject">I</span>{' '}
              <span className="action">follow</span>{' '}
              <span className="object">{accountLabel}</span>
            </p>
          </div>

          <div className="modal-custom-amount">
            <div className="modal-amount-row">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={trustAmount}
                onChange={handleCustomAmountChange}
                onFocus={(e) => e.target.select()}
                className="modal-custom-input"
                placeholder="Min 0.01 TRUST"
                disabled={loading}
              />
              <div className="modal-amount-options">
                {predefinedAmounts.map(amount => (
                  <button
                    key={amount.value}
                    onClick={() => handleAmountSelect(amount.value)}
                    className={`modal-amount-option ${trustAmount === amount.value ? 'selected' : ''}`}
                  >
                    {amount.value}
                  </button>
                ))}
              </div>
            </div>
            {/* Balance display */}
            <div className="stake-balance">Balance: {userBalance} TRUST</div>
          </div>

          {/* Success State */}
          {isSuccess && transactionHash && (
            <div className="modal-processing-section modal-success-section">
              <div className="modal-success-text">
                <p className="modal-success-title">Transaction Validated</p>
                <a
                  href={`${EXPLORER_URLS.TRANSACTION}${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-tx-link"
                >
                  View on Explorer →
                </a>
              </div>
            </div>
          )}

          {/* Error State */}
          {transactionError && !isSuccess && (
            <div className="modal-error-section">
              <div className="modal-error-icon">❌</div>
              <div className="modal-error-text">
                <p className="modal-error-title">Transaction Failed</p>
                <p className="modal-error-message">{parseErrorMessage(transactionError)}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && !isSuccess && (
            <div className="modal-processing-section">
              <SofiaLoader size={60} />
              <div className="modal-processing-text">
                <p className="modal-processing-title">Processing...</p>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              onClick={onClose}
              disabled={loading}
              className="stake-btn stake-btn-cancel"
            >
              {(isSuccess || transactionError) ? 'Close' : 'Cancel'}
            </button>
            {!loading && !isSuccess && !transactionError && (
              <button
                onClick={handleConfirmFollow}
                disabled={parseFloat(trustAmount) < 0.01}
                className="modal-btn primary"
              >
                Follow
              </button>
            )}
            {transactionError && (
              <button
                onClick={handleConfirmFollow}
                disabled={parseFloat(trustAmount) < 0.01}
                className="modal-btn primary"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default FollowModal