import type { CSSProperties, ReactNode } from 'react'

/**
 * `<Icon>` — the hairline icon set ported from the newexplorerDAO handoff
 * (circle/components.jsx:7-33). Presentational only: each glyph inherits
 * `currentColor` and fills its box, so size + color come from the parent
 * (`font-size` / `color` / an explicit `size` prop).
 *
 * Requires `import "@0xsofia/design-system/styles/icon.css"`.
 */
export type IconName =
  | 'home'
  | 'circles'
  | 'people'
  | 'signals'
  | 'search'
  | 'download'
  | 'send'
  | 'check'
  | 'info'
  | 'bolt'
  | 'ping'
  | 'expand'
  | 'arrow'
  | 'flame'
  | 'x'
  | 'discord'
  | 'telegram'
  | 'gmail'
  | 'ext'
  | 'thumbup'
  | 'thumbdown'

const GLYPHS: Record<IconName, ReactNode> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  ),
  circles: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="8" r="5" />
      <circle cx="16" cy="16" r="5" />
    </svg>
  ),
  people: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 6.1" />
      <path d="M17.5 14.4A5.5 5.5 0 0 1 20.5 20" />
    </svg>
  ),
  signals: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14a8 8 0 0 1 8-8" />
      <path d="M4 18a12 12 0 0 1 12-12" />
      <circle cx="5" cy="19" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 20h16" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 3 10.5 13.5" />
      <path d="M21 3 14.5 21l-4-7.5L3 9.5 21 3Z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 12.5 5 5 11-11" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 7.5v.01" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  ),
  ping: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h3l2-6 4 12 2-6h3" />
    </svg>
  ),
  expand: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H4a1 1 0 0 1-1-1v-5" />
      <path d="M15 3h5a1 1 0 0 1 1 1v5" />
      <path d="M21 3 14 10" />
      <path d="M3 21l7-7" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  ),
  flame: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c1 3-1 4-1 6a3 3 0 0 0 6 0c0 4-2 5-2 7a3 3 0 0 1-6 0c0-3 3-4 3-7 0-1.5-.7-2.6 0-3Z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  ),
  discord: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20.317 4.369A19.79 19.79 0 0 0 15.432 3c-.21.375-.45.88-.617 1.28a18.27 18.27 0 0 0-5.62 0A12.6 12.6 0 0 0 8.57 3 19.74 19.74 0 0 0 3.68 4.37C.533 9.046-.32 13.58.099 18.057a19.9 19.9 0 0 0 6.05 3.03c.488-.66.922-1.36 1.296-2.097-.71-.266-1.39-.595-2.03-.98.17-.124.337-.254.497-.388 3.91 1.79 8.15 1.79 12.01 0 .163.134.33.264.5.388-.642.385-1.323.714-2.033.98.375.736.81 1.437 1.296 2.097a19.84 19.84 0 0 0 6.057-3.03c.5-5.18-.838-9.673-3.526-13.688ZM8.02 15.33c-1.182 0-2.157-1.085-2.157-2.42 0-1.334.955-2.42 2.157-2.42 1.21 0 2.176 1.095 2.157 2.42 0 1.335-.955 2.42-2.157 2.42Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.42 0-1.334.955-2.42 2.157-2.42 1.21 0 2.176 1.095 2.157 2.42 0 1.335-.946 2.42-2.157 2.42Z" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0Zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212-.07-.062-.174-.041-.249-.024-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635Z" />
    </svg>
  ),
  gmail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.2" />
      <path d="m3.6 7 8.4 6 8.4-6" />
    </svg>
  ),
  ext: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  ),
  thumbup: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 22V11l5-9c1.1 0 2 .9 2 2v4h4.6a2 2 0 0 1 2 2.35l-1.3 7A2 2 0 0 1 17 22H7Z" />
      <path d="M7 11H3v11h4" />
    </svg>
  ),
  thumbdown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2v11l-5 9c-1.1 0-2-.9-2-2v-4H5.4a2 2 0 0 1-2-2.35l1.3-7A2 2 0 0 1 7 2h10Z" />
      <path d="M17 13h4V2h-4" />
    </svg>
  ),
}

export interface IconProps {
  name: IconName
  /** Square pixel size — sets the wrapper's width/height (defaults to 1em). */
  size?: number
  /** Extra classes composed onto `.ds-icon`. */
  className?: string
  style?: CSSProperties
  title?: string
}

export function Icon({ name, size, className, style, title }: IconProps) {
  const cls = className ? `ds-icon ${className}` : 'ds-icon'
  const dim = size != null ? { width: size, height: size } : undefined
  return (
    <span className={cls} style={dim ? { ...dim, ...style } : style} title={title} aria-hidden={title ? undefined : true}>
      {GLYPHS[name]}
    </span>
  )
}
