import { useEffect, useRef, type CSSProperties } from 'react'
import styles from './HexSplit.module.css'

interface HexSplitProps {
  size?: string
  color?: string
}

/**
 * HexSplit — two hexagons that spread outward and rotate when the
 * closest `[data-deck-slide]` ancestor becomes active. Waits the wipe
 * duration (~700ms), then animates --hex-spread from 0 → max and
 * --hex-rot from 0 → 60deg over ~1.4s with an easeOutCubic curve.
 * Resets when the slide leaves.
 */
export function HexSplit({ size, color }: HexSplitProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host = ref.current
    const slide = host?.closest('[data-deck-slide]') as HTMLElement | null
    if (!host || !slide) return
    const DELAY = 700
    const DURATION = 1400
    let raf = 0
    let timer: ReturnType<typeof setTimeout> | null = null
    const max = Math.max(window.innerWidth * 0.4, 480)
    const setVars = (p: number) => {
      host.style.setProperty('--hex-spread', `${p * max}px`)
      host.style.setProperty('--hex-rot', `${p * 60}deg`)
    }
    const animate = () => {
      const start = performance.now()
      const tick = () => {
        const elapsed = performance.now() - start
        const t = Math.min(1, elapsed / DURATION)
        const p = 1 - Math.pow(1 - t, 3)
        setVars(p)
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    const begin = () => {
      setVars(0)
      timer = setTimeout(animate, DELAY)
    }
    const reset = () => {
      cancelAnimationFrame(raf)
      if (timer) clearTimeout(timer)
      setVars(0)
    }
    let active = slide.dataset.active === 'true'
    if (active) begin()
    const mo = new MutationObserver(() => {
      const next = slide.dataset.active === 'true'
      if (next && !active) begin()
      if (!next && active) reset()
      active = next
    })
    mo.observe(slide, { attributes: true, attributeFilter: ['data-active'] })
    return () => {
      cancelAnimationFrame(raf)
      if (timer) clearTimeout(timer)
      mo.disconnect()
    }
  }, [])
  const style: CSSProperties = {
    ...(size ? ({ ['--hex-size' as never]: size } as CSSProperties) : {}),
    ...(color ? ({ ['--hex-color' as never]: color } as CSSProperties) : {}),
  }
  return (
    <div ref={ref} className={styles.host} style={style} aria-hidden="true">
      <div className={`${styles.hex} ${styles.l}`} />
      <div className={`${styles.hex} ${styles.r}`} />
    </div>
  )
}
