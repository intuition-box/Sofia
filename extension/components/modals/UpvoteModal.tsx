import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import '../styles/Modal.css'

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

  if (!isOpen) return null

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            <span>👍 Upvote this Claims</span>
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
          <div className="modal-identity-info">
            <div className="modal-avatar">
              <span className="modal-avatar-placeholder"></span>
            </div>
            <div className="modal-identity-details">
              <div className="modal-identity-name">{objectName}</div>
              <span className="modal-identity-type">{objectType}</span>
            </div>
          </div>

          <p className="modal-description">
            {currentUpvotes > 0 
              ? `You currently have ${currentUpvotes} upvote${currentUpvotes !== 1 ? 's' : ''} on this identity`
              : "Be the first to upvote this identity"
            }
          </p>

          <p className="modal-description">
            Upvoting is the lowest-risk way to attest, signal your support, and curate 
            the graph. Upvotes also earn trading fees from bonding-curve-related activities.
          </p>

          <div className="modal-controls">
            <div className="modal-counter">
              <button 
                className="modal-btn-round"
                onClick={handleDecrement}
                disabled={upvotes <= 0 || isProcessing}
              >
                −
              </button>
              
              <div className="modal-input-section">
                <div className="modal-input-icon">👍</div>
                <input
                  type="text"
                  className="modal-input"
                  value={upvotes}
                  onChange={handleInputChange}
                  disabled={isProcessing}
                  style={{ width: `${Math.max(2, upvotes.toString().length)}ch` }}
                />
              </div>
              
              <button 
                className="modal-btn-round"
                onClick={handleIncrement}
                disabled={isProcessing}
              >
                +
              </button>
            </div>

            <div className="modal-trust-amount">
              = {trustAmount} TRUST
            </div>
          </div>

          {difference !== 0 && (
            <div className="modal-change-info">
              {difference > 0 
                ? `Adding ${difference} upvote${difference !== 1 ? 's' : ''}`
                : `Removing ${Math.abs(difference)} upvote${Math.abs(difference) !== 1 ? 's' : ''}`
              }
            </div>
          )}

          <button 
            className="modal-btn primary"
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
    </div>,
    document.body
  )
}

export default UpvoteModal