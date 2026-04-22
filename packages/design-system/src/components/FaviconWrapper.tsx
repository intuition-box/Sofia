import type { ReactNode } from 'react'

export interface FaviconWrapperProps {
  /** Image URL (favicon served by the host site, Google's `s2/favicons`, …). */
  src?: string
  /** Accessible label — pass the hostname or site name. */
  alt?: string
  /** Pixel size of the wrapper. Defaults to 32. */
  size?: number
  /** Extra classes to compose onto `.favicon`. */
  className?: string
  /** Inline SVG / fallback node when `src` is omitted. */
  children?: ReactNode
}

/**
 * `<FaviconWrapper>` — white-background box that keeps dark favicons
 * readable on any theme.
 *
 * Requires the stylesheet to be imported at least once in the consuming app:
 *   `@import "@0xsofia/design-system/styles/favicon.css";`
 *
 * @example
 *   <FaviconWrapper src={`https://www.google.com/s2/favicons?domain=${host}`} alt={host} />
 */
export function FaviconWrapper({
  src,
  alt = '',
  size = 32,
  className,
  children,
}: FaviconWrapperProps) {
  const style = { ['--fav-size' as string]: `${size}px` }
  const cls = className ? `favicon ${className}` : 'favicon'
  return (
    <span className={cls} style={style}>
      {src ? (
        <img
          src={src}
          alt={alt}
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        children
      )}
    </span>
  )
}
