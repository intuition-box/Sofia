import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"

/**
 * Declarative card stack — transforms computed during render (no DOM
 * manipulation). Returns style getters and interaction handlers.
 */
export function useCardStack(count: number, peekPx: number, scaleFactor: number, maxVisible?: number) {
  const [userPositions, setUserPositions] = useState<number[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [noAnim, setNoAnim] = useState(true)

  const positions = useMemo(() => {
    if (userPositions.length === count) return userPositions
    return Array.from({ length: count }, (_, i) => i)
  }, [userPositions, count])

  // Cap visual depth so transforms stay bounded regardless of count
  const visualDepth = maxVisible
    ? Math.min(count - 1, maxVisible)
    : Math.max(0, count - 1)

  // Pure style computation — called during render, always in sync
  const getStyle = useCallback(
    (index: number): React.CSSProperties => {
      const pos = positions[index] ?? index
      const clamped = Math.min(pos, visualDepth)
      const ty = (visualDepth - clamped) * peekPx
      const sc = 1 - clamped * scaleFactor
      return { transform: `translateY(${ty}px) scale(${sc})` }
    },
    [positions, visualDepth, peekPx, scaleFactor]
  )

  const stackPadding = visualDepth * peekPx

  // Enable CSS transitions after first paint
  useEffect(() => {
    const id = requestAnimationFrame(() => setNoAnim(false))
    return () => cancelAnimationFrame(id)
  }, [])

  const selectCard = useCallback(
    (index: number) => {
      const clickedPos = positions[index]
      if (clickedPos === 0) return
      const n = positions.length
      setUserPositions(
        positions.map((p) => (p - clickedPos + n) % n)
      )
    },
    [positions]
  )

  const getPos = useCallback(
    (index: number) => positions[index] ?? index,
    [positions]
  )

  return { containerRef, getStyle, getPos, selectCard, noAnim, stackPadding }
}
