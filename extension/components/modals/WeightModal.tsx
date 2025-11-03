import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Iridescence from '../ui/Iridescence'
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
  { id: 'default', label: 'Default', value: 0.05, description: '0.05 TRUST' },
  { id: 'strong', label: 'Strong', value: 0.1, description: '0.1 TRUST' },
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

  if (!isOpen || triplets.length === 0) return null

  return createPortal(
    <div className={`modal-overlay ${isProcessing ? 'processing' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">Amplify</div>
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
              
                <div className="modal-weight-options">
                  {weightOptions.map((option) => (
                    <div key={option.id} className="modal-weight-option">
                      <label className="modal-weight-option-label">
                        <input
                          type="radio"
                          name={`weight-${index}`}
                          value={option.id}
                          checked={selectedWeights[index] === option.id}
                          onChange={() => handleWeightSelection(index, option.id)}
                          disabled={isProcessing}
                          className="modal-weight-radio"
                        />
                        <span className="modal-weight-radio-custom"></span>
                        <div className="modal-weight-option-content">
                          <span className="modal-weight-option-title">{option.label}</span>
                          <span className="modal-weight-option-description">{option.description}</span>
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
                          className="modal-custom-input"
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
            <div className="modal-processing-section">
              {isProcessing && <div className="modal-loading-spinner"></div>}
              {transactionSuccess && <div className="modal-success-icon">✅</div>}
              {transactionError && <div className="modal-error-icon">❌</div>}
              <div className="modal-processing-text">
                {isProcessing && (
                  <>
                    <p className="modal-processing-title">Creating</p>
                    <p className="modal-processing-step">{processingStep}</p>
                  </>
                )}
                {transactionSuccess && (
                  <>
                    <p className="modal-success-title">Transaction Validated</p>
                    <p className="modal-success-step">Your claims has been successfully amplified!</p>
                  </>
                )}
                {transactionError && (
                  <>
                    <p className="modal-error-title">Transaction Failed</p>
                    <p className="modal-error-step">{transactionError}</p>
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
                <div className="modal-btn-background">
                  <Iridescence
                    color={[1, 0.4, 0.5]}
                    speed={0.3}
                    mouseReact={false}
                    amplitude={0.1}
                    zoom={0.05}
                  />
                </div>
                <div className="modal-btn-content">
                  {isProcessing ? 'Amplifying...' : 'Amplify'}
                </div>
              </button>
            )}
            {transactionError && (
              <button
                className="modal-btn primary"
                onClick={handleSubmit}
                disabled={isProcessing}
              >
                <div className="modal-btn-background">
                  <Iridescence
                    color={[1, 0.4, 0.5]}
                    speed={0.3}
                    mouseReact={false}
                    amplitude={0.1}
                    zoom={0.05}
                  />
                </div>
                <div className="modal-btn-content">
                  Retry
                </div>
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