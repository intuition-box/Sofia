import {
  createContext,
  useContext,
  useState,
  useCallback,
  createElement,
} from 'react'
import type { ReactNode } from 'react'

export interface CartItem {
  id: string
  side: 'support' | 'oppose'
  /** Existing-triple termId for deposits, or the deterministic tripleId
   *  (calculated client-side via SofiaFeeProxy.calculateTripleId) for
   *  brand-new create-triple items. Used as the dedupe key in the cart. */
  termId: string
  intention: string
  title: string
  favicon: string
  intentionColor: string
  /** When 'create-triple', WeightModal mints the triple via
   *  SofiaFeeProxy.createTriples instead of depositing on an existing
   *  termId. Defaults to 'deposit' for back-compat with existing
   *  callers (Support/Oppose, Interest, Trust). */
  kind?: 'deposit' | 'create-triple'
  /** Required when `kind === 'create-triple'`. The atom term_ids that
   *  identify the new triple's subject / predicate / object. */
  subjectId?: string
  predicateId?: string
  objectId?: string
}

interface CartContextValue {
  items: CartItem[]
  count: number
  addItem: (item: CartItem) => void
  addItems: (items: CartItem[]) => void
  removeItem: (id: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      if (prev.some((p) => p.termId === item.termId && p.side === item.side))
        return prev
      return [...prev, item]
    })
  }, [])

  const addItems = useCallback((newItems: CartItem[]) => {
    setItems((prev) => {
      const merged = [...prev]
      for (const item of newItems) {
        if (
          !merged.some((p) => p.termId === item.termId && p.side === item.side)
        ) {
          merged.push(item)
        }
      }
      return merged
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  return createElement(
    CartContext.Provider,
    {
      value: {
        items,
        count: items.length,
        addItem,
        addItems,
        removeItem,
        clear,
      },
    },
    children,
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
