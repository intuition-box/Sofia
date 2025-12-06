import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Iridescence from '../ui/Iridescence'
import '../styles/Modal.css'

interface StakeModalProps {
  isOpen: boolean
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

  // Reset amount when switching curves
  const handleCurveChange = (curve: 1 | 2) => {
    setSelectedCurve(curve)
    setAmount('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value)
    }
  }

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (numAmount > 0) {
      // Convert TRUST to Wei (1 TRUST = 10^18 Wei)
      const weiAmount = BigInt(Math.floor(numAmount * 1e18))
      await onSubmit(weiAmount, selectedCurve)
    }
  }

  if (!isOpen) return null

  const numAmount = parseFloat(amount) || 0
  const canSubmit = numAmount > 0 && !isProcessing

  // Get current position based on selected curve
  const currentPosition = selectedCurve === 1 ? currentLinear : currentOffsetProgressive

  // Get description based on selected curve
  const description = selectedCurve === 1
    ? "Linear is the lowest-risk way to attest. The share price is never going down"
    : "Buy signal share and earn fees. Share price can fluctuate"

  // Format market cap for display (only for Curve 2)
  const formatMarketCap = (cap: string): string => {
    try {
      const value = Number(BigInt(cap)) / 1e18
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(2)}M`
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}K`
      }
      return value.toFixed(4)
    } catch {
      return '0'
    }
  }

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            <span>Stake</span>
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
          {/* Curve Toggle */}
          <div className="curve-toggle">
            <button
              className={`curve-toggle-option ${selectedCurve === 1 ? 'selected' : ''}`}
              onClick={() => handleCurveChange(1)}
              disabled={isProcessing}
            >
              Linear
            </button>
            <button
              className={`curve-toggle-option ${selectedCurve === 2 ? 'selected' : ''}`}
              onClick={() => handleCurveChange(2)}
              disabled={isProcessing}
            >
              Offset Progressive
            </button>
          </div>

          {/* Current Position */}
          {currentPosition > 0 && (
            <p className="modal-description">
              {currentPosition.toFixed(4)} shares
            </p>
          )}

          {/* Description */}
          <p className="modal-description">
            {description}
          </p>

          {/* Amount Input */}
          <div className="modal-amount-section">
            <label className="modal-amount-label">Amount to stake</label>
            <div className="modal-amount-input-container">
              <input
                type="text"
                className="modal-amount-input"
                value={amount}
                onChange={handleInputChange}
                placeholder="0.00"
                disabled={isProcessing}
              />
              <span className="modal-amount-suffix">TRUST</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            className="modal-btn primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            <div className="modal-btn-background">
              <Iridescence
                color={[0.4, 0.3, 0.8]}
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
    </div>,
    document.body
  )
}

export default StakeModal
