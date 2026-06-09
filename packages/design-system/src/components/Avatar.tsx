import type { CSSProperties } from 'react'

/**
 * `<Avatar>` — initials chip on a deterministic two-color gradient, ported
 * from the newexplorerDAO handoff (circle/components.jsx:36-50). Optionally
 * renders an image with the gradient as fallback background.
 *
 * Presentational: the caller supplies the `label` (a handle/name) and either
 * an explicit `gradient` pair or an index into the built-in palette. Initials
 * are derived from `label` unless `initials` is passed.
 *
 * Requires `import "@0xsofia/design-system/styles/avatar.css"`.
 */

/** Built-in gradient pairs (from data.jsx AV_GRADS). */
export const AVATAR_GRADIENTS: ReadonlyArray<readonly [string, string]> = [
  ['#22c55e', '#0ea5e9'],
  ['#8b5cf6', '#ec4899'],
  ['#f59e0b', '#ef4444'],
  ['#06b6d4', '#3b82f6'],
  ['#ec4899', '#8b5cf6'],
  ['#ff5722', '#f59e0b'],
  ['#3b82f6', '#22c55e'],
  ['#14b8a6', '#22c55e'],
  ['#a78bdb', '#5cc4d6'],
  ['#e4b95a', '#e0896a'],
  ['#5cc4d6', '#7bade0'],
  ['#d98cb3', '#a78bdb'],
  ['#7bade0', '#6dd4a0'],
  ['#ef4444', '#ff5722'],
  ['#06b6d4', '#8b5cf6'],
  ['#22c55e', '#f59e0b'],
  ['#ec4899', '#06b6d4'],
]

/** Derive a 1-2 char uppercase label (strips `.eth` / `0x` prefixes). */
export function avatarInitials(label: string): string {
  const base = label.replace(/\.eth$/, '').replace(/^0x/, '')
  const letters = base.replace(/[^a-zA-Z0-9]/g, '')
  return (letters.slice(0, 2) || '??').toUpperCase()
}

/** Stable gradient index from a label (when no explicit gradient is given). */
function hashIndex(label: string): number {
  let h = 0
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) % 100000
  return h
}

function gradientCss(gradient: AvatarProps['gradient'], label: string): string {
  const pair =
    Array.isArray(gradient) && typeof gradient[0] === 'string'
      ? (gradient as readonly [string, string])
      : AVATAR_GRADIENTS[
          (typeof gradient === 'number' ? gradient : hashIndex(label)) %
            AVATAR_GRADIENTS.length
        ]
  return `linear-gradient(140deg, ${pair[0]}, ${pair[1]})`
}

export interface AvatarProps {
  /** Handle/name — drives initials + the title tooltip + the fallback hash. */
  label: string
  /** Explicit `[c1, c2]` gradient, or an index into `AVATAR_GRADIENTS`.
   *  When omitted, a stable index is derived from `label`. */
  gradient?: number | readonly [string, string]
  /** Optional image URL — rendered over the gradient, hidden on error. */
  imageUrl?: string
  /** Pixel size (square). Defaults to 32. */
  size?: number
  /** Rounded-square variant instead of a circle. */
  square?: boolean
  /** Override the derived initials. */
  initials?: string
  className?: string
  style?: CSSProperties
}

export function Avatar({
  label,
  gradient,
  imageUrl,
  size = 32,
  square = false,
  initials,
  className,
  style,
}: AvatarProps) {
  const cls = `ds-avatar${square ? ' ds-avatar--square' : ''}${className ? ` ${className}` : ''}`
  return (
    <span
      className={cls}
      title={label}
      style={{
        width: size,
        height: size,
        background: gradientCss(gradient, label),
        fontSize: Math.round(size * 0.36),
        ...style,
      }}>
      {imageUrl ? (
        <img
          className="ds-avatar-img"
          src={imageUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        (initials ?? avatarInitials(label))
      )}
    </span>
  )
}
