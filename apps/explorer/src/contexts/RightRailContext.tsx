/**
 * RightRailContext — slot for per-page `<RightSidebar>` content.
 *
 * Pages call `useProvideRightRail(<Foo />)` to inject their own
 * right-rail content for their lifetime. The `<RightSidebar>` reads
 * the slot; when empty it falls back to the generic default. Pages
 * own their rail content — `App.tsx` never branches on routes.
 *
 * The context is split in two (setter / content) so pages that only
 * write don't re-render when content changes. Without this split,
 * a page that wrote `<NewElement />` on every render subscribed to
 * its own update, triggering an infinite re-render loop.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type RailSetter = (id: string, node: ReactNode | null) => void

const RightRailSetterContext = createContext<RailSetter>(() => {})
const RightRailContentContext = createContext<ReactNode | null>(null)

export function RightRailProvider({ children }: { children: ReactNode }) {
  // Stack of providers keyed by id — last one wins, but the full
  // stack is kept so unmount order is safe regardless.
  const [stack, setStack] = useState<{ id: string; node: ReactNode }[]>([])

  const setContent = useCallback<RailSetter>((id, node) => {
    setStack((prev) => {
      const without = prev.filter((entry) => entry.id !== id)
      return node == null ? without : [...without, { id, node }]
    })
  }, [])

  const content = stack.length > 0 ? stack[stack.length - 1].node : null

  return (
    <RightRailSetterContext.Provider value={setContent}>
      <RightRailContentContext.Provider value={content}>
        {children}
      </RightRailContentContext.Provider>
    </RightRailSetterContext.Provider>
  )
}

/** Read the current right-rail slot. Used by `<RightSidebar>`. */
export function useRightRailContent(): ReactNode | null {
  return useContext(RightRailContentContext)
}

let nextSlotId = 0

/**
 * Inject `node` into the right-rail slot for the current page. The
 * slot is cleared automatically on unmount. Pass `null` to temporarily
 * hide page-specific content and fall back to the default rail.
 *
 * Only subscribes to the stable setter — so the caller does NOT
 * re-render when other pages update their content.
 */
export function useProvideRightRail(node: ReactNode | null): void {
  const setContent = useContext(RightRailSetterContext)
  const idRef = useRef<string | null>(null)
  if (idRef.current == null) {
    idRef.current = `rail-${++nextSlotId}`
  }
  const id = idRef.current

  useEffect(() => {
    setContent(id, node)
    return () => {
      setContent(id, null)
    }
  }, [setContent, id, node])
}
