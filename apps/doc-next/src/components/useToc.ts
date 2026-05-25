import { type RefObject, useEffect, useRef, useState } from 'react'

export interface Heading {
  id: string
  text: string
}

interface TocState {
  /** Attach to the rendered `.prose` wrapper. */
  ref: RefObject<HTMLDivElement>
  headings: Heading[]
  activeId: string
}

/**
 * useToc — builds the table of contents from the *rendered* MDX
 * DOM (migrated docs are compiled MDX, not a static array, so the
 * TOC can't be derived statically). rehype-slug puts an id on every
 * h2; an IntersectionObserver tracks the section in view.
 *
 * `key` should change per doc (the route id) so it re-scans on
 * navigation. Ported 1:1 from apps/blog/src/components/useToc.ts.
 */
export function useToc(key: string | undefined): TocState {
  const ref = useRef<HTMLDivElement>(null)
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const root = ref.current
    if (!root) {
      setHeadings([])
      return
    }

    const hs: Heading[] = Array.from(
      root.querySelectorAll<HTMLHeadingElement>('h2[id]'),
    )
      .map((h) => ({ id: h.id, text: (h.textContent ?? '').trim() }))
      .filter((h) => h.id && h.text)

    setHeadings(hs)
    if (hs.length === 0) return

    setActiveId(hs[0].id)
    const observer = new IntersectionObserver(
      (entries) => {
        const inView = entries.find((e) => e.isIntersecting)
        if (inView) setActiveId(inView.target.id)
      },
      { rootMargin: '-96px 0px -68% 0px' },
    )
    hs.forEach((h) => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [key])

  return { ref, headings, activeId }
}
