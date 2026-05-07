import { useEffect, useRef, type CSSProperties } from 'react'
import styles from './HexSplit.module.css'

interface HexSplitProps {
  /** Hex edge length. */
  size?: string
  /** Hex fill color (rgba string). */
  color?: string
}

/**
 * HexSplit — scroll-driven background decoration with two hexagons that
 * spread outward + rotate as the parent `<section>` scrolls past the
 * viewport. Pass `size` and `color` to tune the look per section.
 *
 * Implementation: shared `requestAnimationFrame`-throttled scroll
 * listener (one global instance), per-component element refs collected
 * in a module-level set. Disabled under `prefers-reduced-motion`.
 */
export function HexSplit({ size, color }: HexSplitProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    register(el)
    return () => unregister(el)
  }, [])

  const style: CSSProperties = {
    ...(size ? { ['--hex-size' as never]: size } : {}),
    ...(color ? { ['--hex-color' as never]: color } : {}),
  }

  return (
    <div ref={ref} className={styles.host} style={style} aria-hidden="true">
      <div className={`${styles.hex} ${styles.l}`} />
      <div className={`${styles.hex} ${styles.r}`} />
    </div>
  )
}

/* ── Shared scroll observer ───────────────────────────── */

const hosts = new Set<HTMLElement>()
let rafPending = false
let initialized = false
let reduced = false

function update() {
  rafPending = false
  if (reduced) return
  const vh = window.innerHeight
  hosts.forEach((host) => {
    const section = host.parentElement
    if (!section) return
    const r = section.getBoundingClientRect()
    const total = vh + r.height
    const passed = vh - r.top
    const p = Math.max(0, Math.min(1, passed / total))
    const max = Math.max(window.innerWidth * 0.9, 1200)
    host.style.setProperty('--hex-spread', `${p * max}px`)
    host.style.setProperty('--hex-rot', `${p * 60}deg`)
  })
}

function onScroll() {
  if (rafPending) return
  rafPending = true
  requestAnimationFrame(update)
}

function init() {
  if (initialized) return
  initialized = true
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  // Initial paint
  onScroll()
}

function register(el: HTMLElement) {
  hosts.add(el)
  init()
  onScroll()
}

function unregister(el: HTMLElement) {
  hosts.delete(el)
}
