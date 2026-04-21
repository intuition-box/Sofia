import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { useDeposit } from '../hooks/useDeposit'
import { EXPLORER_URL } from '../config'
import { getSideColor } from '../config/intentions'
import SofiaLoader from './ui/SofiaLoader'

const AMOUNTS = [0.01, 0.1, 0.5, 1, 5]

interface DepositModalProps {
  isOpen: boolean
  side: 'support' | 'oppose'
  termId: string
  title: string
  onClose: () => void
}

export default function DepositModal({ isOpen, side, termId, title, onClose }: DepositModalProps) {
  const [selected, setSelected] = useState(0.1)
  const [custom, setCustom] = useState('')
  const [balance, setBalance] = useState<string | null>(null)
  const { deposit, processing, txResult, reset, getBalance } = useDeposit()

  // Fetch balance when modal opens
  useEffect(() => {
    if (isOpen) {
      getBalance().then(setBalance)
      reset()
      setSelected(0.1)
      setCustom('')
    }
  }, [isOpen, getBalance, reset])

  const amount = custom.trim() ? parseFloat(custom) || 0 : selected
  const balNum = balance ? parseFloat(balance) : 0

  const handleSubmit = async () => {
    if (!termId || amount <= 0) return
    await deposit(termId, amount)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  const isSupport = side === 'support'
  const accentColor = getSideColor(side)

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !processing) handleClose() }}
    >
      <Card className="w-full max-w-sm mx-4 p-0 overflow-hidden" style={{ borderTop: `3px solid ${accentColor}` }}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold" style={{ color: accentColor }}>
              {isSupport ? 'Support' : 'Oppose'}
            </h3>
            {!processing && (
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">{title}</p>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Success state */}
          {txResult?.success && (
            <div className="text-center space-y-3 py-2">
              <div className="text-2xl">✅</div>
              <p className="text-sm font-semibold">Transaction confirmed!</p>
              {txResult.txHash && (
                <a
                  href={`${EXPLORER_URL}/tx/${txResult.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View on Explorer →
                </a>
              )}
              <Button className="w-full mt-2" onClick={handleClose}>Close</Button>
            </div>
          )}

          {/* Error state */}
          {txResult && !txResult.success && !processing && (
            <div className="space-y-3">
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-xs text-destructive">{txResult.error}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
                <Button className="flex-1" onClick={() => { reset(); handleSubmit() }}>Retry</Button>
              </div>
            </div>
          )}

          {/* Processing state */}
          {processing && (
            <div className="flex flex-col items-center gap-3 py-4">
              <SofiaLoader size={48} />
              <p className="text-sm text-muted-foreground">Confirming transaction...</p>
            </div>
          )}

          {/* Form state */}
          {!txResult && !processing && (
            <>
              {/* Amount pills */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Amount (TRUST)</label>
                <div className="flex flex-wrap gap-2">
                  {AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => { setSelected(amt); setCustom('') }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                      style={{
                        borderColor: !custom.trim() && selected === amt ? accentColor : 'var(--border)',
                        backgroundColor: !custom.trim() && selected === amt ? `${accentColor}15` : 'transparent',
                        color: !custom.trim() && selected === amt ? accentColor : 'var(--foreground)',
                      }}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  placeholder="Custom amount"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm"
                />
              </div>

              {/* Balance */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Balance</span>
                <span className={balNum < amount ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                  {balance ? `${parseFloat(balance).toFixed(4)} TRUST` : '...'}
                </span>
              </div>

              {/* Submit */}
              <Button
                className="w-full"
                disabled={amount <= 0 || balNum < amount}
                onClick={handleSubmit}
                style={{ backgroundColor: accentColor }}
              >
                {isSupport ? 'Support' : 'Oppose'} · {amount} TRUST
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>,
    document.body,
  )
}
