import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

/**
 * `<Toaster>` + `toast()` — a tiny event-driven toast singleton ported from
 * the newexplorerDAO handoff (circle/components.jsx:105-122). Mount `<Toaster/>`
 * once near the app root; call `toast("…")` from anywhere to flash a 2.6s
 * confirmation. No context/provider needed — it rides a window CustomEvent.
 *
 * Requires `import "@0xsofia/design-system/styles/toast.css"`.
 */
const TOAST_EVENT = 'ds-toast'
const TOAST_MS = 2600

export function toast(message: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: message }))
}

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    function onToast(e: Event) {
      setMsg((e as CustomEvent<string>).detail)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setMsg(null), TOAST_MS)
    }
    window.addEventListener(TOAST_EVENT, onToast)
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast)
      clearTimeout(timer.current)
    }
  }, [])

  return (
    <div
      className={msg ? 'ds-toast ds-toast--show' : 'ds-toast'}
      role="status"
      aria-live="polite"
    >
      <Icon name="check" /> {msg}
    </div>
  )
}
