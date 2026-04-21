import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useDeposit } from '../hooks/useDeposit'
import { useFeeEstimate } from '../hooks/useFeeEstimate'
import type { CartItem } from '../hooks/useCart'
import { EXPLORER_URL } from '../config'
import { intentionBadgeStyle } from '../config/intentions'
import SofiaLoader from './ui/SofiaLoader'
import './styles/weight-modal.css'

const WEIGHT_OPTIONS = [0.01, 0.5, 1, 5, 10]

interface WeightModalProps {
  isOpen: boolean
  items: CartItem[]
  onClose: () => void
  onSuccess: () => void
}

export default function WeightModal({ isOpen, items, onClose, onSuccess }: WeightModalProps) {
  const [weights, setWeights] = useState<number[]>([])
  const [customValues, setCustomValues] = useState<string[]>([])
  const [balance, setBalance] = useState<string | null>(null)
  const { depositBatch, processing, txResult, reset, getBalance } = useDeposit()
  const { estimate } = useFeeEstimate()

  useEffect(() => {
    if (isOpen && items.length > 0) {
      setWeights(new Array(items.length).fill(0.5))
      setCustomValues(new Array(items.length).fill(''))
      reset()
      getBalance().then(setBalance)
    }
  }, [isOpen, items.length, getBalance, reset])

  const getAmount = (index: number) => {
    const cv = customValues[index]
    return cv?.trim() ? (parseFloat(cv) || 0) : (weights[index] ?? 0.5)
  }

  const totalDeposit = useMemo(() => {
    return items.reduce((sum, _, i) => sum + getAmount(i), 0)
  }, [items, weights, customValues])

  const balNum = balance ? parseFloat(balance) : 0

  const breakdown = useMemo(() => {
    const costEstimate = estimate?.(totalDeposit) ?? null
    return {
      deposit: totalDeposit,
      sofiaFixedFee: costEstimate?.sofiaFixedFee ?? 0,
      sofiaPercentFee: costEstimate?.sofiaPercentFee ?? 0,
      totalFees: costEstimate?.totalFees ?? 0,
      totalEstimate: costEstimate?.totalEstimate ?? totalDeposit,
    }
  }, [totalDeposit, estimate])

  const handleWeightSelect = (index: number, value: number) => {
    setWeights(prev => { const n = [...prev]; n[index] = value; return n })
    setCustomValues(prev => { const n = [...prev]; n[index] = ''; return n })
  }

  const handleCustomChange = (index: number, value: string) => {
    setCustomValues(prev => { const n = [...prev]; n[index] = value; return n })
  }

  const handleSubmit = async () => {
    const batchItems = items.map((item, i) => ({
      termId: item.termId,
      amountTrust: getAmount(i),
    }))
    const result = await depositBatch(batchItems)
    if (result.success) onSuccess()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const formatTrust = (val: number): string => {
    if (val === 0) return '0'
    return parseFloat(val.toFixed(4)).toString()
  }

  const isFormState = !txResult && !processing

  if (!isOpen || items.length === 0) return null

  return createPortal(
    <div
      className={`wm-overlay ${processing ? 'wm-processing' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget && !processing) handleClose() }}
    >
      <div className="wm-content">
        <div className="wm-body">
          {/* Description — form state only */}
          {isFormState && (
            <p className="wm-description">Set your deposit amount and confirm.</p>
          )}

          {/* Triplet cards — always visible except on success */}
          {!txResult?.success && (
            <div className="wm-triplets-list">
              {items.map((item, index) => {
                const color = item.intentionColor || '#888'
                const isCustom = !!customValues[index]?.trim()
                const currentValue = isCustom
                  ? (customValues[index] || '')
                  : (weights[index] ?? 0.5)

                return (
                  <div key={item.id} className="wm-triplet-card">
                    {/* Centered triplet text */}
                    <div className="wm-triplet-text">
                      {item.favicon && (
                        <img
                          src={item.favicon}
                          alt=""
                          style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0 }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      )}
                      <span style={{ fontWeight: 500 }}>{item.title}</span>
                      <span
                        style={{
                          ...intentionBadgeStyle(color),
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 999,
                        }}
                      >
                        {item.intention}
                      </span>
                    </div>

                    {/* Amount input + pills — form state only */}
                    {isFormState && (
                      <div className="wm-amount-row">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={currentValue}
                          onChange={(e) => {
                            handleWeightSelect(index, 0) // clear preset
                            handleCustomChange(index, e.target.value)
                          }}
                          onFocus={(e) => {
                            handleCustomChange(index, String(currentValue))
                            e.target.select()
                          }}
                          className="wm-amount-input"
                          placeholder="0.01"
                          disabled={processing}
                        />
                        <div className="wm-pills">
                          {WEIGHT_OPTIONS.map((w) => (
                            <button
                              key={w}
                              onClick={() => handleWeightSelect(index, w)}
                              className={`wm-pill ${!isCustom && weights[index] === w ? 'wm-pill-active' : ''}`}
                              disabled={processing}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Cost summary — form state only */}
          {isFormState && (
            <div className="wm-cost-summary">
              <div className="wm-cost-row">
                <span>Deposit</span>
                <span style={{ fontWeight: 500 }}>{formatTrust(breakdown.deposit)} TRUST</span>
              </div>
              {breakdown.totalFees > 0 && (
                <>
                  <div className="wm-cost-divider" />
                  <div className="wm-cost-row" style={{ fontSize: 11, fontWeight: 600 }}>
                    <span>Fees</span>
                    <span>{formatTrust(breakdown.totalFees)} TRUST</span>
                  </div>
                  {breakdown.sofiaFixedFee > 0 && (
                    <div className="wm-cost-row" style={{ fontSize: 11, paddingLeft: 12, opacity: 0.6 }}>
                      <span>Sofia fixed fee</span>
                      <span>{formatTrust(breakdown.sofiaFixedFee)} TRUST</span>
                    </div>
                  )}
                  {breakdown.sofiaPercentFee > 0 && (
                    <div className="wm-cost-row" style={{ fontSize: 11, paddingLeft: 12, opacity: 0.6 }}>
                      <span>Sofia % fee</span>
                      <span>{formatTrust(breakdown.sofiaPercentFee)} TRUST</span>
                    </div>
                  )}
                  <div className="wm-cost-divider" />
                  <div className="wm-cost-row wm-cost-total">
                    <span>Total</span>
                    <span>{formatTrust(breakdown.totalEstimate)} TRUST</span>
                  </div>
                </>
              )}
              <div className={`wm-cost-row wm-cost-balance ${balNum < breakdown.totalEstimate ? 'wm-cost-insufficient' : ''}`}>
                <span>Balance</span>
                <span>{balance ? `${formatTrust(parseFloat(balance))} TRUST` : '...'}</span>
              </div>
              <p className="wm-cost-note">* Estimated — actual may vary</p>
            </div>
          )}

          {/* Success state */}
          {txResult?.success && (
            <div className="wm-success-card">
              <div className="wm-success-glow" />
              <div className="wm-success-inner">
                <p style={{ fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                  Transaction<br />Validated
                </p>
                <p className="text-sm text-muted-foreground" style={{ margin: 0 }}>
                  {items.length} deposit{items.length > 1 ? 's' : ''} submitted successfully
                </p>
                {txResult.txHash && (
                  <a
                    href={`${EXPLORER_URL}/tx/${txResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                    style={{ marginTop: 4 }}
                  >
                    View on Explorer →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Error state */}
          {txResult && !txResult.success && !processing && (
            <div className="wm-error-section">
              <span style={{ fontSize: 18 }}>❌</span>
              <div>
                <p className="text-sm font-semibold" style={{ margin: '0 0 4px' }}>Transaction Failed</p>
                <p className="text-xs text-destructive" style={{ margin: 0 }}>{txResult.error}</p>
              </div>
            </div>
          )}

          {/* Processing state */}
          {processing && !txResult?.success && (
            <div className="wm-processing-section">
              <SofiaLoader size={56} />
              <div className="wm-processing-text">
                <p className="text-sm font-medium" style={{ margin: 0 }}>Creating</p>
                <p className="text-xs text-muted-foreground" style={{ margin: 0 }}>
                  {items.length > 1 ? 'Batch deposit in progress...' : 'Deposit in progress...'}
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="wm-actions">
            <button
              className="wm-btn wm-btn-cancel"
              onClick={handleClose}
            >
              {txResult ? 'Close' : 'Cancel'}
            </button>
            {!txResult && (
              <button
                className="wm-btn wm-btn-submit"
                onClick={handleSubmit}
                disabled={processing || totalDeposit <= 0 || balNum < breakdown.totalEstimate}
              >
                {processing ? 'Submitting...' : `Submit ${items.length} Deposit${items.length > 1 ? 's' : ''}`}
              </button>
            )}
            {txResult && !txResult.success && !processing && (
              <button
                className="wm-btn wm-btn-submit"
                onClick={() => { reset(); handleSubmit() }}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
