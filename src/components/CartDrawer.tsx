import { X, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import type { CartItem } from '../hooks/useCart'
import { INTENTION_COLORS } from '../config/intentions'
import './styles/cart-drawer.css'

interface CartDrawerProps {
  items: CartItem[]
  isOpen: boolean
  onClose: () => void
  onRemove: (id: string) => void
  onClear: () => void
  onSubmit: () => void
}

export default function CartDrawer({ items, isOpen, onClose, onRemove, onClear, onSubmit }: CartDrawerProps) {
  // No zoom — manual sizing. RightSidebar = w-72 (288px) × 1.25 = 360px, top 71px
  return (
    <aside
      className={`fixed right-0 overflow-hidden cd-aside ${isOpen ? 'cd-open' : ''}`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          {items.length > 0 ? (
            <button onPointerDown={(e) => { e.stopPropagation(); onClear() }} className="text-sm text-muted-foreground hover:text-destructive transition-colors">
              Clear all
            </button>
          ) : (
            <span />
          )}
          <button
            onPointerDown={(e) => { e.stopPropagation(); onClose() }}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <img src="/logo.png" alt="Sofia" className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">Your cart is empty</p>
              <p className="text-xs mt-2 opacity-70">Click Support or Oppose on any claim</p>
            </div>
          ) : (
            items.map((item) => {
              const color = item.intentionColor || INTENTION_COLORS[item.intention] || 'var(--foreground)'
              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-border bg-card px-3 py-2 flex items-center gap-3 transition-colors hover:bg-muted/30"
                  style={{ borderLeftWidth: 3, borderLeftColor: color }}
                >
                  {item.favicon && (
                    <img
                      src={item.favicon}
                      alt=""
                      className="h-7 w-7 rounded shrink-0 bg-muted"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-snug line-clamp-1">{item.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5"
                        style={{ backgroundColor: `${color}20`, borderWidth: '1px', borderStyle: 'solid', borderColor: `${color}40`, borderRadius: '6px' }}
                      >
                        {item.intention}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: item.side === 'support' ? '#10B981' : '#EF4444' }}>
                        {item.side === 'support' ? '▲ Support' : '▼ Oppose'}
                      </span>
                    </div>
                  </div>
                  <button onPointerDown={() => onRemove(item.id)} className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-muted/50 transition-colors shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-4">
            <Button className="w-full h-10 rounded-lg font-semibold text-sm" onPointerDown={onSubmit}>
              Submit All ({items.length} item{items.length > 1 ? 's' : ''})
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}
