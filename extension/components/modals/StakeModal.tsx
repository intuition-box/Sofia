import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Iridescence from '../ui/Iridescence'
import '../styles/Modal.css'

interface StakeModalProps {
  isOpen: boolean
  subjectName: string
  predicateName: string
  objectName: string
  tripleId: string
  currentLinear: number           // Position en TRUST sur Curve 1
  currentOffsetProgressive: number // Position en TRUST sur Curve 2
  totalMarketCap: string          // Market cap pour Curve 2
  defaultCurve?: 1 | 2           // Curve pré-sélectionnée (défaut: 2)
  onClose: () => void
  onSubmit: (amount: bigint, curveId: 1 | 2) => Promise<void>
  isProcessing?: boolean
}

const StakeModal = ({
  isOpen,
  subjectName,
  predicateName,
  objectName,
  tripleId,
  currentLinear,
  currentOffsetProgressive,
  totalMarketCap,
  defaultCurve = 2,
  onClose,
  onSubmit,
  isProcessing = false
}: StakeModalProps) => {
  const [selectedCurve, setSelectedCurve] = useState<1 | 2>(defaultCurve)
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setSelectedCurve(defaultCurve)
    }
  }, [isOpen, defaultCurve])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value)
    }
  }

  const handleToggleCurve = () => {
    setSelectedCurve(prev => prev === 1 ? 2 : 1)
    setAmount('') // Reset amount when switching
  }

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (numAmount > 0) {
      // Convert TRUST to Wei (1 TRUST = 10^18 Wei)
      const weiAmount = BigInt(Math.floor(numAmount * 1e18))
      await onSubmit(weiAmount, selectedCurve)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const numAmount = parseFloat(amount) || 0
  const canSubmit = numAmount > 0 && !isProcessing

  // Get current position based on selected curve
  const currentPosition = selectedCurve === 1 ? currentLinear : currentOffsetProgressive

  // Get curve label
  const curveLabel = selectedCurve === 1 ? 'Linear' : 'Offset Progressive'

  return createPortal(
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content stake-modal-content">
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-title">Stake</span>
            <span className={`stake-curve-badge ${selectedCurve === 1 ? 'linear' : 'offset'}`}>
              {curveLabel}
            </span>
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

          {/* Triple Display */}
          <div
            className="stake-triple-box clickable"
            onClick={() => window.open(`https://portal.intuition.systems/explore/triple/${tripleId}?tab=positions`, '_blank')}
            title="View on Intuition Portal"
          >
            <div className="stake-triple-icon">⭕</div>
            <span className="stake-triple-name">
              <span className="stake-triple-subject">{subjectName}</span>
              {' '}
              <span className="stake-triple-predicate">{predicateName}</span>
              {' '}
              <span className="stake-triple-object">{objectName}</span>
            </span>
          </div>

          {/* Your Active Position */}
          <div className="stake-position-section">
            <div className="stake-position-header">Your Active Position</div>
            <div className="stake-position-display">
              <span className={`stake-curve-badge-small ${selectedCurve === 1 ? 'linear' : 'offset'}`}>
                {curveLabel}
              </span>
              <span className="stake-position-value">{currentPosition.toFixed(4)} shares</span>
            </div>
          </div>

          {/* Curve Toggle */}
          <div className="stake-toggle-section">
            <span className="stake-toggle-label">{curveLabel}</span>
            <label className="stake-toggle-switch">
              <input
                type="checkbox"
                checked={selectedCurve === 2}
                onChange={handleToggleCurve}
                disabled={isProcessing}
              />
              <span className="stake-toggle-slider"></span>
            </label>
          </div>

          {/* Amount Input */}
          <div className="modal-section">
            <div className="modal-custom-label">TRUST</div>
            <input
              type="text"
              value={amount}
              onChange={handleInputChange}
              className="modal-custom-input"
              placeholder="Enter an Amount"
              disabled={isProcessing}
            />
          </div>

          {/* Submit Button */}
          <div className="modal-actions">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="modal-btn primary"
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
                {isProcessing ? 'Processing...' : `Stake ${numAmount > 0 ? numAmount.toFixed(2) : '0'} TRUST`}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default StakeModal
