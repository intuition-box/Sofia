import { useState, useEffect, useRef } from 'react'
import type { StatsRibbonProps } from '../types'
import './styles/stats-ribbon.css'

function parseValue(str: string) {
  const match = str.match(/^([0-9.,\s]+)(.*)$/)
  if (!match) return { num: 0, suffix: '', decimals: 0 }
  const numStr = match[1].replace(/[^0-9.]/g, '')
  const suffix = match[2].trim()
  const num = parseFloat(numStr) || 0
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0
  return { num, suffix, decimals }
}

function formatValue(current: number, suffix: string, decimals: number) {
  const formatted = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString()
  return suffix ? `${formatted} ${suffix}` : formatted
}

function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function useAnimatedNumber(value: string) {
  const [display, setDisplay] = useState('0')
  const ref = useRef<HTMLElement>(null)
  const animated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const { num, suffix, decimals } = parseValue(value)
    if (num === 0) {
      setDisplay(formatValue(0, suffix, decimals))
      return
    }
    animated.current = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true
          const duration = 2000
          const start = performance.now()
          function tick(now: number) {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const current = easeOutExpo(progress) * num
            setDisplay(formatValue(current, suffix, decimals))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  return { display, ref }
}

function HeroNumber({ value }: { value: string }) {
  const { display, ref } = useAnimatedNumber(value)
  // Split numeric part from trailing unit (e.g. "12.34 T")
  const match = display.match(/^([\d.,\s]+)(.*)$/)
  const numPart = match ? match[1].trim() : display
  const unitPart = match ? match[2].trim() : ''
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="sr-hero-value">
      <span>{numPart}</span>
      {unitPart && <span className="sr-hero-unit">{unitPart}</span>}
    </div>
  )
}

function CellNumber({ value }: { value: string }) {
  const { display, ref } = useAnimatedNumber(value)
  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className="sr-cell-value">
      {display}
    </span>
  )
}

export default function StatsRibbon({ stats = [] }: StatsRibbonProps) {
  if (stats.length === 0) return null

  // Pick the most prestige stat as hero — Trust Volume if present, else last
  const heroIdx = (() => {
    const ti = stats.findIndex((s) => /trust\s*volume/i.test(s.label))
    return ti >= 0 ? ti : stats.length - 1
  })()
  const hero = stats[heroIdx]
  const satellites = stats.filter((_, i) => i !== heroIdx).slice(0, 4)

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <section className="sr-card">
      <div className="sr-bar">
        <div className="sr-bar-left">
          <span className="sr-pulse" aria-hidden />
          <span><strong>Beta Season</strong> · Live</span>
        </div>
        <div className="sr-bar-right">
          <span>Season Snapshot</span>
          <span className="sr-bar-sep" aria-hidden />
          <span>{today}</span>
        </div>
      </div>

      <div className="sr-body">
        {/* Hero stat */}
        <div className="sr-hero">
          <div>
            <div className="sr-hero-label">{hero.label}</div>
            <HeroNumber value={hero.value} />
          </div>
          <div className="sr-hero-foot">
            <span>Aggregated on-chain · season total</span>
            <span className="sr-hero-tag">Featured</span>
          </div>
        </div>

        {/* Satellites */}
        <div className="sr-grid">
          {satellites.map((stat, i) => (
            <div key={i} className="sr-cell">
              <span className="sr-cell-label">{stat.label}</span>
              <CellNumber value={stat.value} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
