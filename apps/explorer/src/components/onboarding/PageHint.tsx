/**
 * PageHint — a small, non-invasive bottom-right card that explains a page the
 * first time an authenticated user opens it.
 *
 * This is the whole onboarding model: no welcome modal, no forced tour. The
 * user discovers the app freely; a hint just tells them where they are and what
 * the page's key concepts mean (the intention/verb pills, support/oppose votes,
 * the reputation score...). It shows once per page (localStorage flag) and is
 * dismissed with "Got it" or the close button.
 *
 * Mount one per page you want to explain (see App.tsx).
 */

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'

import '../styles/page-hint.css'

interface PageHintProps {
  /** Unique localStorage key so this hint shows exactly once. */
  storageKey: string
  /** Exact route the hint belongs to (e.g. "/explore"). Matched exactly on
   *  pathname so sub-routes are excluded (e.g. "/profile" shows on the user's
   *  own profile but not "/profile/:address"). Query params (?topic=) live in
   *  location.search, so drill views still match. Use this OR `whenVisible`. */
  path?: string
  /** CSS selector: show the hint when a matching element appears in the DOM
   *  (e.g. ".cd-aside.cd-open" when the cart drawer opens). For UI that isn't a
   *  page. Use this OR `path`. */
  whenVisible?: string
  /** Where to anchor the card. Default "bottom-right"; use "top-right" to sit
   *  above a right-side drawer (the cart), or "bottom-left" to clear it. */
  anchor?: 'bottom-right' | 'bottom-left' | 'top-right'
  /** When true, a backdrop blocks interaction with the page until the user
   *  clicks "Got it" — used for the cart so nobody signs before reading. */
  blocking?: boolean
  title: string
  /** Optional visual shown above the body (e.g. sample intention pills). */
  illustration?: ReactNode
  /** Body copy (may contain <b>). */
  children: ReactNode
}

function seen(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

const IconSpark = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />
  </svg>
)

export default function PageHint({
  storageKey,
  path,
  whenVisible,
  anchor = 'bottom-right',
  blocking = false,
  title,
  illustration,
  children,
}: PageHintProps) {
  const location = useLocation()
  const { authenticated } = usePrivy()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!authenticated) return
    if (seen(storageKey)) return

    // Route trigger. Exact match: sub-routes (e.g. /profile/:address,
    // /circles/:id) are excluded; query params (?topic=) live in search, so
    // drill views still match.
    if (path) {
      if (location.pathname !== path) return
      const t = setTimeout(() => setShow(true), 700)
      return () => clearTimeout(t)
    }

    // DOM-appearance trigger (e.g. the cart drawer opening).
    if (whenVisible) {
      let armed = false
      let t: ReturnType<typeof setTimeout> | undefined
      const check = () => {
        if (armed) return
        if (document.querySelector(whenVisible)) {
          armed = true
          t = setTimeout(() => setShow(true), 500)
        }
      }
      check()
      const mo = new MutationObserver(check)
      mo.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
      })
      return () => {
        mo.disconnect()
        if (t) clearTimeout(t)
      }
    }
  }, [authenticated, location.pathname, path, whenVisible, storageKey])

  const dismiss = () => {
    try {
      window.localStorage.setItem(storageKey, 'true')
    } catch {
      // ignore: private mode / storage full
    }
    setShow(false)
  }

  if (!show) return null

  return createPortal(
    <>
      {blocking && <div className="phint-backdrop" />}
      <div
        className={`phint phint--${anchor}`}
        role="dialog"
        aria-modal={blocking || undefined}
        aria-label={title}
      >
        <div className="phint-card">
          <button
            type="button"
            className="phint-close"
            onClick={dismiss}
            aria-label="Dismiss"
          >
            ✕
          </button>
          <div className="phint-head">
            <div className="phint-spark">
              <IconSpark />
            </div>
            <h3 className="phint-title">{title}</h3>
          </div>
          {illustration}
          <p className="phint-text">{children}</p>
          <button type="button" className="phint-btn" onClick={dismiss}>
            Got it
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}
