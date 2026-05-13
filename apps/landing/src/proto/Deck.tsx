import {
  Children,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLenis } from 'lenis/react'
import type { SlideBg } from './types'
import styles from './Deck.module.css'

interface DeckProps {
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
  /** When true the deck never releases scroll past its boundaries —
   *  the first/last slide become sticky end-stops instead. Use when
   *  the page has no content outside the deck (fully horizontal). */
  pinned?: boolean
  /** Per-slide sub-state count. `subStates[i] = n` means slide `i`
   *  reacts to `n` extra triggers before forwarding the next one to
   *  the parent slide-machine. Children read their current sub-state
   *  via `useDeckSubState()`. */
  subStates?: number[]
}

/** Context exposing the active slide index and sub-state to children
 *  so a slide can render progressively as the user sub-scrolls. The
 *  sub-state value is only meaningful for the *active* slide; all
 *  other slides receive 0. `isActive` lets children gate entry
 *  animations to the moment they actually come on-stage. */
const DeckCtx = createContext({ slideIdx: 0, subState: 0, isActive: false })

export function useDeckSubState() {
  return useContext(DeckCtx)
}

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'

/**
 * Deck — discrete-state slide deck with two-step transition.
 *
 * Each trigger plays a 2-step choreography:
 *   1. The background "slabs" (one per slide) translate horizontally
 *      with a 60° parallelogram clip-path. The boundary between two
 *      adjacent slabs is an angled line that matches a hex side. A
 *      thin black border is rendered on that angled edge so the wipe
 *      is visible even when neighbouring slabs share a colour.
 *   2. Once the slabs have settled, the slide content (Hero / etc.)
 *      translates in. The content sits on top of the slabs.
 *
 * Lenis is paused while the deck is active so wheel events don't get
 * double-handled.
 */
export function Deck({
  children,
  bgs,
  revealBgs,
  step1Ms = 220,
  step2Ms = 220,
  pinned = false,
  subStates = [],
}: DeckProps) {
  /* Flatten nested children (e.g. `{array}` + literal JSX siblings)
     so the deck sees one slide per child regardless of how the caller
     composed them. */
  const slides = Children.toArray(children)
  const N = slides.length
  const totalMs = step1Ms + step2Ms

  const [state, setState] = useState(0)
  const stateRef = useRef(0)
  stateRef.current = state
  /* Per-slide sub-state. We store one entry per slide so a slide
     leaving the stage keeps its last sub-state (e.g. S.06 stays in
     COMMUNITY reveal while it slides out, instead of flashing back
     to its CONTRIBUTOR base for a beat). Default is 0 if missing. */
  const [slideSubStates, setSlideSubStates] = useState<
    Record<number, number>
  >({})
  const subState = slideSubStates[state] ?? 0
  const subStateRef = useRef(0)
  subStateRef.current = subState
  function setSlideSubState(slideIdx: number, value: number) {
    setSlideSubStates((prev) => ({ ...prev, [slideIdx]: value }))
  }

  const regionRef = useRef<HTMLDivElement>(null)
  const animatingRef = useRef(false)
  const activeRef = useRef(false)

  const lenis = useLenis()
  const lenisRef = useRef(lenis)
  lenisRef.current = lenis

  /* No Lenis-stop on hydration needed — wheel interception lives in
     our capture-phase listener and stopImmediatePropagation prevents
     Lenis from reading the deltaY. */

  useEffect(() => {
    const region = regionRef.current
    if (!region) return

    window.scrollTo(0, 0)

    let lastScrollY = window.scrollY

    function computeRange() {
      const r = region!.getBoundingClientRect()
      const top = window.scrollY + r.top
      return { top, bottom: top + r.height }
    }

    function advance(delta: 1 | -1) {
      if (animatingRef.current) return
      const currentSlide = stateRef.current
      const currentSubMax = subStates[currentSlide] ?? 0
      const currentSub = subStateRef.current

      /* Sub-state consumes the trigger BEFORE the slide machine sees
         it, so a slide with reveals locks the deck on itself until the
         user has cycled through them. */
      if (delta === 1 && currentSub < currentSubMax) {
        animatingRef.current = true
        setSlideSubState(currentSlide, currentSub + 1)
        window.setTimeout(unlock, totalMs)
        return
      }
      if (delta === -1 && currentSub > 0) {
        animatingRef.current = true
        setSlideSubState(currentSlide, currentSub - 1)
        window.setTimeout(unlock, totalMs)
        return
      }

      /* Sub-state already maxed (forward) or at 0 (backward) — fall
         through to the slide-level transition. */
      const next = currentSlide + delta
      if (next < 0) {
        if (pinned) return
        releaseBackward()
        return
      }
      if (next > N - 1) {
        if (pinned) return
        releaseForward()
        return
      }
      animatingRef.current = true
      setState(next)
      /* Set the destination sub-state: 0 entering forward, max
         entering backward. The leaving slide keeps its own sub-state
         (stored separately in slideSubStates) so it doesn't flash
         back to its base layout while sliding off. */
      const nextSubMax = subStates[next] ?? 0
      setSlideSubState(next, delta === 1 ? 0 : nextSubMax)
      window.setTimeout(unlock, totalMs)
    }

    function unlock() {
      animatingRef.current = false
      wheelAccum = 0
      wheelLast = 0
      if (pendingIntent !== 0) {
        const queued = pendingIntent
        pendingIntent = 0
        advance(queued)
      }
    }

    /* Clear the active flag synchronously so wheel/touch handlers
       (always attached) become passthroughs on the very next frame.
       Belt-and-braces lenis.start() in case anything else stopped it. */
    function deactivate() {
      if (!activeRef.current) return
      activeRef.current = false
      lenisRef.current?.start()
    }

    function releaseForward() {
      deactivate()
      const { bottom } = computeRange()
      const target = bottom + 1
      /* Plain native scroll — Lenis listens to native scroll events
         and syncs its internal target on the next frame, so we don't
         leave Lenis with a stale targetScroll that fights the user's
         next wheel-up. */
      window.scrollTo(0, target)
      lastScrollY = target
    }
    function releaseBackward() {
      deactivate()
      const { top } = computeRange()
      const target = Math.max(0, top - 1)
      window.scrollTo(0, target)
      lastScrollY = target
    }

    const WHEEL_THRESHOLD = 40
    const WHEEL_RESET_MS = 180
    const SWIPE_PX = 30
    let wheelAccum = 0
    let wheelLast = 0
    let touchStartY: number | null = null
    /* Intent latched during the animation lock so a fast swipe queues
       one more advance instead of being dropped. */
    let pendingIntent: 1 | -1 | 0 = 0

    /* Handlers stay attached for the entire deck lifetime. They guard
       on `activeRef.current` and bail out (without preventDefault and
       without stopImmediatePropagation) when the deck is inactive, so
       Lenis's bubble-phase wheel handler runs normally and the user
       can scroll out of the deck region without any race against an
       in-flight detach. */
    function onWheel(e: WheelEvent) {
      if (!activeRef.current) return
      e.preventDefault()
      e.stopImmediatePropagation()
      const now = performance.now()
      if (now - wheelLast > WHEEL_RESET_MS) wheelAccum = 0
      wheelLast = now
      wheelAccum += e.deltaY
      if (Math.abs(wheelAccum) < WHEEL_THRESHOLD) return
      const intent = (Math.sign(wheelAccum) || 1) as 1 | -1
      wheelAccum = 0
      if (animatingRef.current) {
        /* Latch the most recent intent so we fire it the moment the
           current animation ends, instead of dropping it. */
        pendingIntent = intent
        return
      }
      advance(intent)
    }
    function onTouchStart(e: TouchEvent) {
      if (!activeRef.current) return
      if (e.touches.length === 0) return
      touchStartY = e.touches[0].clientY
    }
    function onTouchMove(e: TouchEvent) {
      if (!activeRef.current) return
      e.preventDefault()
      e.stopImmediatePropagation()
    }
    function onTouchEnd(e: TouchEvent) {
      if (!activeRef.current) return
      const start = touchStartY
      touchStartY = null
      if (start == null || e.changedTouches.length === 0) return
      const dy = start - e.changedTouches[0].clientY
      if (Math.abs(dy) < SWIPE_PX) return
      e.stopImmediatePropagation()
      if (animatingRef.current) {
        e.preventDefault()
        return
      }
      advance((dy > 0 ? 1 : -1) as 1 | -1)
    }
    function onKey(e: KeyboardEvent) {
      if (!activeRef.current) return
      let intent: 0 | 1 | -1 = 0
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ')
        intent = 1
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') intent = -1
      if (intent === 0) return
      e.preventDefault()
      e.stopImmediatePropagation()
      if (animatingRef.current) return
      advance(intent as 1 | -1)
    }

    window.addEventListener('wheel', onWheel, { passive: false, capture: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
    window.addEventListener('touchend', onTouchEnd, { passive: false, capture: true })
    window.addEventListener('keydown', onKey, { passive: false, capture: true })

    function detachAll() {
      window.removeEventListener('wheel', onWheel, { capture: true } as AddEventListenerOptions)
      window.removeEventListener('touchstart', onTouchStart, { capture: true } as AddEventListenerOptions)
      window.removeEventListener('touchmove', onTouchMove, { capture: true } as AddEventListenerOptions)
      window.removeEventListener('touchend', onTouchEnd, { capture: true } as AddEventListenerOptions)
      window.removeEventListener('keydown', onKey, { capture: true } as AddEventListenerOptions)
    }

    function evaluateActivity() {
      const { top, bottom } = computeRange()
      const y = window.scrollY
      const dir: 1 | -1 = y >= lastScrollY ? 1 : -1
      lastScrollY = y
      const shouldBeActive = y >= top && y < bottom
      if (shouldBeActive && !activeRef.current) {
        activeRef.current = true
        const entryState = dir === 1 ? 0 : N - 1
        setState(entryState)
        /* Snap Lenis's target to the current scroll so the in-flight
           glide that brought us into the deck stops here. No
           lenis.stop() — that would set `overflow: clip` on html via
           the `lenis-stopped` class. Wheel suppression is handled by
           the always-on capture listener + stopImmediatePropagation. */
        lenisRef.current?.scrollTo(y, { duration: 0, immediate: true })
      } else if (!shouldBeActive && activeRef.current) {
        deactivate()
      }
    }

    function onScroll() {
      evaluateActivity()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    evaluateActivity()

    return () => {
      window.removeEventListener('scroll', onScroll)
      detachAll()
      lenisRef.current?.start()
      activeRef.current = false
    }
  }, [N, totalMs, pinned])

  return (
    <div ref={regionRef} className={styles.region}>
      <div className={styles.stage}>
        {/* Background slabs — step 1. Each slab is wider than the
            stage by 2 × hex-shift and is skewed -30° so it becomes a
            real parallelogram with 60° angled left and right edges.
            Translate by 100% of the slab's own width per state, which
            equals stage + 2 × hex-shift — exactly one slab over per
            trigger. Adjacent slabs tile flush, the active slab covers
            the stage entirely, and the wipe between two slabs is a
            single 60° diagonal sweeping across the viewport. */}
        <div className={styles.bgLayer}>
          {slides.map((_, i) => (
            <div
              key={`base-${i}`}
              className={styles.bgBlock}
              data-bg={bgs?.[i] ?? 'peach'}
              style={{
                transform: `translate3d(${(i - state) * 100}%, 0, 0) skewX(-30deg)`,
                transition: `transform ${step1Ms}ms ${EASE}`,
              }}
            />
          ))}
          {/* Reveal slabs — one per slide that opts into a reveal bg.
              Parked off-screen right at translateX(100%); on the active
              slide whose subState ≥ 1 they slide to translateX(0),
              wiping the new colour in with the same 60° diagonal as a
              slide-to-slide transition. */}
          {slides.map((_, i) => {
            const revealBg = revealBgs?.[i]
            if (!revealBg) return null
            const showing = i === state && subState >= 1
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

        {/* Content slides — step 2. Slide content moves on the Y axis
            (forward → enters from bottom, backward → enters from top)
            so the choreography reads as: 1) angled background wipe,
            then 2) content drops/rises in. The transition is delayed
            by step1 so it kicks in once the background has settled. */}
        {slides.map((child, i) => (
          <div
            key={i}
            className={styles.slide}
            style={{
              transform: `translate3d(0, ${(i - state) * 100}%, 0)`,
              transition: `transform ${step2Ms}ms ${EASE} ${step1Ms}ms`,
            }}
          >
            {/* Each slide receives its OWN persisted sub-state so a
                slide leaving the stage keeps its reveal state through
                the slide-out animation (no flash back to its base
                layout). isActive still gates the entrance animations. */}
            <DeckCtx.Provider
              value={{
                slideIdx: i,
                subState: slideSubStates[i] ?? 0,
                isActive: i === state,
              }}
            >
              {child}
            </DeckCtx.Provider>
          </div>
        ))}

      </div>
    </div>
  )
}
