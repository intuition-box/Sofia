import { createContext, useContext, useState, useCallback, createElement } from 'react'
import type { ReactNode } from 'react'

export interface CartItem {
  id: string
  side: 'support' | 'oppose'
  termId: string
  intention: string
  title: string
  favicon: string
  intentionColor: string
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
      if (prev.some((p) => p.termId === item.termId && p.side === item.side)) return prev
      return [...prev, item]
    })
  }, [])

  const addItems = useCallback((newItems: CartItem[]) => {
    setItems((prev) => {
      const merged = [...prev]
      for (const item of newItems) {
        if (!merged.some((p) => p.termId === item.termId && p.side === item.side)) {
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

  return createElement(CartContext.Provider, { value: { items, count: items.length, addItem, addItems, removeItem, clear } }, children)
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
