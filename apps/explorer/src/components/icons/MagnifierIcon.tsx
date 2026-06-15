import type { SVGProps } from 'react'

/**
 * MagnifierIcon — iconmonstr "magnifier-1"
 * (https://iconmonstr.com/magnifier-1-svg/).
 *
 * The app-wide search-bar glyph and a drop-in replacement for lucide's
 * <Search/>: it fills with `currentColor` and forwards `className` / `style`
 * / aria props, so existing sizing utilities (`h-4 w-4`, custom `*-search-icon`
 * classes) and absolute positioning keep working unchanged. The `1em` default
 * size only applies when a caller passes no sizing of its own.
 */
export default function MagnifierIcon({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M24 21.172l-5.66-5.66C19.387 13.932 20 12.038 20 10c0-5.523-4.477-10-10-10S0 4.477 0 10s4.477 10 10 10c2.038 0 3.932-.613 5.512-1.66l5.66 5.66L24 21.172zM4 10c0-3.31 2.69-6 6-6s6 2.69 6 6-2.69 6-6 6-6-2.69-6-6z" />
    </svg>
  )
}
