import { useEffect, useRef, type ReactNode } from 'react'
import { useLenis } from 'lenis/react'
import { gsap, ScrollTrigger } from '../lib/animation/gsap'
import { SharedPlateA } from './SharedPlateA'
import styles from './HexDeck.module.css'

type SlideBg = 'peach' | 'dark'

interface HexDeckProps {
  children: ReactNode
  /** Background variant for each slide, in source order. The deck
   *  uses this to retint the hex accent so it stays readable
   *  regardless of the active slide's surface. Defaults to 'peach'
   *  for any unspecified slot. */
  bgs?: SlideBg[]
  /** Per-state transition duration in seconds. Default 0.55. */
  transitionDuration?: number
}

/**
 * HexDeck — horizontal slide deck driven by a discrete state machine.
 *
 * Architecture:
 *   - ScrollTrigger pins the container for one viewport of vertical
 *     budget. The pin is purely a lifecycle hook (onEnter/onLeave) —
 *     there's no scrub.
 *   - During the pin, wheel / touch events are captured and translated
 *     into discrete state advances (0..N-1). Each advance plays a GSAP
 *     tween that moves the horizontal track, the shared Plate A, and
 *     the hex accent to the target state.
 *   - At the boundary (state 0 / wheel up, state N-1 / wheel down) the
 *     handler programmatically advances the document scroll past the
 *     pin via `lenis.scrollTo`, releasing the pin and letting the rest
 *     of the page (FAQ, CTA, Footer) flow normally under Lenis.
 *
 * Why this model: the previous scrub-based timeline allowed the user
 * to rest between two states, leaving half-cropped sections. Discrete
 * states make this impossible by construction.
 */
export function HexDeck({
  children,
  bgs,
  transitionDuration = 0.55,
}: HexDeckProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const hexRef = useRef<HTMLDivElement>(null)
  const plateRef = useRef<HTMLDivElement>(null)

  /* Live state — refs rather than React state because the wheel
     handlers fire many times per second and we never want to
     re-render the whole tree. */
  const stateRef = useRef(0)
  const animatingRef = useRef(false)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const stRef = useRef<ScrollTrigger | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  /* Wheel accumulator — many trackpad events fire per gesture; we
     sum their deltaY and only advance a state when the accumulated
     delta crosses WHEEL_THRESHOLD. The accumulator resets after the
     advance and after a pause longer than WHEEL_RESET_MS. */
  const wheelAccumRef = useRef(0)
  const wheelLastTimeRef = useRef(0)

  const lenis = useLenis()
  const lenisRef = useRef(lenis)
  lenisRef.current = lenis

  const slides = (Array.isArray(children) ? children : [children]).filter(
    Boolean,
  )
  const N = slides.length

  useEffect(() => {
    const container = containerRef.current
    const track = trackRef.current
    const hex = hexRef.current
    const plate = plateRef.current
    if (!container || !track) return

    /* Timeline spans 0..1 progress. The horizontal motion fits inside
       the first `horizontalRatio` of the timeline — same shape as the
       previous scrub implementation so the existing offset math holds. */
    const horizontalRatio = (N - 1) / N
    const slot = horizontalRatio / (N - 1) // length of one transition

    /** Target timeline time (in seconds) for a given discrete state.
     *
     *  Track tween spans `0 → horizontalRatio` in timeline time, with
     *  linear ease, animating `track.x` from 0 to `-(N-1) * vw`. So
     *  for slide `s` to be centred on the viewport we want
     *  `track.x = -s * vw`, which is at fraction `s/(N-1)` of the
     *  tween, i.e. timeline time `s/(N-1) * horizontalRatio = s/N`.
     *
     *  We return absolute timeline seconds, NOT `tl.duration() *
     *  progress` — the empty rest tween at the tail doesn't actually
     *  extend the timeline duration (GSAP skips tweens on `{}`),
     *  so multiplying by `tl.duration()` produced a slight undershoot
     *  that left every slide visibly to the right of where it should
     *  be (≈18% of one viewport on N=6). */
    const stateToTime = (s: number) => (s / (N - 1)) * horizontalRatio

    const ctx = gsap.context(() => {
      /* Paused master timeline — animations identical to the scrub
         version, but driven by `tweenTo` instead of scroll progress. */
      const tl = gsap.timeline({ paused: true })

      /* Track translation expressed as a PERCENTAGE of the track's
         own width, NOT in pixels via `window.innerWidth`. Reason:
         CSS `100vw` (used for `.slide` and `.track`) includes the
         vertical scrollbar, while `window.innerWidth` excludes it.
         A pixel-based translation leaves each slide off by the
         scrollbar width (≈8-16px), accumulating across states. The
         xPercent value `-100 * (N-1)/N` moves the track by exactly
         `(N-1) * 100vw` regardless of scrollbar presence. */
      tl.to(
        track,
        {
          xPercent: -100 * ((N - 1) / N),
          ease: 'none',
          duration: horizontalRatio,
        },
        0,
      )
      tl.to({}, { duration: 1 - horizontalRatio }, horizontalRatio)

      if (hex) {
        tl.to(
          hex,
          { rotate: 240, ease: 'none', duration: horizontalRatio },
          0,
        )
        for (let i = 1; i < N; i++) {
          const boundary = ((i - 1) / (N - 1)) * horizontalRatio
          tl.to(
            hex,
            { scale: 1.18, duration: 0.04, ease: 'power2.out' },
            boundary - 0.02,
          )
          tl.to(
            hex,
            { scale: 1, duration: 0.06, ease: 'power2.out' },
            boundary + 0.02,
          )
        }
      }

      if (plate) {
        /* Slide 0 → 1: plate translates from +47.5vw (right column of
           Hero) to x=0 (left column of ValueProps, resting CSS pos). */
        tl.fromTo(
          plate,
          { x: () => window.innerWidth * 0.475 },
          { x: 0, ease: 'none', duration: slot },
          0,
        )
        /* Slides 2+: plate fades out — it belongs to the Hero ↔ Why
           Sofia transition only. */
        tl.to(
          plate,
          { opacity: 0, ease: 'power2.out', duration: slot * 0.5 },
          slot,
        )
      }

      tlRef.current = tl
      tl.progress(0)

      /* Pin the container for one viewport's worth of vertical scroll.
         The end is intentionally short — it's just the pin lifecycle
         budget. The actual deck progression happens via wheel events
         captured during the pin, not via scroll position. */
      stRef.current = ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: '+=100vh',
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onEnter: () => {
          stateRef.current = 0
          tl.progress(0)
          syncHexBg()
          /* Lenis's own wheel listener buffers scroll target even
             with our preventDefault (it reads wheel passively). We
             stop it for the duration of the pin so the document's
             vertical scroll cannot drift past the pin end while the
             user advances states. */
          lenisRef.current?.stop()
          attach()
        },
        onEnterBack: () => {
          stateRef.current = N - 1
          tl.progress(horizontalRatio)
          syncHexBg()
          lenisRef.current?.stop()
          attach()
        },
        onLeave: () => {
          detach()
          lenisRef.current?.start()
        },
        onLeaveBack: () => {
          detach()
          lenisRef.current?.start()
        },
      })
    }, container)

    /* ── Event plumbing ──────────────────────────────────────── */

    function attach() {
      /* Reset the accumulator on every pin entry so a stale partial
         delta from a prior visit can't trigger an immediate advance. */
      wheelAccumRef.current = 0
      wheelLastTimeRef.current = 0
      window.addEventListener('wheel', onWheel, { passive: false })
      window.addEventListener('touchstart', onTouchStart, { passive: true })
      window.addEventListener('touchend', onTouchEnd, { passive: false })
      window.addEventListener('keydown', onKey, { passive: false })
    }
    function detach() {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKey)
    }

    /* Wheel/trackpad tuning. THRESHOLD: how much accumulated deltaY
       it takes to count as one advance. A standard mouse wheel notch
       is ~100-120, so 80 fires immediately on the first notch. A
       trackpad burst of ~10px events accumulates over ~8 events. */
    const WHEEL_THRESHOLD = 80
    /* If no wheel event arrives within this window, reset the
       accumulator so a fresh gesture starts from zero. */
    const WHEEL_RESET_MS = 220

    function onWheel(e: WheelEvent) {
      /* Always prevent the default browser scroll while pinned —
         Lenis is stopped, but some browsers (Safari) still try to
         scroll the body without preventDefault. */
      e.preventDefault()

      if (animatingRef.current) return

      const now = performance.now()
      if (now - wheelLastTimeRef.current > WHEEL_RESET_MS) {
        wheelAccumRef.current = 0
      }
      wheelLastTimeRef.current = now
      wheelAccumRef.current += e.deltaY

      if (Math.abs(wheelAccumRef.current) < WHEEL_THRESHOLD) return

      const intent = Math.sign(wheelAccumRef.current) as 1 | -1
      wheelAccumRef.current = 0
      handleIntent(intent, e)
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 0) return
      touchStartYRef.current = e.touches[0].clientY
    }
    function onTouchEnd(e: TouchEvent) {
      const start = touchStartYRef.current
      touchStartYRef.current = null
      if (start == null || e.changedTouches.length === 0) return
      const dy = start - e.changedTouches[0].clientY
      if (Math.abs(dy) < 30) return
      const intent = (dy > 0 ? 1 : -1) as 1 | -1
      handleIntent(intent, e)
    }

    function onKey(e: KeyboardEvent) {
      let intent: 1 | -1 | 0 = 0
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ')
        intent = 1
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') intent = -1
      if (intent === 0) return
      handleIntent(intent, e)
    }

    function handleIntent(intent: 1 | -1, e?: Event) {
      /* During an active transition every input is swallowed so the
         user can't queue advances mid-tween. The lock is released by
         the tween's onComplete. */
      if (animatingRef.current) {
        e?.preventDefault?.()
        return
      }
      const s = stateRef.current
      if (intent === 1) {
        if (s < N - 1) {
          e?.preventDefault?.()
          stateRef.current = s + 1
          animateTo(stateRef.current)
        } else {
          releaseForward()
        }
      } else {
        if (s > 0) {
          e?.preventDefault?.()
          stateRef.current = s - 1
          animateTo(stateRef.current)
        } else {
          releaseBackward()
        }
      }
    }

    function animateTo(targetState: number) {
      const tl = tlRef.current
      if (!tl) return
      animatingRef.current = true
      /* Reset the wheel accumulator so each post-transition gesture
         starts fresh — otherwise a stale partial delta could combine
         with the next wheel to trigger a too-early advance. */
      wheelAccumRef.current = 0
      wheelLastTimeRef.current = 0
      syncHexBg()
      tl.tweenTo(stateToTime(targetState), {
        duration: transitionDuration,
        ease: 'power2.inOut',
        onComplete: () => {
          animatingRef.current = false
          wheelAccumRef.current = 0
          wheelLastTimeRef.current = 0
        },
      })
    }

    function syncHexBg() {
      if (!hex) return
      const variant = bgs?.[stateRef.current] ?? 'peach'
      hex.dataset.bg = variant
    }

    function releaseForward() {
      const st = stRef.current
      if (!st) return
      const target = st.end + 1
      const l = lenisRef.current
      /* Lenis was stopped on pin enter — restart it so it can drive
         the scroll past the pin end. The subsequent onLeave will
         no-op the start() (idempotent). */
      if (l) {
        l.start()
        l.scrollTo(target, { duration: 0, immediate: true })
      } else {
        window.scrollTo({ top: target, behavior: 'auto' })
      }
    }
    function releaseBackward() {
      const st = stRef.current
      if (!st) return
      const target = Math.max(0, st.start - 1)
      const l = lenisRef.current
      if (l) {
        l.start()
        l.scrollTo(target, { duration: 0, immediate: true })
      } else {
        window.scrollTo({ top: target, behavior: 'auto' })
      }
    }

    return () => {
      detach()
      ctx.revert()
    }
  }, [N, transitionDuration, bgs])

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
        <div ref={plateRef} className={styles.sharedPlate}>
          <SharedPlateA />
        </div>
      </div>
    </div>
  )
}
