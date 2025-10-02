import { useState, useEffect } from 'react'
import '../styles/UpvoteModal.css'

interface UpvoteModalProps {
  isOpen: boolean
  objectName: string
  objectType: string
  currentUpvotes: number
  onClose: () => void
  onSubmit: (newUpvotes: number) => Promise<void>
  isProcessing?: boolean
}

const UpvoteModal = ({ 
  isOpen, 
  objectName, 
  objectType, 
  currentUpvotes, 
  onClose, 
  onSubmit,
  isProcessing = false 
}: UpvoteModalProps) => {
  const [upvotes, setUpvotes] = useState(currentUpvotes)

  useEffect(() => {
    setUpvotes(currentUpvotes)
  }, [currentUpvotes, isOpen])

  if (!isOpen) return null

  const handleIncrement = () => {
    setUpvotes(prev => prev + 1)
  }

  const handleDecrement = () => {
    setUpvotes(prev => Math.max(0, prev - 1))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, parseInt(e.target.value) || 0)
    setUpvotes(value)
  }

  const handleSubmit = async () => {
    await onSubmit(upvotes)
  }

  const trustAmount = (upvotes * 0.001).toFixed(3)
  const difference = upvotes - currentUpvotes

  return (
    <div className="upvote-modal-overlay">
      <div className="upvote-modal-content">
        <div className="upvote-modal-header">
          <div className="upvote-modal-title">
            <span>👍 Upvote this Claims</span>
          </div>
          <button 
            className="upvote-modal-close"
            onClick={onClose}
            disabled={isProcessing}
          >
            ✕
          </button>
        </div>

        <div className="upvote-modal-body">
          <div className="upvote-identity-info">
            <div className="upvote-avatar">
              <span className="upvote-avatar-placeholder"></span>
            </div>
            <div className="upvote-identity-details">
              <div className="upvote-identity-name">{objectName}</div>
              <span className="upvote-identity-type">{objectType}</span>
            </div>
          </div>

          <p className="upvote-description">
            {currentUpvotes > 0 
              ? `You currently have ${currentUpvotes} upvote${currentUpvotes !== 1 ? 's' : ''} on this identity`
              : "Be the first to upvote this identity"
            }
          </p>

          <p className="upvote-explanation">
            Upvoting is the lowest-risk way to attest, signal your support, and curate 
            the graph. Upvotes also earn trading fees from bonding-curve-related activities.
          </p>

          <div className="upvote-controls">
            <div className="upvote-counter">
              <button 
                className="upvote-btn upvote-btn-minus"
                onClick={handleDecrement}
                disabled={upvotes <= 0 || isProcessing}
              >
                −
              </button>
              
              <div className="upvote-input-section">
                <div className="upvote-icon">👍</div>
                <input
                  type="text"
                  className="upvote-input"
                  value={upvotes}
                  onChange={handleInputChange}
                  disabled={isProcessing}
                  style={{ width: `${Math.max(2, upvotes.toString().length)}ch` }}
                />
              </div>
              
              <button 
                className="upvote-btn upvote-btn-plus"
                onClick={handleIncrement}
                disabled={isProcessing}
              >
                +
              </button>
            </div>

            <div className="upvote-trust-amount">
              = {trustAmount} TRUST
            </div>
          </div>

          {difference !== 0 && (
            <div className="upvote-change-info">
              {difference > 0 
                ? `Adding ${difference} upvote${difference !== 1 ? 's' : ''}`
                : `Removing ${Math.abs(difference)} upvote${Math.abs(difference) !== 1 ? 's' : ''}`
              }
            </div>
          )}

          <button 
            className="upvote-submit-btn"
            onClick={handleSubmit}
            disabled={isProcessing || difference === 0}
          >
            {isProcessing ? 'Processing...' : 
             difference > 0 ? 'Add Upvotes' : 
             difference < 0 ? 'Remove Upvotes' : 
             'Upvote'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpvoteModal