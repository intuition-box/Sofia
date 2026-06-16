/**
 * OnboardingTour
 *
 * Guided product tour for first-run users: coachmarks (spotlight + bubble)
 * laid OVER the real extension UI. It is purely additive — a visual overlay
 * portaled to document.body that:
 *   - spotlights real components (resolved by selector at runtime),
 *   - is pointer-events:none on the spotlight, so the user clicks the real
 *     control underneath,
 *   - auto-advances by observing already-exposed app state (cart store,
 *     TxEventBus, route, window events, DOM) — no app component is modified.
 *
 * Lifecycle: triggered when the router lands on `onboarding-tutorial` (the
 * old static carousel route). It redirects to the live `mark` page and runs
 * the welcome → tour → done state machine on top of it.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Storage } from "@plasmohq/storage"

import { cartService, txEventBus } from "~/lib/services"
import { useRouter } from "../layout/RouterProvider"
import { TOUR_STEPS } from "./tourSteps"
import "../styles/OnboardingTour.css"

const storage = new Storage()

type Phase = "idle" | "welcome" | "tour" | "done"

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
  arrow: "top" | "bottom"
  arrowLeft: number
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(v, hi))

// ── inline icons (kept local; no extra deps) ──
const IconSpark = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
  </svg>
)
const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

function Confetti() {
  // Static layout (no Date.now/random reseed across renders): vary by index.
  const bits = Array.from({ length: 34 }).map((_, i) => ({
    left: (i * 37) % 100,
    delay: (i % 5) * 0.12,
    dur: 1.6 + ((i * 7) % 14) / 10,
    c: i % 5
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
            animationDuration: `${b.dur}s`
          }}
        />
      ))}
    </div>
  )
}

const OnboardingTour = () => {
  const { currentPage, navigateTo, setOnboardingBookmarks } = useRouter()

  const [phase, setPhase] = useState<Phase>("idle")
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [pos, setPos] = useState<BubblePos | null>(null)
  const [targetMissing, setTargetMissing] = useState(false)
  const [holding, setHolding] = useState(false)
  const [skipped, setSkipped] = useState(false)
  const [trackingConsent, setTrackingConsent] = useState(true)

  const bubbleRef = useRef<HTMLDivElement | null>(null)
  const lockRef = useRef(false)
  const stepRef = useRef(0)
  stepRef.current = stepIndex

  const step = TOUR_STEPS[stepIndex]

  // ── completion → advance ───────────────────────────────────
  const finish = useCallback((didSkip: boolean) => {
    setSkipped(didSkip)
    setPhase("done")
    try {
      chrome.storage.sync.set({ onboarding_tour_done: true })
    } catch {
      // not in extension context
    }
  }, [])

  // Persist the tracking-consent choice (Chrome Web Store: explicit opt-in
  // before any browsing data collection). Mirrors OnboardingImportPage.
  const persistConsent = useCallback(async (enabled: boolean) => {
    try {
      await storage.set("tracking_enabled", enabled)
      await storage.set("tracking_consent_seen", true)
    } catch {
      // not in extension context
    }
  }, [])

  const advance = useCallback(() => {
    if (lockRef.current) return
    lockRef.current = true
    const next = stepRef.current + 1
    if (next >= TOUR_STEPS.length) {
      // No stepIndex change follows, so the unlock effect won't run — release
      // the lock here so a later re-entry isn't permanently no-op'd.
      lockRef.current = false
      finish(false)
      return
    }
    setStepIndex(next)
    setRect(null)
    setTargetMissing(false)
  }, [finish])

  // Unlock advance + clear stale rect when the step changes.
  useEffect(() => {
    lockRef.current = false
  }, [stepIndex])

  // ── trigger: the old tutorial route is never rendered — it always launches
  //     the guided tour (so Settings → Tutorial replays it). We redirect to the
  //     live 'mark' page and run the overlay on top. ──
  useEffect(() => {
    if (currentPage !== "onboarding-tutorial") return
    navigateTo("mark")
    if (phase === "idle") setPhase("welcome")
  }, [currentPage, phase, navigateTo])

  // ── per-step entry side effect (seed search, drive a view…) ──
  useEffect(() => {
    if (phase !== "tour" || !step?.onEnter) return
    let cleanup: void | (() => void)
    const t = setTimeout(() => {
      cleanup = step.onEnter?.()
    }, 220)
    return () => {
      clearTimeout(t)
      if (typeof cleanup === "function") cleanup()
    }
  }, [phase, stepIndex, step])

  // ── measure the spotlight target ───────────────────────────
  useEffect(() => {
    if (phase !== "tour" || !step) return
    const resolve = (): Element | null =>
      typeof step.target === "function"
        ? step.target()
        : document.querySelector(step.target)

    const measure = () => {
      // Step aside while a transient app modal is up (e.g. reward modal).
      if (step.holdWhile && document.querySelector(step.holdWhile)) {
        setHolding(true)
        setRect(null)
        return
      }
      setHolding(false)
      const el = resolve()
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
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    return () => {
      clearTimeout(t)
      clearInterval(iv)
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [phase, stepIndex, step])

  // Resilience: if the target can't be found, surface a skip-step affordance
  // after a grace period so the tour never hard-locks.
  useEffect(() => {
    if (phase !== "tour") return
    setTargetMissing(false)
    if (rect || holding) return
    const t = setTimeout(() => setTargetMissing(true), 2400)
    return () => clearTimeout(t)
  }, [phase, stepIndex, rect, holding])

  // ── place the bubble (above/below + clamped to the panel) ──
  useLayoutEffect(() => {
    if (phase !== "tour") return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = Math.min(320, vw - 24)
    const bh = bubbleRef.current?.offsetHeight ?? 180
    const gap = 16

    if (!rect) {
      if (targetMissing) {
        setPos({
          left: (vw - width) / 2,
          top: clamp((vh - bh) / 2, 8, vh - bh - 8),
          width,
          arrow: "top",
          arrowLeft: -100
        })
      }
      return
    }

    const below = vh - (rect.y + rect.h) > bh + gap + 8
    const top = clamp(
      below ? rect.y + rect.h + gap : rect.y - bh - gap,
      8,
      vh - bh - 8
    )
    const left = clamp(rect.x + rect.w / 2 - width / 2, 8, vw - width - 8)
    const arrowLeft = clamp(rect.x + rect.w / 2 - left, 16, width - 16)
    setPos({ left, top, width, arrow: below ? "top" : "bottom", arrowLeft })
  }, [rect, phase, stepIndex, targetMissing])

  // ── completion detection (observes real app state) ─────────
  useEffect(() => {
    if (phase !== "tour" || !step) return
    const c = step.complete

    if (c.kind === "route") {
      if (currentPage === c.page) advance()
      return
    }

    if (c.kind === "cartAdd") {
      const base = cartService.getSnapshot().count
      return cartService.subscribe(() => {
        if (cartService.getSnapshot().count > base) advance()
      })
    }

    if (c.kind === "cartVoteAdd") {
      const voteCount = () =>
        cartService.getSnapshot().items.filter((i) => !!i.voteAction).length
      const base = voteCount()
      return cartService.subscribe(() => {
        if (voteCount() > base) advance()
      })
    }

    if (c.kind === "winEvent") {
      const handler = () => advance()
      window.addEventListener(c.event, handler)
      return () => window.removeEventListener(c.event, handler)
    }

    if (c.kind === "domGone") {
      // Complete when the element disappears — but only after it was present
      // (avoids firing before a just-opened modal has mounted).
      let seen = false
      const check = () => {
        const present = !!document.querySelector(c.selector)
        if (present) {
          seen = true
          return false
        }
        if (seen) {
          advance()
          return true
        }
        return false
      }
      check()
      const mo = new MutationObserver(() => {
        if (check()) mo.disconnect()
      })
      mo.observe(document.body, { subtree: true, childList: true })
      return () => mo.disconnect()
    }

    if (c.kind === "domClick") {
      const handler = (e: Event) => {
        const t = e.target as Element | null
        if (t && t.closest(c.selector)) advance()
      }
      document.addEventListener("click", handler, true)
      return () => document.removeEventListener("click", handler, true)
    }

    if (c.kind === "tx") {
      return txEventBus.on(c.event as never, () => advance())
    }

    if (c.kind === "domAppear") {
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
        attributes: true
      })
      return () => mo.disconnect()
    }

    if (c.kind === "domText") {
      const check = () => {
        const els = Array.from(document.querySelectorAll(c.selector))
        if (els.some((el) => el.textContent?.includes(c.text))) {
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
        characterData: true
      })
      return () => mo.disconnect()
    }
  }, [phase, stepIndex, currentPage, step, advance])

  if (phase === "idle") return null

  // Stacking: "page" steps sit BELOW the app's floating layer (dropdowns
  // ~9990, drawers ~9999, modals ~10000) so portaled UI the user opens stays
  // crisp and never dimmed by the scrim. "modal" steps sit ABOVE the open
  // modal so we can spotlight a control inside it.
  const isModalLayer = step?.layer === "modal"
  const zSpot = isModalLayer ? 10050 : 9985
  const zBubble = isModalLayer ? 10052 : 9987

  return createPortal(
    <>
      {/* ── Tour (spotlight + bubble) ── */}
      {phase === "tour" && (
        <>
          {rect && (
            <div
              className="tour-spot"
              style={{
                left: rect.x - 7,
                top: rect.y - 7,
                width: rect.w + 14,
                height: rect.h + 14,
                zIndex: zSpot
              }}
            />
          )}

          <button
            className="tour-skip"
            style={{ zIndex: zBubble }}
            onClick={() => finish(true)}>
            Skip tour
          </button>

          {pos && !holding && (rect || targetMissing) && (
            <div
              className="tour-bubble"
              ref={bubbleRef}
              style={{
                left: pos.left,
                top: pos.top,
                width: pos.width,
                zIndex: zBubble
              }}>
              {rect && (
                <div
                  className={`tour-bubble-arrow ${
                    pos.arrow === "top" ? "is-top" : "is-bottom"
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
              {step.learn && (
                <div className="tour-bubble-learn">
                  <IconSpark />
                  <span>{step.learn}</span>
                </div>
              )}
              <div className="tour-bubble-foot">
                <div className="tour-bubble-bar">
                  <i
                    style={{
                      width: `${((stepIndex + 1) / TOUR_STEPS.length) * 100}%`
                    }}
                  />
                </div>
                {targetMissing && !rect ? (
                  <button
                    className="tour-bubble-skipstep"
                    onClick={() => advance()}>
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
      {phase === "welcome" && (
        <div className="tour-veil">
          <div className="tour-vcard">
            <div className="tour-vlogo">S</div>
            <h1 className="tour-vtitle">Your web, finally yours</h1>
            <p className="tour-vtext">
              Everything you read and love is captured by platforms.{" "}
              <b>Sofia gives it back.</b> Mark the pages that matter and build a
              reputation that's portable, public, and owned by you.
            </p>
            <div className="tour-vstats">
              <div className="tour-vstat">
                <b>2 min</b>
                <span>guided</span>
              </div>
              <div className="tour-vstat">
                <b>1</b>
                <span>real signal</span>
              </div>
              <div className="tour-vstat">
                <b>0.01</b>
                <span>to start</span>
              </div>
            </div>
            <label className="tour-consent">
              <input
                type="checkbox"
                checked={trackingConsent}
                onChange={(e) => setTrackingConsent(e.target.checked)}
              />
              <span className="tour-consent-text">
                <b>Enable browsing tracking</b> — Sofia records the URLs and
                titles of pages you visit, locally on your device, to suggest
                pages to Mark and group them into Echoes. Sensitive pages
                (banking, auth, checkout) are always excluded. You can turn this
                off anytime in Settings.
              </span>
            </label>
            <div className="tour-vbtns">
              <button
                className="tour-vbtn-primary"
                onClick={() => {
                  persistConsent(trackingConsent)
                  // The active tab is usually the auth callback
                  // (sofia.intuition.box/auth?…&autoLogin=true) — not a real
                  // page to Mark. Open a fresh sofia.intuition.box tab so the
                  // first Mark lands on a clean page. Skip if already on a
                  // (non-auth) sofia page.
                  try {
                    chrome.tabs?.query?.(
                      { active: true, currentWindow: true },
                      (tabs) => {
                        const url = tabs?.[0]?.url ?? ""
                        const onCleanSofia =
                          url.includes("sofia.intuition.box") &&
                          !url.includes("/auth")
                        if (!onCleanSofia) {
                          chrome.tabs.create({
                            url: "https://sofia.intuition.box",
                            active: true
                          })
                        }
                      }
                    )
                  } catch {
                    /* no tabs access */
                  }
                  setStepIndex(0)
                  setPhase("tour")
                }}>
                Start Tutorial
              </button>
              <button
                className="tour-vbtn-ghost"
                onClick={() => {
                  persistConsent(trackingConsent)
                  finish(true)
                }}>
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Done veil ── */}
      {phase === "done" && (
        <>
          {!skipped && <Confetti />}
          <div className="tour-veil">
            <div className="tour-vcard">
              <div className="tour-vlogo">{skipped ? "S" : <IconCheck />}</div>
              <h1 className="tour-vtitle">
                {skipped ? "You're all set" : "You made your first Mark"}
              </h1>
              <p className="tour-vtext">
                {skipped ? (
                  <>
                    Jump in whenever — mark a page, build your Circle, and your
                    reputation starts growing.
                  </>
                ) : (
                  <>
                    You marked a page, gave it weight, started your{" "}
                    <b>Echoes</b>, grew your <b>Circle</b>, and weighed in with a{" "}
                    <b>vote</b>. That's the whole loop — and it's all verifiable
                    on the Explorer.
                  </>
                )}
              </p>
              <div className="tour-vbtns">
                <button
                  className="tour-vbtn-primary"
                  onClick={() => setPhase("idle")}>
                  Start marking
                </button>
                <button
                  className="tour-vbtn-ghost"
                  onClick={() => {
                    // Mirror Settings → Import Data: fetch bookmarks, then go
                    // to the bookmark selection page.
                    setPhase("idle")
                    try {
                      chrome.runtime.sendMessage(
                        { type: "FETCH_BOOKMARKS" },
                        (response) => {
                          if (response?.success && response.bookmarks?.length) {
                            setOnboardingBookmarks(response.bookmarks)
                            navigateTo("onboarding-select")
                          } else {
                            navigateTo("onboarding-import")
                          }
                        }
                      )
                    } catch {
                      navigateTo("onboarding-import")
                    }
                  }}>
                  Import your bookmarks
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>,
    document.body
  )
}

export default OnboardingTour
