import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Iridescence from '../ui/Iridescence'
import '../styles/Modal.css'

interface SharesModalProps {
  isOpen: boolean
  objectName: string
  tripleId: string
  currentShares: number       // Current user shares in TRUST
  totalMarketCap: string      // Total market cap from blockchain
  onClose: () => void
  onSubmit: (amount: bigint) => Promise<void>
  isProcessing?: boolean
}

const SharesModal = ({
  isOpen,
  objectName,
  tripleId,
  currentShares,
  totalMarketCap,
  onClose,
  onSubmit,
  isProcessing = false
}: SharesModalProps) => {
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (isOpen) {
      setAmount('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value)
    }
  }

  const handlePresetClick = (preset: number) => {
    setAmount(preset.toString())
  }

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (numAmount > 0) {
      // Convert TRUST to Wei (1 TRUST = 10^18 Wei)
      const weiAmount = BigInt(Math.floor(numAmount * 1e18))
      await onSubmit(weiAmount)
    }
  }

  const numAmount = parseFloat(amount) || 0
  const canSubmit = numAmount > 0 && !isProcessing

  // Format market cap for display
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
            <span>{objectName}</span>
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

          {/* Market Cap Display */}
          <div className="modal-market-cap">
            <div className="modal-market-cap-label">Total Market Cap</div>
            <div className="modal-market-cap-value">
              {formatMarketCap(totalMarketCap)} TRUST
            </div>
          </div>

          {currentShares > 0 && (
            <p className="modal-description">
              You currently have {currentShares.toFixed(4)} TRUST in shares on this signal.
            </p>
          )}

          <p className="modal-description">
            Invest in this signal's shares (Curve 2). Shares represent your stake in this
            triple and earn trading fees from bonding curve activities.
          </p>

          {/* Amount Input */}
          <div className="modal-amount-section">
            <label className="modal-amount-label">Amount to invest</label>
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

          {/* Preset Buttons */}
          <div className="modal-presets">
            <button
              className="modal-preset-btn"
              onClick={() => handlePresetClick(0.01)}
              disabled={isProcessing}
            >
              0.01
            </button>
            <button
              className="modal-preset-btn"
              onClick={() => handlePresetClick(0.05)}
              disabled={isProcessing}
            >
              0.05
            </button>
            <button
              className="modal-preset-btn"
              onClick={() => handlePresetClick(0.1)}
              disabled={isProcessing}
            >
              0.1
            </button>
            <button
              className="modal-preset-btn"
              onClick={() => handlePresetClick(0.5)}
              disabled={isProcessing}
            >
              0.5
            </button>
            <button
              className="modal-preset-btn"
              onClick={() => handlePresetClick(1)}
              disabled={isProcessing}
            >
              1.0
            </button>
          </div>

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
              {isProcessing ? 'Processing...' : `Invest ${numAmount > 0 ? numAmount.toFixed(2) : '0'} TRUST`}
            </div>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default SharesModal
