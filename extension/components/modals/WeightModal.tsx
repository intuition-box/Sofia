import { useState, useEffect } from 'react'
import '../styles/WeightModal.css'

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
  { id: 'minimum', label: 'Minimum', value: 0.001, description: '0.001 TRUST - Light signal' },
  { id: 'default', label: 'Default', value: 0.05, description: '0.05 TRUST - Standard weight' },
  { id: 'strong', label: 'Strong', value: 0.1, description: '0.1 TRUST - High confidence' },
  { id: 'custom', label: 'Custom', value: null, description: 'Enter your own amount' }
]

const WeightModal = ({ isOpen, triplets, isProcessing, transactionSuccess = false, transactionError, onClose, onSubmit }: WeightModalProps) => {
  const [selectedWeights, setSelectedWeights] = useState<(WeightOption['id'])[]>([])
  const [customValues, setCustomValues] = useState<string[]>([])
  const [processingStep, setProcessingStep] = useState('')

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

  if (!isOpen || triplets.length === 0) return null

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
            return null // Use default weight if custom is empty
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

  return (
    <div className={`modal-overlay ${isProcessing ? 'processing' : ''}`}>
      <div className="modal-content">
        <h3>Amplify</h3>
        
        <div className="modal-section">
          <p className="modal-description">
            The weight represents the value you assign to this information. Choose how much TRUST to deposit for each signal.
          </p>
        </div>
        
        <div className="triplets-list">
          {triplets.map((triplet, index) => (
            <div key={triplet.id} className="modal-triplet-item">
              <div className="modal-triplet-info">
                <p>
                  <span className="subject">You</span>{' '}
                  <span className="action">{triplet.triplet.predicate}</span>{' '}
                  <span className="object">{triplet.triplet.object}</span>
                </p>
              </div>
              
              <div className="weight-options">
                {weightOptions.map((option) => (
                  <div key={option.id} className="weight-option">
                    <label className="weight-option-label">
                      <input
                        type="radio"
                        name={`weight-${index}`}
                        value={option.id}
                        checked={selectedWeights[index] === option.id}
                        onChange={() => handleWeightSelection(index, option.id)}
                        disabled={isProcessing}
                        className="weight-radio"
                      />
                      <span className="weight-radio-custom"></span>
                      <div className="weight-option-content">
                        <span className="weight-option-title">{option.label}</span>
                        <span className="weight-option-description">{option.description}</span>
                      </div>
                    </label>
                    {option.id === 'custom' && selectedWeights[index] === 'custom' && (
                      <input
                        type="number"
                        step="0.000001"
                        min="0"
                        placeholder="Enter amount (e.g., 0.025)"
                        value={customValues[index] || ''}
                        onChange={(e) => handleCustomValueChange(index, e.target.value)}
                        className="custom-weight-input"
                        disabled={isProcessing}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {(isProcessing || transactionSuccess || transactionError) && (
          <div className="processing-section">
            {isProcessing && <div className="loading-spinner"></div>}
            {transactionSuccess && <div className="success-icon">✅</div>}
            {transactionError && <div className="error-icon">❌</div>}
            <div className="processing-text">
              {isProcessing && (
                <>
                  <p className="processing-title">Creating Your {triplets.length === 1 ? 'Triplet' : 'Triplets'}</p>
                  <p className="processing-step">{processingStep}</p>
                </>
              )}
              {transactionSuccess && (
                <>
                  <p className="success-title">Transaction Validated</p>
                  <p className="success-step">Your {triplets.length === 1 ? 'triplet has' : 'triplets have'} been successfully amplified!</p>
                </>
              )}
              {transactionError && (
                <>
                  <p className="error-title">Transaction Failed</p>
                  <p className="error-step">{transactionError}</p>
                </>
              )}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button 
            className="modal-btn secondary"
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
  )
}

export default WeightModal