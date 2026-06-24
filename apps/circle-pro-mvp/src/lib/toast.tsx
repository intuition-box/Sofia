/**
 * Tiny singleton toast. `toast("…")` fires from anywhere; <Toast/> renders it.
 * Ported from the design's event-based toast, kept event-based so any module
 * can call `toast()` without prop-drilling a dispatcher.
 */
import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'

const EVENT = 'pro-toast'

export function toast(message: string): void {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: message }))
}

export function Toast() {
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const onToast = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail)
      clearTimeout(timer)
      timer = setTimeout(() => setMsg(null), 2600)
    }
    window.addEventListener(EVENT, onToast)
    return () => {
      window.removeEventListener(EVENT, onToast)
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className={msg ? 'toast show' : 'toast'}>
      <Icon name="check" /> {msg}
    </div>
  )
}
