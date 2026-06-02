import {
  Children,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ScrollTrigger } from '../lib/animation/gsap'
import type { SlideBg } from './types'
import styles from './SceneStack.module.css'

interface SceneStackProps {
  children: ReactNode
  /** Background variant per slide, in source order. */
  bgs?: SlideBg[]
  /** Optional reveal-state background per slide. When set on slide
   *  `i`, a second slab paints the reveal colour on top of the base
   *  slab as soon as that slide's sub-state goes ≥ 1 — same 60°
   *  diagonal wipe as a slide-to-slide transition.
   *
   *  Note: reveal backgrounds only apply in desktop snap mode. In
   *  mobile flow mode there's no sub-state — base and reveal zones
   *  stack vertically — so each slide paints a single bg via its
   *  base variant. */
  revealBgs?: (SlideBg | undefined)[]
  /** Per-slide sub-state count. `subStates[i] = n` means slide `i`
   *  has `n` reveal stages on top of its base layout. Children read
   *  their current sub-state via `useSceneSubState()`. */
  subStates?: number[]
  /** Per-slide string code used to build deep-link anchor IDs. With
   *  `slideCodes[i] = "S.01"` and a sub-state count of 1, two anchors
   *  are emitted: `#stage-s01` (base) and `#stage-s01-r1` (reveal). */
  slideCodes?: string[]
}

/** Context exposing the active slide index and sub-state to children
 *  so a slide can render progressively as the user sub-scrolls. */
const SceneStackCtx = createContext({
  slideIdx: 0,
  subState: 0,
  isActive: false,
})

export function useSceneSubState() {
  return useContext(SceneStackCtx)
}

const MOBILE_BREAKPOINT = '(max-width: 899px)'

/**
 * SceneStack — scroll-trigger slide stack with two-step transition.
 *
 * ── Desktop (>= 900px) — pinned scroll-snap deck.
 *
 * The deck reserves N × 100vh of vertical space, where N is the total
 * number of stages (sum of slides + sub-states). Each stage gets an
 * invisible anchor section inside the region so `/#stage-s06-r1` style
 * deep-links resolve natively. The `.stage` layer is `position: sticky`
 * and stays pinned while the user scrolls through the stack of
 * anchors.
 *
 * GSAP ScrollTrigger observes scroll progress through the region and
 * snaps to discrete 1/(N-1) increments. On each new stage, the derived
 * `(slideIdx, subState)` is committed to React state, which fires the
 * two-step CSS choreography (slab wipe → content slide).
 *
 * Lenis stays untouched — it drives smooth scroll globally, and
 * ScrollTrigger consumes its scroll events via the wiring in
 * `SmoothScroll.tsx`.
 *
 * ── Mobile (<= 899px) — vertical flow with per-slide entrance.
 *
 * The pin/snap mechanic doesn't translate to touch (kinetic scroll
 * mismatches break the snap timing). On mobile we drop scroll-jacking
 * entirely: each slide flows vertically at its natural height, base
 * and reveal layers stack instead of crossfading (see App.module.css
 * mobile overrides), and an IntersectionObserver flips `isActive` on
 * each slide as it scrolls into view — so the intra-slide entrance
 * animations (wipe / slide-up / scale) still play in sequence.
 *
 * ── Styling convention.
 *
 * Layout, transforms, transitions, and per-stage offsets are all
 * driven by data-attributes resolved in `SceneStack.module.css`. No
 * inline styles anywhere — index values map to CSS custom-property
 * bindings (`data-slide-i='2'` → `--slide-i: 2`) and the transform
 * math runs in pure CSS.
 */
export function SceneStack({
  children,
  bgs,
  revealBgs,
  subStates = [],
  slideCodes = [],
}: SceneStackProps) {
  const slides = Children.toArray(children)
  const N = slides.length

  /* Flat stage descriptor: one entry per (slide, sub-state) pair.
     Driving the deck off this array means callers only think in slides
     while the snap engine only thinks in stages. */
  const stages = useMemo(() => {
    const out: { slideIdx: number; sub: number; anchorId: string }[] = []
    for (let i = 0; i < N; i++) {
      const subMax = subStates[i] ?? 0
      const rawCode = slideCodes[i] ?? String(i)
      const slug = rawCode.toLowerCase().replace(/[^a-z0-9]/g, '')
      for (let s = 0; s <= subMax; s++) {
        out.push({
          slideIdx: i,
          sub: s,
          anchorId: s === 0 ? `stage-${slug}` : `stage-${slug}-r${s}`,
        })
      }
    }
    return out
  }, [N, subStates, slideCodes])

  const totalStages = stages.length

  const [slideIdx, setSlideIdx] = useState(0)
  /* Per-slide sub-state. A slide leaving the stage keeps its last
     sub-state so the slide-out animation doesn't flash back to its
     base layout. */
  const [slideSubStates, setSlideSubStates] = useState<Record<number, number>>(
    {},
  )
  /* Mobile mode — per-slide active flag, driven by IntersectionObserver.
     Slides stay active once they've entered the viewport so leaving and
     re-entering doesn't replay the entrance. */
  const [activeMobileSlides, setActiveMobileSlides] = useState<Set<number>>(
    () => new Set(),
  )

  /* Layout mode tracked in JS so the context can return the right
     `isActive` for each slide and we can opt out of the desktop-only
     transforms. SSR-safe: assume desktop until hydration. */
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(MOBILE_BREAKPOINT).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia(MOBILE_BREAKPOINT)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const regionRef = useRef<HTMLDivElement>(null)

  /* Desktop — pinned snap deck. Only active in desktop mode. */
  useEffect(() => {
    if (isMobile) return
    if (!regionRef.current || totalStages < 2) return

    let lastStageIdx = -1

    function applyStage(stageIdx: number) {
      if (stageIdx === lastStageIdx) return
      lastStageIdx = stageIdx
      /* Replay every stage up to and including the active one so each
         slide's sub-state accumulates to its highest seen value. When
         the user scrolls back, slides drop their reveal naturally as
         their anchor stage falls behind the active one. */
      const accumulated: Record<number, number> = {}
      for (let i = 0; i <= stageIdx; i++) {
        const { slideIdx: si, sub } = stages[i]
        accumulated[si] = sub
      }
      setSlideIdx(stages[stageIdx].slideIdx)
      setSlideSubStates(accumulated)
    }

    const st = ScrollTrigger.create({
      trigger: regionRef.current,
      start: 'top top',
      end: 'bottom bottom',
      snap: {
        snapTo: 1 / (totalStages - 1),
        duration: { min: 0.2, max: 0.5 },
        ease: 'power2.inOut',
      },
      onUpdate(self) {
        applyStage(Math.round(self.progress * (totalStages - 1)))
      },
      onRefresh(self) {
        applyStage(Math.round(self.progress * (totalStages - 1)))
      },
    })

    return () => {
      st.kill()
    }
  }, [isMobile, stages, totalStages])

  /* Mobile — pre-reveal every sub-state so base + reveal zones can
     coexist stacked (no crossfade), then observe each slide for the
     entrance animation cue. */
  useEffect(() => {
    if (!isMobile || !regionRef.current) return

    const allRevealed: Record<number, number> = {}
    for (let i = 0; i < N; i++) {
      allRevealed[i] = subStates[i] ?? 0
    }
    setSlideSubStates(allRevealed)

    const slideEls =
      regionRef.current.querySelectorAll<HTMLElement>('[data-slide-idx]')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const idx = Number(entry.target.getAttribute('data-slide-idx'))
          setActiveMobileSlides((prev) => {
            if (prev.has(idx)) return prev
            const next = new Set(prev)
            next.add(idx)
            return next
          })
        }
      },
      /* 15 % visible is enough to fire the entrance — feels responsive
         without firing too early on long slides with content far down. */
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    )
    slideEls.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [isMobile, N, subStates])

  return (
    <div
      ref={regionRef}
      className={styles.region}
      data-mode={isMobile ? 'mobile' : 'desktop'}
      data-stages={totalStages}
    >
      {/* Anchor markers — desktop deep-link targets. Hidden on mobile
          where each slide is its own scrollable block (use slide id
          instead if you need a deep-link there). */}
      {!isMobile &&
        stages.map((stage, i) => (
          <div
            key={stage.anchorId}
            id={stage.anchorId}
            className={styles.snapMarker}
            data-stage-i={i}
            data-stage-slide={stage.slideIdx}
            data-stage-sub={stage.sub}
          />
        ))}

      <div className={styles.stage} data-active-slide={slideIdx}>
        {/* Background slabs — desktop only. The horizontal slide of the
            slabs is the visual signature of the snap deck; on mobile
            each slide paints its own bg via .placeholder color rules
            (see App.module.css). */}
        {!isMobile && (
          <div className={styles.bgLayer}>
            {slides.map((_, i) => (
              <div
                key={`base-${i}`}
                className={styles.bgBlock}
                data-bg={bgs?.[i] ?? 'peach'}
                data-bg-i={i}
              />
            ))}
            {/* Reveal slabs — parked off-screen right; slide to 0 when
                the owning slide is active and its sub-state ≥ 1. */}
            {slides.map((_, i) => {
              const revealBg = revealBgs?.[i]
              if (!revealBg) return null
              const sub = slideSubStates[i] ?? 0
              const showing = i === slideIdx && sub >= 1
              return (
                <div
                  key={`reveal-${i}`}
                  className={`${styles.bgBlock} ${styles.bgBlockReveal}`}
                  data-bg={revealBg}
                  data-showing={showing ? 'true' : 'false'}
                />
              )
            })}
          </div>
        )}

        {/* Content slides — translated vertically by the active-slide
            offset on desktop, statically stacked on mobile. The
            translate math runs in CSS via the --slide-i / --active-slide
            variables resolved from data-attributes.

            `data-slide-bg` only paints in mobile mode (see
            SceneStack.module.css mobile rules) and gets used by slides
            without a reveal layer. Slides WITH a reveal split their
            background per layer — each .zones paints its own colour
            (see App.module.css mobile rules) so HERO can stay peach
            while WHY SOFIA goes dark inside the same slide. */}
        {slides.map((child, i) => {
          const isActive = isMobile ? activeMobileSlides.has(i) : i === slideIdx
          return (
            <div
              key={i}
              className={styles.slide}
              data-slide-idx={i}
              data-slide-i={i}
              data-slide-bg={bgs?.[i] ?? 'peach'}
            >
              <SceneStackCtx.Provider
                value={{
                  slideIdx: i,
                  subState: slideSubStates[i] ?? 0,
                  isActive,
                }}
              >
                {child}
              </SceneStackCtx.Provider>
            </div>
          )
        })}
      </div>
    </div>
  )
}
