/**
 * useCartReminder
 *
 * Registers a beforeunload handler when cart has items.
 * Chrome will show native "Leave site?" dialog before closing.
 */

import { useEffect } from "react"
import { useCart } from "~/hooks"

export function useCartReminder() {
  const { count } = useCart()

  useEffect(() => {
    if (count <= 0) return

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [count])
}
