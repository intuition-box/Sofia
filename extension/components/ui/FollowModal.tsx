import React, { useState } from 'react'

interface FollowModalProps {
  accountLabel: string
  onFollow: (trustAmount: string) => Promise<void>
  onClose: () => void
}

const FollowModal: React.FC<FollowModalProps> = ({
  accountLabel,
  onFollow,
  onClose
}) => {
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

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      console.log('🚪 FollowModal - Backdrop clicked, closing modal')
      onClose()
    }
  }

  return (
    <div
      className="follow-modal-backdrop"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        className="follow-modal-content"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827'
          }}>
            Follow {accountLabel}
          </h3>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Choose how much TRUST to stake on this follow relationship
          </p>
        </div>

        {/* Predefined amounts */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Quick amounts (TRUST)
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {predefinedAmounts.map(amount => (
              <button
                key={amount.value}
                onClick={() => handleAmountSelect(amount.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: trustAmount === amount.value ? '2px solid #3b82f6' : '1px solid #d1d5db',
                  backgroundColor: trustAmount === amount.value ? '#dbeafe' : 'white',
                  color: trustAmount === amount.value ? '#1d4ed8' : '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '12px', opacity: 0.8 }}>{amount.label}</span>
                <span>{amount.value} TRUST</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount input */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Custom amount (TRUST)
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={trustAmount}
            onChange={handleCustomAmountChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '16px',
              outline: 'none'
            }}
            placeholder="Enter amount..."
          />
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            Minimum: 0.01 TRUST
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              color: '#374151',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: loading ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmFollow}
            disabled={loading || parseFloat(trustAmount) < 0.01}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: 'white',
              cursor: (loading || parseFloat(trustAmount) < 0.01) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: (loading || parseFloat(trustAmount) < 0.01) ? 0.6 : 1
            }}
          >
            {loading ? 'Processing...' : `Follow with ${trustAmount} TRUST`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FollowModal