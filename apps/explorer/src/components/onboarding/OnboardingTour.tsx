/**
 * OnboardingTour — first-run guided product tour for the explorer.
 *
 * Coachmarks (spotlight + bubble) laid OVER the real explorer UI, ported and
 * simplified from the extension's OnboardingTour. Purely additive: the
 * spotlight is pointer-events:none so the user clicks the real control
 * underneath, and steps auto-advance by observing already-exposed app state
 * (route via react-router, DOM appearance/click) — no app component is
 * modified beyond a few `data-tour` anchors.
 *
 * Lifecycle is driven by the parent via `active` (see useExplorerOnboarding):
 * welcome veil → coachmark steps → done veil → onClose (parent persists the
 * "seen" flag). Steps are declared in tourSteps.tsx.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'

import { TOUR_STEPS } from './tourSteps'
import '../styles/onboarding-tour.css'

type Phase = 'welcome' | 'tour' | 'done'

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

interface BubblePos {
  left: number
  top: number
  width: number
  arrow: 'top' | 'bottom'
  arrowLeft: number
}

interface OnboardingTourProps {
  /** When true, the tour runs (welcome → steps → done). */
  active: boolean
  /** Called when the tour ends (finished or skipped). Parent persists the flag. */
  onClose: () => void
}

/** Padding (px) between the highlighted element and the spotlight cutout.
 *  Kept small so the hole doesn't bleed onto adjacent controls (e.g. the
 *  nav item above a highlighted one). */
const PAD = 3

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(v, hi))

const IconArrow = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

const IconCheck = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

function Confetti() {
  // Static layout (no Math.random reseed across renders): vary by index.
  const bits = Array.from({ length: 34 }).map((_, i) => ({
    left: (i * 37) % 100,
    delay: (i % 5) * 0.12,
    dur: 1.6 + ((i * 7) % 14) / 10,
    c: i % 5,
  }))
  return (
    <div className="tour-confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <i
          key={i}
          className={`c${b.c}`}
          style={{
            left: `${b.left}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function OnboardingTour({
  active,
  onClose,
}: OnboardingTourProps) {
  const location = useLocation()

  const [phase, setPhase] = useState<Phase>('welcome')
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [pos, setPos] = useState<BubblePos | null>(null)
  const [targetMissing, setTargetMissing] = useState(false)
  const [skipped, setSkipped] = useState(false)

  const bubbleRef = useRef<HTMLDivElement | null>(null)
  const lockRef = useRef(false)
  const stepRef = useRef(0)
  stepRef.current = stepIndex

  const step = TOUR_STEPS[stepIndex]
  const isCentered = step && step.target === null

  // Reset to the welcome veil whenever the tour (re)activates.
  useEffect(() => {
    if (active) {
      setPhase('welcome')
      setStepIndex(0)
      setSkipped(false)
    }
  }, [active])

  const finish = useCallback((didSkip: boolean) => {
    setSkipped(didSkip)
    setPhase('done')
  }, [])

  const advance = useCallback(() => {
    if (lockRef.current) return
    lockRef.current = true
    const next = stepRef.current + 1
    if (next >= TOUR_STEPS.length) {
      lockRef.current = false
      finish(false)
      return
    }
    setStepIndex(next)
    setRect(null)
    setTargetMissing(false)
  }, [finish])

  // Unlock advance when the step changes.
  useEffect(() => {
    lockRef.current = false
  }, [stepIndex])

  // ── measure the spotlight target ───────────────────────────
  useEffect(() => {
    if (phase !== 'tour' || !step || step.target === null) return
    const selector = step.target
    const measure = () => {
      const el = document.querySelector(selector)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) {
        setRect(null)
        return
      }
      setRect({ x: r.x, y: r.y, w: r.width, h: r.height })
    }
    const t = setTimeout(measure, 60)
    const iv = setInterval(measure, 300)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      clearTimeout(t)
      clearInterval(iv)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [phase, stepIndex, step])

  // Resilience: surface a "skip this step" affordance if the target can't be
  // found after a grace period so the tour never hard-locks.
  useEffect(() => {
    if (phase !== 'tour' || isCentered) return
    setTargetMissing(false)
    if (rect) return
    const t = setTimeout(() => setTargetMissing(true), 2400)
    return () => clearTimeout(t)
  }, [phase, stepIndex, rect, isCentered])

  // ── place the bubble ───────────────────────────────────────
  useLayoutEffect(() => {
    if (phase !== 'tour') return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = Math.min(340, vw - 24)
    const bh = bubbleRef.current?.offsetHeight ?? 180
    const gap = 16

    if (!rect) {
      // Centered informational step, or a target we're still hunting for.
      if (isCentered || targetMissing) {
        setPos({
          left: (vw - width) / 2,
          top: clamp((vh - bh) / 2, 8, vh - bh - 8),
          width,
          arrow: 'top',
          arrowLeft: -100,
        })
      }
      return
    }

    const below = vh - (rect.y + rect.h) > bh + gap + 8
    const top = clamp(
      below ? rect.y + rect.h + gap : rect.y - bh - gap,
      8,
      vh - bh - 8,
    )
    const left = clamp(rect.x + rect.w / 2 - width / 2, 8, vw - width - 8)
    const arrowLeft = clamp(rect.x + rect.w / 2 - left, 16, width - 16)
    setPos({ left, top, width, arrow: below ? 'top' : 'bottom', arrowLeft })
  }, [rect, phase, stepIndex, targetMissing, isCentered])

  // ── completion detection (observes real app state) ─────────
  useEffect(() => {
    if (phase !== 'tour' || !step) return
    const c = step.complete

    if (c.kind === 'manual') return

    if (c.kind === 'route') {
      if (c.match(location.pathname)) advance()
      return
    }

    if (c.kind === 'domClick') {
      const handler = (e: Event) => {
        const t = e.target as Element | null
        if (t && t.closest(c.selector)) advance()
      }
      document.addEventListener('click', handler, true)
      return () => document.removeEventListener('click', handler, true)
    }

    if (c.kind === 'domAppear') {
      const check = () => {
        if (document.querySelector(c.selector)) {
          advance()
          return true
        }
        return false
      }
      if (check()) return
      const mo = new MutationObserver(() => {
        if (check()) mo.disconnect()
      })
      mo.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
      })
      return () => mo.disconnect()
    }
  }, [phase, stepIndex, location.pathname, step, advance])

  if (!active) return null

  return createPortal(
    <>
      {/* ── Tour (spotlight + bubble) ── */}
      {phase === 'tour' && (
        <>
          {/* Dim veil + hole. The scrim is a huge box-shadow on the spotlight
              box (renders reliably — backdrop-filter cutouts don't composite
              here), leaving the highlighted rect as a sharp, clickable hole.
              Without a target, a full-screen veil. */}
          {rect ? (
            <div
              className="tour-spot"
              style={{
                left: rect.x - PAD,
                top: rect.y - PAD,
                width: rect.w + PAD * 2,
                height: rect.h + PAD * 2,
              }}
            />
          ) : (
            <div className="tour-mask" />
          )}

          <button className="tour-skip" onClick={() => finish(true)}>
            Skip tour
          </button>

          {pos && (rect || targetMissing || isCentered) && (
            <div
              className="tour-bubble"
              ref={bubbleRef}
              style={{ left: pos.left, top: pos.top, width: pos.width }}
            >
              {rect && (
                <div
                  className={`tour-bubble-arrow ${
                    pos.arrow === 'top' ? 'is-top' : 'is-bottom'
                  }`}
                  style={{ left: pos.arrowLeft }}
                />
              )}
              <div className="tour-bubble-step">
                Step {stepIndex + 1} of {TOUR_STEPS.length}
              </div>
              <h3 className="tour-bubble-title">{step.title}</h3>
              <p
                className="tour-bubble-body"
                dangerouslySetInnerHTML={{ __html: step.body }}
              />
              <div className="tour-bubble-foot">
                <div className="tour-bubble-bar">
                  <i
                    style={{
                      width: `${((stepIndex + 1) / TOUR_STEPS.length) * 100}%`,
                    }}
                  />
                </div>
                {step.complete.kind === 'manual' ? (
                  <button
                    className="tour-bubble-skipstep"
                    onClick={() => advance()}
                  >
                    {step.cta}
                  </button>
                ) : targetMissing && !rect ? (
                  <button
                    className="tour-bubble-skipstep"
                    onClick={() => advance()}
                  >
                    Skip this step
                  </button>
                ) : (
                  <span className="tour-bubble-cta">
                    {step.cta} <IconArrow />
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Welcome veil ── */}
      {phase === 'welcome' && (
        <div className="tour-veil">
          <div className="tour-vcard">
            <div className="tour-vlogo">S</div>
            <h1 className="tour-vtitle">Welcome to Sofia</h1>
            <p className="tour-vtext">
              Sofia turns what you trust into a portable, public reputation.
              Take a 1-minute tour to see how <b>Explore</b>, <b>Circles</b> and
              your <b>reputation</b> fit together.
            </p>
            <div className="tour-vbtns">
              <button
                className="tour-vbtn-primary"
                onClick={() => {
                  setStepIndex(0)
                  setPhase('tour')
                }}
              >
                Start the tour
              </button>
              <button className="tour-vbtn-ghost" onClick={() => finish(true)}>
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Done veil ── */}
      {phase === 'done' && (
        <>
          {!skipped && <Confetti />}
          <div className="tour-veil">
            <div className="tour-vcard">
              <div className="tour-vlogo">{skipped ? 'S' : <IconCheck />}</div>
              <h1 className="tour-vtitle">
                {skipped ? "You're all set" : "That's the loop"}
              </h1>
              <p className="tour-vtext">
                {skipped ? (
                  <>
                    Jump in whenever — explore what the community certifies,
                    build your Circle, and your reputation starts growing.
                  </>
                ) : (
                  <>
                    Explore the feed, open a Circle, compose a perspective, and
                    watch your <b>reputation</b> take shape — backers and all.
                    It's yours, and it's verifiable.
                  </>
                )}
              </p>
              <div className="tour-vbtns">
                <button className="tour-vbtn-primary" onClick={onClose}>
                  Start exploring
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>,
    document.body,
  )
}
