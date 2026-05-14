import { useEffect, useRef } from 'react'
import { gsap } from '../lib/animation/gsap'

/**
 * Section entry animation — "blueprint draw-in".
 *
 * Sequence on first reach (top 85% of viewport):
 *   1. The 4 corner brackets stroke-draw simultaneously (0.5s)
 *   2. Border-top scaleX 0 → 1 from left (0.6s, overlapping)
 *   3. Meta strip fade + slight x-shift (0.4s, overlapping)
 *   4. Body content fades up (0.6s)
 *
 * Looks like a technical drawing assembling itself.
 */
export function useSectionEnter<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return

    const corners = root.querySelectorAll<SVGPathElement>('[data-corner-path]')
    const rule = root.querySelector<HTMLElement>('[data-section-rule]')
    const metaL = root.querySelector<HTMLElement>('[data-meta-l]')
    const metaR = root.querySelector<HTMLElement>('[data-meta-r]')
    const body = root.querySelector<HTMLElement>('[data-section-body]')

    corners.forEach((p) => {
      const len = p.getTotalLength()
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
    })
    if (rule) gsap.set(rule, { scaleX: 0, transformOrigin: 'left center' })
    if (metaL) gsap.set(metaL, { opacity: 0, x: -8 })
    if (metaR) gsap.set(metaR, { opacity: 0, x: 8 })
    if (body) gsap.set(body, { opacity: 0, y: 14 })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    })

    tl.to(
      corners,
      { strokeDashoffset: 0, duration: 0.55, ease: 'power2.out' },
      0,
    )
    if (rule)
      tl.to(rule, { scaleX: 1, duration: 0.65, ease: 'power3.out' }, 0.05)
    if (metaL)
      tl.to(metaL, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, 0.2)
    if (metaR)
      tl.to(metaR, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, 0.2)
    if (body)
      tl.to(body, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.35)

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [])

  return ref
}
