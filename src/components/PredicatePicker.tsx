import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Check } from 'lucide-react'
import type { CircleItem } from '../services/circleService'
import { INTENTION_COLORS, getSideColor } from '../config/intentions'

interface PredicatePickerProps {
  isOpen: boolean
  side: 'support' | 'oppose'
  item: CircleItem
  onConfirm: (selectedIntentions: string[]) => void
  onClose: () => void
}

export default function PredicatePicker({ isOpen, side, item, onConfirm, onClose }: PredicatePickerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Only show intentions that have vault IDs for the given side
  const availableIntentions = item.intentions.filter((intent) => {
    const vault = item.intentionVaults[intent]
    if (!vault) return false
    return side === 'support' ? !!vault.termId : !!vault.counterTermId
  })

  const toggle = (intent: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(intent)) next.delete(intent)
      else next.add(intent)
      return next
    })
  }

  const handleConfirm = () => {
    if (selected.size > 0) {
      onConfirm(Array.from(selected))
    }
  }

  if (!isOpen) return null

  const isSupport = side === 'support'
  const accentColor = getSideColor(side)

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <Card className="w-full max-w-md mx-4 p-0 overflow-hidden rounded-2xl" style={{ borderTop: `3px solid ${accentColor}`, zoom: 1.25 }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold" style={{ color: accentColor }}>
              {isSupport ? 'Support' : 'Oppose'}: Select Intentions
            </h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none p-1">&times;</button>
          </div>
          <p className="text-sm text-muted-foreground mt-2 truncate">{item.title}</p>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Intention pills */}
          <div className="flex flex-wrap gap-3">
            {availableIntentions.map((intent) => {
              const color = INTENTION_COLORS[intent] ?? '#888'
              const isSelected = selected.has(intent)
              return (
                <button
                  key={intent}
                  onClick={() => toggle(intent)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all"
                  style={{
                    borderColor: isSelected ? color : 'var(--border)',
                    backgroundColor: isSelected ? `${color}20` : 'transparent',
                    color: isSelected ? color : 'var(--muted-foreground)',
                  }}
                >
                  {isSelected && <Check className="h-4 w-4" />}
                  {intent}
                </button>
              )
            })}
          </div>

          {/* Quick select all */}
          {availableIntentions.length > 1 && (
            <button
              onClick={() => setSelected(new Set(availableIntentions))}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Select all
            </button>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl font-semibold"
              disabled={selected.size === 0}
              onClick={handleConfirm}
              style={{ backgroundColor: accentColor }}
            >
              Add to Cart ({selected.size})
            </Button>
          </div>
        </div>
      </Card>
    </div>,
    document.body,
  )
}
