/**
 * CircleUpsellToast — minimal, self-contained toast for the Free-tier
 * circle view's "Pro feature" upsell affordances (locked Decisions KPI,
 * Pro hint pills, Upgrade-to-Pro button, membership confirmation).
 *
 * The explorer app has `sonner` installed but no `<Toaster>` mounted and
 * no active `toast()` callers, and the existing trust flow communicates
 * through the cart drawer — not toasts. Rather than introduce a global
 * toast provider (out of scope for this phase), the Free circle view
 * renders this lightweight singleton itself and fires it via the
 * `circleUpsellToast()` helper below. Auto-dismisses after ~2.6s.
 *
 * TODO: when a global toast system lands, swap `circleUpsellToast()` for
 * the shared `toast()` and delete this component.
 */
import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

const TOAST_EVENT = 'sofia-circle-upsell-toast'
const TOAST_TTL_MS = 2600

/** Fire a transient upsell toast from anywhere in the circle view. */
export function circleUpsellToast(message: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<string>(TOAST_EVENT, { detail: message }),
  )
}

export default function CircleUpsellToast() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      setMessage(detail)
      clearTimeout(timer)
      timer = setTimeout(() => setMessage(null), TOAST_TTL_MS)
    }
    window.addEventListener(TOAST_EVENT, onToast)
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast)
      clearTimeout(timer)
    }
  }, [])

  return (
    <div
      className={`cf-toast${message ? ' is-shown' : ''}`}
      role="status"
      aria-live="polite"
    >
      {message ? (
        <>
          <Sparkles className="cf-toast-icon" aria-hidden="true" />
          <span>{message}</span>
        </>
      ) : null}
    </div>
  )
}
