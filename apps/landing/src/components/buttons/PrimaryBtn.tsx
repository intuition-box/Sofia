import { useState, type CSSProperties, type ReactNode } from 'react'

interface PrimaryBtnProps {
  href: string
  children: ReactNode
}

/**
 * PrimaryBtn — solid filled CTA matching the Hero "Open Explorer" look
 * (deep-ink slab + peach text) with a hard hover swap to white bg +
 * deep-ink text. Inline-styled with React hover state so the colours
 * are deterministic across slide variants and CSS cascade.
 */
export function PrimaryBtn({ href, children }: PrimaryBtnProps) {
  const [hover, setHover] = useState(false)
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: 999,
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    fontWeight: 500,
    letterSpacing: '0.04em',
    textDecoration: 'none',
    background: '#02000e',
    border: '1px solid #02000e',
    color: 'var(--color-accent)',
    transition:
      'background 160ms ease, color 160ms ease, border-color 160ms ease, transform 160ms ease',
    cursor: 'pointer',
  }
  const hovered: CSSProperties = {
    background: '#ffffff',
    borderColor: '#ffffff',
    color: '#02000e',
    transform: 'translateY(-1px)',
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...(hover ? hovered : null) }}>
      {children}
    </a>
  )
}
