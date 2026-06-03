import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import './styles/scroll-to-top.css'

interface ScrollToTopButtonProps {
  /** Scroll distance (px) past which the button fades in. */
  threshold?: number
}

/**
 * ScrollToTopButton — floating "back to top" affordance for long,
 * infinite-scrolling pages (the explore verb/topic drill views). Fixed
 * to the bottom-right of the viewport; fades in once the window is
 * scrolled past `threshold` and scrolls back to the top on click.
 */
export default function ScrollToTopButton({
  threshold = 400,
}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      className={`scroll-top-btn${visible ? ' is-visible' : ''}`}
      onClick={toTop}
      aria-label="Back to top"
      title="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}
