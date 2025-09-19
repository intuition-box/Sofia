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
  triplet: EchoTriplet | null
  isProcessing: boolean
  onClose: () => void
  onSubmit: (customWeight?: bigint) => Promise<void>
}

const WeightModal = ({ isOpen, triplet, isProcessing, onClose, onSubmit }: WeightModalProps) => {
  const [customWeight, setCustomWeight] = useState('')
  const [processingStep, setProcessingStep] = useState('')

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

  if (!isOpen || !triplet) return null

  const handleSubmit = async () => {
    try {
      let weightBigInt: bigint | undefined
      if (customWeight && customWeight.trim() !== '') {
        // Convert TRUST to Wei (1 TRUST = 10^18 Wei)
        const trustValue = parseFloat(customWeight)
        weightBigInt = BigInt(Math.floor(trustValue * 1e18))
      }
      
      await onSubmit(weightBigInt)
      setCustomWeight('')
    } catch (error) {
      console.error('Failed to submit weight:', error)
    }
  }

  const handleClose = () => {
    setCustomWeight('')
    onClose()
  }

  return (
    <div className={`modal-overlay ${isProcessing ? 'processing' : ''}`}>
      <div className="modal-content">
        <h3>Amplify Triplet</h3>
        
        <div className="modal-triplet-info">
          <p>
            <span className="subject">You</span>{' '}
            <span className="action">{triplet.triplet.predicate}</span>{' '}
            <span className="object">{triplet.triplet.object}</span>
          </p>
        </div>
        
        <div className="modal-section">
          <label htmlFor="weight-input">Custom Weight (TRUST)</label>
          <p className="modal-description">
            The weight represents the value you assign to this information. The more TRUST you deposit, 
            the more you weight this signal as important and reliable according to you. 
            Leave empty for default weight, or enter a custom amount (e.g., 0.001).
          </p>
          <input
            id="weight-input"
            type="number"
            step="0.000001"
            min="0"
            placeholder="0.001"
            value={customWeight}
            onChange={(e) => setCustomWeight(e.target.value)}
            className="weight-input"
            disabled={isProcessing}
          />
        </div>

        {isProcessing && (
          <div className="processing-section">
            <div className="loading-spinner"></div>
            <div className="processing-text">
              <p className="processing-title">Creating Your Triplet</p>
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