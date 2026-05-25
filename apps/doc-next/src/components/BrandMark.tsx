import { useTheme } from '~/hooks/useTheme'

/**
 * Sofia brand mark — the real logo asset, themed. Replaces the
 * design mock's peach "S" square so every shell surface (navbar,
 * footer, drawer) carries the actual identity. The white SVG is
 * used on dark backgrounds; the black PNG on light.
 *
 * Both assets ship under /img/ in this app's public/ tree, copied
 * 1:1 from apps/blog's logo set so the docs and the blog read as
 * the same product at a glance.
 */
export function BrandMark({
  size = 32,
  className,
}: {
  size?: number
  className?: string
}) {
  const { theme } = useTheme()
  const src = theme === 'light' ? '/img/logo-black.png' : '/img/logoWhite.svg'
  return (
    <img
      src={src}
      alt="Sofia"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, display: 'block' }}
    />
  )
}
