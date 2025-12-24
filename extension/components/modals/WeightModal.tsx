import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useBalance } from 'wagmi'
import { formatUnits, getAddress } from 'viem'
// Removed Iridescence import - using CSS salmon gradient now
import SofiaLoader from '../ui/SofiaLoader'
import { useWalletFromStorage } from '../../hooks/useWalletFromStorage'
import { EXPLORER_URLS } from '../../lib/config/chainConfig'
import '../styles/Modal.css'

interface Triplet {
  subject: string
  predicate: string
  object: string
}

interface EchoTriplet {
  id: string
  triplet: Triplet
  description: string
  url: string
}

interface WeightModalProps {
  isOpen: boolean
  triplets: EchoTriplet[]
  isProcessing: boolean
  transactionSuccess?: boolean
  transactionError?: string
  transactionHash?: string  // Transaction hash for block explorer link
  createdCount?: number   // Number of newly created triples
  depositCount?: number   // Number of deposits on existing triples
  onClose: () => void
  onSubmit: (customWeights?: (bigint | null)[]) => Promise<void>
}

type WeightOption = {
  id: 'minimum' | 'default' | 'strong' | 'custom'
  label: string
  value: number | null
  description: string
}

const weightOptions: WeightOption[] = [
  { id: 'minimum', label: 'Minimum', value: 0.01, description: '0.01 TRUST' },
  { id: 'default', label: 'Default', value: 0.5, description: '0.5 TRUST' },
  { id: 'strong', label: 'Strong', value: 1, description: '1 TRUST' },
  { id: 'custom', label: 'Custom', value: null, description: 'Enter your own amount' }
]

const WeightModal = ({ isOpen, triplets, isProcessing, transactionSuccess = false, transactionError, transactionHash, createdCount = 0, depositCount = 0, onClose, onSubmit }: WeightModalProps) => {
  const [selectedWeights, setSelectedWeights] = useState<(WeightOption['id'])[]>([])
  const [customValues, setCustomValues] = useState<string[]>([])
  const [processingStep, setProcessingStep] = useState('')

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

  // Initialize weights array when triplets change
  useEffect(() => {
    if (triplets.length > 0) {
      setSelectedWeights(new Array(triplets.length).fill('default'))
      setCustomValues(new Array(triplets.length).fill(''))
    }
  }, [triplets])

  // Processing animation steps
  useEffect(() => {
    if (isProcessing) {
      const steps = [
        'Preparing triplet...',
        'Creating atoms...',
        'Publishing to blockchain...',
        'Confirming transaction...'
      ]

      let stepIndex = 0
      setProcessingStep(steps[0])

      const interval = setInterval(() => {
        stepIndex = (stepIndex + 1) % steps.length
        setProcessingStep(steps[stepIndex])
      }, 2000)

      return () => clearInterval(interval)
    } else {
      setProcessingStep('')
    }
  }, [isProcessing])

  const handleSubmit = async () => {
    try {
      // Convert selected weights to bigint array
      const weightBigIntArray: (bigint | null)[] = selectedWeights.map((selectedWeight, index) => {
        let trustValue: number
        
        if (selectedWeight === 'custom') {
          const customValue = customValues[index]
          if (customValue && customValue.trim() !== '') {
            trustValue = parseFloat(customValue)
          } else {
            // Return default weight when custom field is empty
            trustValue = 0.05
          }
        } else {
          const option = weightOptions.find(opt => opt.id === selectedWeight)
          trustValue = option?.value || 0.05 // fallback to default
        }
        
        // Convert TRUST to Wei (1 TRUST = 10^18 Wei)
        return BigInt(Math.floor(trustValue * 1e18))
      })
      
      await onSubmit(weightBigIntArray)
      setSelectedWeights(new Array(triplets.length).fill('default'))
      setCustomValues(new Array(triplets.length).fill(''))
    } catch (error) {
      console.error('Failed to submit weights:', error)
    }
  }

  const handleClose = () => {
    setSelectedWeights(new Array(triplets.length).fill('default'))
    setCustomValues(new Array(triplets.length).fill(''))
    onClose()
  }

  const handleWeightSelection = (tripletIndex: number, optionId: WeightOption['id']) => {
    const newSelectedWeights = [...selectedWeights]
    newSelectedWeights[tripletIndex] = optionId
    setSelectedWeights(newSelectedWeights)
  }

  const handleCustomValueChange = (tripletIndex: number, value: string) => {
    const newCustomValues = [...customValues]
    newCustomValues[tripletIndex] = value
    setCustomValues(newCustomValues)
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

  if (!isOpen || triplets.length === 0) return null

  return createPortal(
    <div className={`modal-overlay ${isProcessing ? 'processing' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
        </div>
        
        <div className="modal-body">
          <p className="modal-description">
            The weight represents the value you assign to this information. Choose how much TRUST to deposit for each signal.
          </p>
        
          <div className="modal-triplets-list">
            {triplets.map((triplet, index) => (
              <div key={triplet.id} className="modal-triplet-item">
                <div className="modal-triplet-info">
                <p>
                  <span className="subject">I</span>{' '}
                  <span className="action">{triplet.triplet.predicate}</span>{' '}
                  <span className="object">{triplet.triplet.object}</span>
                </p>
              </div>

                {/* Amount Section */}
                <div className="modal-custom-amount">
                  <div className="modal-amount-row">
                    <input
                      type="number"
                      min="0"
                      step="0.000001"
                      value={
                        selectedWeights[index] === 'custom'
                          ? (customValues[index] || '')
                          : (weightOptions.find(opt => opt.id === selectedWeights[index])?.value || '')
                      }
                      onChange={(e) => {
                        handleWeightSelection(index, 'custom')
                        handleCustomValueChange(index, e.target.value)
                      }}
                      onFocus={(e) => {
                        handleWeightSelection(index, 'custom')
                        e.target.select()
                      }}
                      className="modal-custom-input"
                      placeholder="Min 0.01 TRUST"
                      disabled={isProcessing}
                    />
                    <div className="modal-amount-options">
                      {weightOptions.filter(opt => opt.id !== 'custom').map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleWeightSelection(index, option.id)}
                          className={`modal-amount-option ${selectedWeights[index] === option.id ? 'selected' : ''}`}
                          disabled={isProcessing}
                        >
                          {option.value}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Balance display - only show for first triplet to avoid repetition */}
                  {index === 0 && (
                    <div className="stake-balance">Balance: {userBalance} TRUST</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Success State */}
          {transactionSuccess && (
            <div className="modal-processing-section modal-success-section">
              <div className="modal-success-text">
                <p className="modal-success-title">Transaction Validated</p>
                <p className="modal-success-step">
                  {createdCount > 0 && depositCount > 0
                    ? `${createdCount} signal${createdCount > 1 ? 's' : ''} created, ${depositCount} existing signal${depositCount > 1 ? 's' : ''} reinforced!`
                    : depositCount > 0
                      ? `Your signal${depositCount > 1 ? 's have' : ' has'} been reinforced!`
                      : `Your signal${createdCount > 1 ? 's have' : ' has'} been amplified!`
                  }
                </p>
                {transactionHash && (
                  <a
                    href={`${EXPLORER_URLS.TRANSACTION}${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-tx-link"
                  >
                    View on Explorer →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Error State */}
          {transactionError && !transactionSuccess && (
            <div className="modal-error-section">
              <div className="modal-error-icon">❌</div>
              <div className="modal-error-text">
                <p className="modal-error-title">Transaction Failed</p>
                <p className="modal-error-message">{parseErrorMessage(transactionError)}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isProcessing && !transactionSuccess && (
            <div className="modal-processing-section">
              <SofiaLoader size={60} />
              <div className="modal-processing-text">
                <p className="modal-processing-title">Creating</p>
                <p className="modal-processing-step">{processingStep}</p>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button 
              className="stake-btn stake-btn-cancel"
              onClick={handleClose}
              disabled={isProcessing}
            >
              {(transactionSuccess || transactionError) ? 'Close' : 'Cancel'}
            </button>
            {!transactionSuccess && !transactionError && (
              <button
                className="modal-btn primary"
                onClick={handleSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? 'Amplifying...' : 'Amplify'}
              </button>
            )}
            {transactionError && (
              <button
                className="modal-btn primary"
                onClick={handleSubmit}
                disabled={isProcessing}
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

export default WeightModal