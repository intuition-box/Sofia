import { useEffect, useRef, useState } from 'react'
import { tweenValue } from '../lib/tween'

export interface AnimatedNumberProps {
  value: number
  /** Turns the running value into text (keep the app's own formatting). */
  format?: (n: number) => string
  /** Run length in ms. Defaults to 600. */
  duration?: number
  /** Briefly tint the number green when it rises, red when it falls. */
  flash?: boolean
  className?: string
}

const defaultFormat = (n: number) => Math.round(n).toLocaleString()

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * `<AnimatedNumber>` — a number that counts to its new value when it changes
 * (a background refresh, a mined position), from wherever it stands. The
 * first render shows the value as is; reduced motion jumps straight to it.
 *
 * Requires `import "@0xsofia/design-system/styles/animated-number.css"` for
 * `flash`.
 */
export function AnimatedNumber({
  value,
  format = defaultFormat,
  duration = 600,
  flash = false,
  className,
}: AnimatedNumberProps) {
  const [shown, setShown] = useState(value)
  const [trend, setTrend] = useState<'up' | 'down' | null>(null)
  const shownRef = useRef(value)

  useEffect(() => {
    const from = shownRef.current
    if (from === value || !Number.isFinite(value) || !Number.isFinite(from)) {
      shownRef.current = value
      setShown(value)
      return
    }
    if (flash) setTrend(value > from ? 'up' : 'down')
    if (prefersReducedMotion()) {
      shownRef.current = value
      setShown(value)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const next = tweenValue(from, value, now - start, duration)
      shownRef.current = next
      setShown(next)
      if (next !== value) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, flash])

  useEffect(() => {
    if (!trend) return
    const t = setTimeout(() => setTrend(null), duration + 400)
    return () => clearTimeout(t)
  }, [trend, duration])

  const cls = [
    'ds-animated-number',
    trend ? `ds-animated-number--${trend}` : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')
  return <span className={cls}>{format(shown)}</span>
}
