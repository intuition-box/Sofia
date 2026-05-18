import {
  Children,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
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
   *  diagonal wipe as a slide-to-slide transition. */
  revealBgs?: (SlideBg | undefined)[]
  /** Duration (ms) of step 1: background slab + angled border wipe. */
  step1Ms?: number
  /** Duration (ms) of step 2: content slides over the new background. */
  step2Ms?: number
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
const SceneStackCtx = createContext({ slideIdx: 0, subState: 0, isActive: false })

export function useSceneSubState() {
  return useContext(SceneStackCtx)
}

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'

/**
 * SceneStack — scroll-trigger slide stack with two-step transition.
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
 */
export function SceneStack({
  children,
  bgs,
  revealBgs,
  step1Ms = 220,
  step2Ms = 220,
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

  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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
  }, [stages, totalStages])

  return (
    <div
      ref={regionRef}
      className={styles.region}
      style={
        {
          ['--stages' as string]: totalStages,
          /* Per-stage scroll travel. Tweak here to make the snap feel
             tighter or longer without touching CSS. */
          ['--stage-gap' as string]: '60vh',
        } as CSSProperties
      }>
      {/* Anchor markers — one zero-height anchor per stage, positioned
          absolutely at the snap point so deep-links resolve natively.
          They're out of flow so the sticky `.stage` stays at the top
          of the region. */}
      {stages.map((stage, i) => (
        <div
          key={stage.anchorId}
          id={stage.anchorId}
          className={styles.snapMarker}
          style={{ top: `calc(${i} * var(--stage-gap))` }}
          data-stage-slide={stage.slideIdx}
          data-stage-sub={stage.sub}
        />
      ))}

      <div className={styles.stage}>
        {/* Background slabs — step 1. */}
        <div className={styles.bgLayer}>
          {slides.map((_, i) => (
            <div
              key={`base-${i}`}
              className={styles.bgBlock}
              data-bg={bgs?.[i] ?? 'peach'}
              style={{
                transform: `translate3d(${(i - slideIdx) * 100}%, 0, 0) skewX(-30deg)`,
                transition: `transform ${step1Ms}ms ${EASE}`,
              }}
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
                className={styles.bgBlock}
                data-bg={revealBg}
                style={{
                  transform: `translate3d(${showing ? 0 : 100}%, 0, 0) skewX(-30deg)`,
                  transition: `transform ${step1Ms}ms ${EASE}`,
                }}
              />
            )
          })}
        </div>

        {/* Content slides — step 2, delayed by step1Ms. */}
        {slides.map((child, i) => (
          <div
            key={i}
            className={styles.slide}
            style={{
              transform: `translate3d(0, ${(i - slideIdx) * 100}%, 0)`,
              transition: `transform ${step2Ms}ms ${EASE} ${step1Ms}ms`,
            }}>
            <SceneStackCtx.Provider
              value={{
                slideIdx: i,
                subState: slideSubStates[i] ?? 0,
                isActive: i === slideIdx,
              }}>
              {child}
            </SceneStackCtx.Provider>
          </div>
        ))}
      </div>
    </div>
  )
}
