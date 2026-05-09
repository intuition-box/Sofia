import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from '../lib/animation/gsap'
import styles from './HexDeck.module.css'

type SlideBg = 'peach' | 'dark'

interface HexDeckProps {
  children: ReactNode
  /** Background variant for each slide, in source order. The deck
   *  uses this to retint the hex accent so it stays readable
   *  regardless of the active slide's surface. Defaults to 'peach'
   *  for any unspecified slot. */
  bgs?: SlideBg[]
  /** Viewport-heights of scroll budget per slide. Default 1. */
  vhPerSlide?: number
  /** Smoothing on the master scroll timeline. */
  scrub?: number | boolean
}

/**
 * HexDeck — horizontal scroll deck with a signature hex element.
 *
 * Behavior:
 *   - Pins itself for `(N - 1) * vhPerSlide * 100vh` of scroll.
 *   - Slides are arranged in a horizontal flex row, each 100vw wide.
 *   - The track translates `x: 0 → -((N - 1) * 100vw)` as the user
 *     scrolls — so vertical wheel input becomes horizontal motion.
 *   - A hex shape sits as a fixed accent over the deck, pulsing /
 *     rotating with the master progress so it reads as the deck's
 *     "anchor" while sections slide past.
 *
 * Layout invariant:
 *   - The container is `position: relative; height: 100vh` so the
 *     sticky inner wrapper can pin to the viewport while the
 *     pinSpacer (added by ScrollTrigger) handles the document flow.
 */
export function HexDeck({
  children,
  bgs,
  vhPerSlide = 1,
  /* Lenis already smooths the wheel; a tight scrub keeps the
     horizontal motion responsive without double-buffering. */
  scrub = 0.2,
}: HexDeckProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const hexRef = useRef<HTMLDivElement>(null)

  const slides = (Array.isArray(children) ? children : [children]).filter(
    Boolean,
  )
  const N = slides.length

  useEffect(() => {
    const container = containerRef.current
    const track = trackRef.current
    const hex = hexRef.current
    if (!container || !track) return

    const ctx = gsap.context(() => {
      const distance = () => (N - 1) * window.innerWidth
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: () =>
            `+=${(N - 1) * vhPerSlide * window.innerHeight}`,
          pin: true,
          pinSpacing: true,
          scrub,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: ({ progress }) => {
            /* Active slide = floor(progress * (N - 1) + 0.5) so the
               re-tint snaps at the midpoint of each transition. */
            const idx = Math.min(
              N - 1,
              Math.max(0, Math.round(progress * (N - 1))),
            )
            const variant = bgs?.[idx] ?? 'peach'
            if (hex) {
              hex.dataset.bg = variant
            }
          },
        },
      })

      /* Drive the horizontal translation linearly. The slot for
         each slide is `1 / (N - 1)` of total progress. */
      tl.to(
        track,
        {
          x: () => -distance(),
          ease: 'none',
        },
        0,
      )

      /* Hex accent — a slow continuous rotation over the whole deck
         plus a punch-scale at each slide boundary so it reads as the
         transition marker. The boundary punches are layered so the
         user feels each section "click into place". */
      if (hex) {
        tl.to(
          hex,
          { rotate: 240, ease: 'none' },
          0,
        )
        for (let i = 1; i < N; i++) {
          const slot = (i - 1) / (N - 1)
          tl.to(
            hex,
            {
              scale: 1.18,
              duration: 0.04,
              ease: 'power2.out',
            },
            slot - 0.02,
          )
          tl.to(
            hex,
            {
              scale: 1,
              duration: 0.06,
              ease: 'power2.out',
            },
            slot + 0.02,
          )
        }
      }
    }, container)

    return () => ctx.revert()
  }, [N, vhPerSlide, scrub])

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.viewport}>
        <div
          ref={trackRef}
          className={styles.track}
          style={{ width: `${N * 100}vw` }}
        >
          {slides.map((child, i) => (
            <div key={i} className={styles.slide}>
              {child}
            </div>
          ))}
        </div>
        <div
          ref={hexRef}
          className={styles.hex}
          data-bg={bgs?.[0] ?? 'peach'}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
