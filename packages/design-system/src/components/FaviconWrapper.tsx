import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export interface FaviconWrapperProps {
  /** Image URL (favicon served by the host site, Google's `s2/favicons`, …). */
  src?: string
  /** Tried when `src` is missing or fails to load (e.g. an on-chain image). */
  fallbackSrc?: string
  /** Accessible label — pass the hostname or site name. Also seeds the letter
   *  fallback shown when no image resolves. */
  alt?: string
  /** Pixel size of the wrapper. Defaults to 32. */
  size?: number
  /** Extra classes to compose onto `.favicon`. */
  className?: string
  /** Custom fallback node when no image source loads. When absent, the first
   *  letter of `alt` is shown. */
  children?: ReactNode
}

/**
 * `<FaviconWrapper>` — white-background box that keeps dark favicons readable
 * on any theme. Tries `src`, then `fallbackSrc`, then degrades to `children`
 * or a letter tile seeded from `alt`, so the box is never empty.
 *
 * Requires the stylesheet to be imported at least once in the consuming app:
 *   `@import "@0xsofia/design-system/styles/favicon.css";`
 *
 * @example
 *   <FaviconWrapper src={`/favicons/${slug}.png`} fallbackSrc={onChainImg} alt={name} />
 */
export function FaviconWrapper({
  src,
  fallbackSrc,
  alt = '',
  size = 32,
  className,
  children,
}: FaviconWrapperProps) {
  // Ordered image candidates; walk to the next one when the current fails.
  const candidates = [src, fallbackSrc].filter(Boolean) as string[]
  const [idx, setIdx] = useState(0)
  // List rows reuse instances across data — restart the chain when the
  // sources change so a new (valid) favicon isn't hidden by a stale error.
  useEffect(() => {
    setIdx(0)
  }, [src, fallbackSrc])

  const current = candidates[idx]
  const style = { ['--fav-size' as string]: `${size}px` }
  const cls = className ? `favicon ${className}` : 'favicon'
  const fallback =
    children ??
    (alt ? (
      <span className="favicon-fallback" aria-hidden="true">
        {alt.slice(0, 1)}
      </span>
    ) : null)

  return (
    <span className={cls} style={style}>
      {current ? (
        <img
          key={current}
          src={current}
          alt={alt}
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        fallback
      )}
    </span>
  )
}
