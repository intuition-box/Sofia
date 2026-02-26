import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useBalance } from 'wagmi'
import { formatUnits, getAddress } from 'viem'
import SofiaLoader from '../ui/SofiaLoader'
import { useWalletFromStorage } from '../../hooks'
import { EXPLORER_URLS } from '../../lib/config/chainConfig'
import { createHookLogger } from '../../lib/utils/logger'
import '../styles/Modal.css'

const logger = createHookLogger('StakeModal')

interface StakeModalProps {
  isOpen: boolean
  subjectName: string
  predicateName: string
  objectName: string
  tripleId: string
  defaultCurve?: 1 | 2           // Curve pré-sélectionnée (défaut: 2)
  onClose: () => void
  onSubmit: (amount: bigint, curveId: 1 | 2) => Promise<{ success: boolean, txHash?: string, error?: string }>
  isProcessing?: boolean
}

const StakeModal = ({
  isOpen,
  subjectName,
  predicateName,
  objectName,
  tripleId,
  defaultCurve = 2,
  onClose,
  onSubmit,
  isProcessing = false
}: StakeModalProps) => {
  const [selectedCurve, setSelectedCurve] = useState<1 | 2>(defaultCurve)
  const [amount, setAmount] = useState('10')
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Get wallet address from storage
  const { walletAddress, authenticated } = useWalletFromStorage()

  // Get checksum address for GraphQL queries and balance
  const checksumAddress = walletAddress ? getAddress(walletAddress) : undefined

  const { data: balanceData } = useBalance({
    address: checksumAddress,
  })

  // Parse balance to number (in TRUST)
  const userBalance = balanceData
    ? parseFloat(formatUnits(balanceData.value, balanceData.decimals))
    : 0

  logger.debug('Wallet info', {
    walletAddress,
    checksumAddress,
    authenticated,
    userBalance,
    tripleId,
    selectedCurve
  })

  // Predefined amounts - Changed to 10, 25, 50, MAX
  const predefinedAmounts = [
    { label: '10 TRUST', value: '10' },
    { label: '25 TRUST', value: '25' },
    { label: '50 TRUST', value: '50' },
    { label: 'MAX', value: userBalance.toFixed(2) }
  ]

  useEffect(() => {
    if (isOpen) {
      setAmount('10')
      setSelectedCurve(defaultCurve)
      setTransactionHash(null)
      setTransactionError(null)
      setIsSuccess(false)
    }
  }, [isOpen, defaultCurve])

  const handleAmountSelect = (amountValue: string) => {
    setAmount(amountValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value)
    }
  }

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (numAmount > 0) {
      // Reset states at the start of transaction
      setTransactionError(null)
      setIsSuccess(false)
      setTransactionHash(null)

      try {
        // Convert TRUST to Wei (1 TRUST = 10^18 Wei)
        const weiAmount = BigInt(Math.floor(numAmount * 1e18))
        logger.info('Starting transaction', { amount: numAmount, weiAmount: weiAmount.toString() })
        const result = await onSubmit(weiAmount, selectedCurve)
        logger.info('Transaction result', result)

        if (result.success && result.txHash) {
          logger.info('Transaction successful, setting txHash', { txHash: result.txHash })
          setTransactionHash(result.txHash)
          setIsSuccess(true)
        } else if (result.error) {
          logger.error('Transaction error', result.error)
          setTransactionError(result.error)
        }
      } catch (error) {
        logger.error('Transaction failed', error)
        setTransactionError(error instanceof Error ? error.message : 'Transaction failed')
      }
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
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

  if (!isOpen) return null

  const numAmount = parseFloat(amount) || 0
  const canSubmit = numAmount > 0 && !isProcessing

  return createPortal(
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content stake-modal-content">
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-title">Stake</span>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={isProcessing}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Staking on a Triple enhances its discoverability in the Intuition system.
          </p>

          {/* Triple Display - WeightModal style */}
          <div
            className="modal-triplet-info clickable"
            onClick={() => window.open(`https://portal.intuition.systems/explore/triple/${tripleId}?tab=positions`, '_blank')}
            title="View on Intuition Portal"
          >
            <p>
              <span className="subject">{subjectName}</span>{' '}
              <span className="action">{predicateName}</span>{' '}
              <span className="object">{objectName}</span>
            </p>
          </div>

          {/* Bonding Curve Chart removed - now shown in expanded card view */}

          {/* Amount Section - New Layout */}
          <div className="stake-amount-section">
            <div className="stake-amount-title">Amount</div>

            {/* Input with integrated toggle */}
            <div className="stake-input-container">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={handleInputChange}
                onFocus={(e) => e.target.select()}
                className="stake-amount-input"
                placeholder="Min Amount 0.01 TRUST"
                disabled={isProcessing}
              />

              {/* Toggle switch integrated in input */}
              <div className="stake-input-toggle">
                <span className="stake-toggle-label">
                  {selectedCurve === 1 ? 'Linear' : 'Offset'}
                </span>
                <label className="stake-toggle-switch">
                  <input
                    type="checkbox"
                    checked={selectedCurve === 1}
                    onChange={() => setSelectedCurve(selectedCurve === 1 ? 2 : 1)}
                    disabled={isProcessing}
                  />
                  <span className="stake-toggle-slider"></span>
                </label>
              </div>
            </div>

            {/* Balance display */}
            <div className="stake-balance">Balance: {userBalance} TRUST</div>

            {/* Amount Pills */}
            <div className="stake-amount-pills">
              {predefinedAmounts.map(presetAmount => (
                <button
                  key={presetAmount.value}
                  onClick={() => handleAmountSelect(presetAmount.value)}
                  className={`stake-amount-pill ${amount === presetAmount.value ? 'selected' : ''}`}
                  disabled={isProcessing}
                >
                  {presetAmount.label}
                </button>
              ))}
            </div>
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
          {isProcessing && !isSuccess && (
            <div className="modal-processing-section">
              <SofiaLoader size={60} />
              <div className="modal-processing-text">
                <p className="modal-processing-title">Processing...</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="modal-actions">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="stake-btn stake-btn-cancel"
            >
              {(isSuccess || transactionError) ? 'Close' : 'Cancel'}
            </button>
            {!isProcessing && !isSuccess && !transactionError && (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="stake-btn stake-btn-submit"
              >
                Stake
              </button>
            )}
            {transactionError && (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="stake-btn stake-btn-submit"
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

export default StakeModal
