import React, { useState } from 'react'
import '../styles/Modal.css'

interface FollowModalProps {
  accountLabel: string
  onFollow: (trustAmount: string) => Promise<void>
  onClose: () => void
}

const FollowModal = ({
  accountLabel,
  onFollow,
  onClose
}: FollowModalProps) => {
  const [trustAmount, setTrustAmount] = useState('0.01')
  const [loading, setLoading] = useState(false)

  // Predefined amounts based on Intuition's follow-actions.tsx
  const predefinedAmounts = [
    { label: 'Minimum', value: '0.01' },
    { label: 'Default', value: '0.05' },
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
    try {
      await onFollow(trustAmount)
    } catch (error) {
      console.error('❌ FollowModal - Follow failed', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e: any) => {
    if (e.target === e.currentTarget) {
      console.log('🚪 FollowModal - Backdrop clicked, closing modal')
      onClose()
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={handleBackdropClick}
    >
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            Follow {accountLabel}
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

          <div className="modal-section">
            <div className="modal-custom-label">Quick amounts (TRUST)</div>
            <div className="modal-amount-options">
              {predefinedAmounts.map(amount => (
                <button
                  key={amount.value}
                  onClick={() => handleAmountSelect(amount.value)}
                  className={`modal-amount-option ${trustAmount === amount.value ? 'selected' : ''}`}
                >
                  <span className="modal-amount-label">{amount.label}</span>
                  <span className="modal-amount-value">{amount.value} TRUST</span>
                </button>
              ))}
            </div>
          </div>

          <div className="modal-custom-amount">
            <div className="modal-custom-label">Custom amount (TRUST)</div>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={trustAmount}
              onChange={handleCustomAmountChange}
              className="modal-custom-input"
              placeholder="Enter amount..."
              disabled={loading}
            />
            <p className="modal-custom-hint">
              Minimum: 0.01 TRUST
            </p>
          </div>

          <div className="modal-actions">
            <button
              onClick={onClose}
              disabled={loading}
              className="modal-btn secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmFollow}
              disabled={loading || parseFloat(trustAmount) < 0.01}
              className="modal-btn primary"
            >
              {loading ? 'Processing...' : `Follow with ${trustAmount} TRUST`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FollowModal