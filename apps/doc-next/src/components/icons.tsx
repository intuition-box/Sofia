/**
 * Inline SVG icons — ported verbatim from the Claude Design
 * `parts.jsx`. Kept as a single module so every component shares
 * the exact same paths the design used.
 */

export const CaretIcon = () => (
  <svg
    className="caret"
    viewBox="0 0 10 10"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round">
    <path d="M2 4l3 3 3-3" />
  </svg>
)

export const ExtIcon = () => (
  <svg
    className="ext"
    viewBox="0 0 10 10"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round">
    <path d="M3 7L7 3M4 3h3v3" />
  </svg>
)

export const ChevronIcon = () => (
  <svg
    className="chev"
    viewBox="0 0 10 10"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round">
    <path d="M3 2l3 3-3 3" />
  </svg>
)

export const SearchIcon = ({ size = 13 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6">
    <circle cx="7" cy="7" r="5" />
    <path d="M11 11l3 3" strokeLinecap="round" />
  </svg>
)

export const SunIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5">
    <circle cx="8" cy="8" r="3" />
    <g strokeLinecap="round">
      <path d="M8 1.5v1.7M8 12.8v1.7M14.5 8h-1.7M3.2 8H1.5M12.6 3.4L11.4 4.6M4.6 11.4L3.4 12.6M12.6 12.6L11.4 11.4M4.6 4.6L3.4 3.4" />
    </g>
  </svg>
)

export const MoonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
    <path d="M14 9.5A6 6 0 1 1 6.5 2a5 5 0 0 0 7.5 7.5z" />
  </svg>
)

export const GithubIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0a8 8 0 0 0-2.5 15.6c.4.1.5-.2.5-.4v-1.4c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.4.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-3.9 0-.9.3-1.6.8-2.1 0-.2-.3-1 .1-2.1 0 0 .7-.2 2.2.8a7.6 7.6 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.5.8 1.2.8 2.1 0 3-1.8 3.7-3.6 3.9.3.3.5.8.5 1.6v2.3c0 .2.1.5.5.4A8 8 0 0 0 8 0z" />
  </svg>
)

export const InstallIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6">
    <rect x="2" y="3" width="12" height="10" rx="2" />
    <path d="M5 7h6M5 10h4" strokeLinecap="round" />
  </svg>
)

export const BurgerIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round">
    <path d="M2 4h12M2 8h12M2 12h12" />
  </svg>
)

export const CloseIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round">
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
)

export const CopyIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="4" y="4" width="9" height="9" rx="1.5" />
    <path d="M3 11V3a1 1 0 0 1 1-1h8" />
  </svg>
)

export const XIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export const LinkedInIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)
