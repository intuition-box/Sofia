import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  createElement,
} from 'react'
import type { ReactNode } from 'react'

/** Draft payload carried by a `kind: 'create-circle'` cart item. The
 *  drawer collects this; WeightModal expands it into a circle atom +
 *  membership triple + N has_tag triples at submit time. */
export interface CircleDraft {
  name: string
  description: string
  /** Topic atom slugs (keys of TOPIC_ATOM_IDS) — one has_tag triple per
   *  entry is minted alongside the membership triple. */
  topicIds: string[]
}

/** Draft payload carried by a `kind: 'create-skill'` cart item. WeightModal
 *  mints the skill/tool object atom (Atlas-identical Thing) then the
 *  `[you → is_skilled_in/uses → skill]` triple at submit time. */
export interface SkillDraft {
  /** IPFS Thing for the object atom — must match Atlas byte-for-byte. */
  payload: { name: string; description: string; image: string; url: string }
  /** is_skilled_in (skills) / uses (tools) predicate term_id. */
  predicateId: string
  /** Canonical label + category, for the cart row + grouping. */
  label: string
  category: 'skill' | 'tool'
}

export interface CartItem {
  id: string
  side: 'support' | 'oppose'
  /** Existing-triple termId for deposits, the deterministic tripleId
   *  for `kind: 'create-triple'`, or a `pending:<draftKey>` sentinel
   *  for `kind: 'create-circle'` (no on-chain id known until submit).
   *  Used as the dedupe key in the cart. */
  termId: string
  intention: string
  title: string
  favicon: string
  intentionColor: string
  /** Routing tag — WeightModal partitions items by `kind`:
   *   - 'deposit'        → SofiaFeeProxy.deposit / depositBatch
   *   - 'create-triple'  → SofiaFeeProxy.createTriples (atoms must exist)
   *   - 'create-circle'  → atomCreationService + createTriples (mints
   *                        circle atom + membership + has_tag triples)
   *   - 'redeem'         → MultiVault.redeem (retrieves all shares)
   *   - 'create-skill'   → atomCreationService (mints skill/tool atom) +
   *                        createTriples ([you → is_skilled_in/uses → skill])
   *  Defaults to 'deposit' for back-compat with existing callers. */
  kind?:
    | 'deposit'
    | 'create-triple'
    | 'create-circle'
    | 'redeem'
    | 'create-skill'
  /** Required when `kind === 'create-triple'`. The atom term_ids that
   *  identify the new triple's subject / predicate / object. */
  subjectId?: string
  predicateId?: string
  objectId?: string
  /** Required when `kind === 'create-circle'`. */
  circleDraft?: CircleDraft
  /** Required when `kind === 'create-skill'`. */
  skillDraft?: SkillDraft
}

interface CartContextValue {
  items: CartItem[]
  count: number
  /** True when the cart drawer is currently visible. Components that
   *  add items can call `open()` to surface the drawer immediately so
   *  the user sees their pending action queued up. */
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  addItem: (item: CartItem) => void
  addItems: (items: CartItem[]) => void
  removeItem: (id: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

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
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((o) => !o), [])

  // Auto-close when the cart becomes empty so the slot frees up for
  // the right-rail content. Mirrors the pre-context behavior in App.tsx.
  useEffect(() => {
    if (isOpen && items.length === 0) setIsOpen(false)
  }, [isOpen, items.length])

  return createElement(
    CartContext.Provider,
    {
      value: {
        items,
        count: items.length,
        isOpen,
        open,
        close,
        toggle,
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
