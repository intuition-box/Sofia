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
  onClose: () => void
  onSubmit: (customWeights?: (bigint | null)[]) => Promise<void>
}

const WeightModal = ({ isOpen, triplets, isProcessing, onClose, onSubmit }: WeightModalProps) => {
  const [customWeights, setCustomWeights] = useState<string[]>([])
  const [processingStep, setProcessingStep] = useState('')

  // Initialize weights array when triplets change
  useEffect(() => {
    if (triplets.length > 0) {
      setCustomWeights(new Array(triplets.length).fill(''))
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
      // Convert string weights to bigint array with null for empty values
      const weightBigIntArray: (bigint | null)[] = customWeights.map(weight => {
        if (weight && weight.trim() !== '') {
          // Convert TRUST to Wei (1 TRUST = 10^18 Wei)
          const trustValue = parseFloat(weight)
          return BigInt(Math.floor(trustValue * 1e18))
        }
        return null // Use default weight
      })
      
      await onSubmit(weightBigIntArray)
      setCustomWeights(new Array(triplets.length).fill(''))
    } catch (error) {
      console.error('Failed to submit weights:', error)
    }
  }

  const handleClose = () => {
    setCustomWeights(new Array(triplets.length).fill(''))
    onClose()
  }

  return (
    <div className={`modal-overlay ${isProcessing ? 'processing' : ''}`}>
      <div className="modal-content">
        <h3>Amplify {triplets.length === 1 ? 'Triplet' : `${triplets.length} Triplets`}</h3>
        
        <div className="modal-section">
          <p className="modal-description">
            The weight represents the value you assign to this information. The more TRUST you deposit, 
            the more you weight this signal as important and reliable according to you. 
            Leave empty for default weight, or enter a custom amount (e.g., 0.001).
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
              <input
                type="number"
                step="0.000001"
                min="0"
                placeholder="0.001 (or leave empty for default)"
                value={customWeights[index] || ''}
                onChange={(e) => {
                  const newWeights = [...customWeights]
                  newWeights[index] = e.target.value
                  setCustomWeights(newWeights)
                }}
                className="weight-input"
                disabled={isProcessing}
              />
            </div>
          ))}
        </div>

        {isProcessing && (
          <div className="processing-section">
            <div className="loading-spinner"></div>
            <div className="processing-text">
              <p className="processing-title">Creating Your {triplets.length === 1 ? 'Triplet' : 'Triplets'}</p>
              <p className="processing-step">{processingStep}</p>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button 
            className="modal-btn secondary"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button 
            className="modal-btn primary"
            onClick={handleSubmit}
            disabled={isProcessing}
          >
            {isProcessing ? 'Amplifying...' : 'Amplify'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WeightModal