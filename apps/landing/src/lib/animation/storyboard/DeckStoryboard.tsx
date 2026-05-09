import { useEffect, useRef, type ReactNode } from 'react'
import { Storyboard } from './Storyboard'
import type { Stage } from './Stage'

interface SlideDef {
  /** Stage instance — built by parent, owns its own animation. */
  stage: Stage
  /** Render function returning the slide content. */
  render: () => ReactNode
}

interface DeckStoryboardProps {
  slides: SlideDef[]
  /** Viewport-heights of scroll budget per stage weight. Default 1. */
  vhPerStage?: number
  /** Smoothing applied to scroll-driven master timeline. */
  scrub?: number | boolean
}

/**
 * DeckStoryboard — a single pinned wrapper that hosts every slide as
 * an absolute-positioned overlay and drives them through one master
 * timeline.
 *
 * Each child slide fills the viewport (`position: absolute; inset: 0`)
 * and the master timeline fades the active slide in / out at its slot
 * boundaries. Stages may add their own internal tweens within their
 * slot via `Stage.build(ctx)`.
 *
 * Layout invariants:
 *   - Container has `position: relative` and a fixed height equal to
 *     the master pin distance reserved by ScrollTrigger.
 *   - Slides are stacked at `inset: 0` and only one is visually
 *     dominant at a time (autoAlpha gating).
 */
export function DeckStoryboard({
  slides,
  vhPerStage = 1,
  scrub = 0.6,
}: DeckStoryboardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (slideRefs.current.some((el) => !el)) return

    const sb = new Storyboard(container, { vhPerStage, scrub })
    slides.forEach((s, i) => {
      const el = slideRefs.current[i]
      if (el) sb.add(s.stage, el)
    })
    sb.init()

    return () => sb.destroy()
    // Slides identity is expected stable — registry rebuilds on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
      }}
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          ref={(el) => {
            slideRefs.current[i] = el
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            // visibility:hidden until the stage sets autoAlpha at its
            // slot start. Prevents stacked slides from peeking through.
            visibility: 'hidden',
            opacity: 0,
          }}
        >
          {slide.render()}
        </div>
      ))}
    </div>
  )
}
