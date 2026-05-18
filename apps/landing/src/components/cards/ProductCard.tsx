import { Arrow } from '../Arrow'
import { SceneBtn } from '../buttons/SceneBtn'

interface ProductCardProps {
  tag: string
  title: string
  desc: string
  cta: { href: string; label: string }
}

/**
 * ProductCard — variant of ValueCard tuned for S.04 cells. Anchors a
 * scene button at the bottom of the cell via `margin-top: auto` so the
 * CTA always sits at the floor even if the description is short.
 * Used for "Download the extension" and "Open the Explorer".
 */
export function ProductCard({ tag, title, desc, cta }: ProductCardProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
      }}>
      <span className="eyebrow">{tag}</span>
      <h3
        className="h-section"
        style={{
          margin: '10px 0 8px',
          fontSize: 'clamp(1.1rem, 0.9rem + 0.9vw, 1.9rem)',
        }}>
        {title}
      </h3>
      <p
        className="lede"
        style={{
          margin: 0,
          fontSize: 'clamp(0.78rem, 0.7rem + 0.35vw, 1rem)',
        }}>
        {desc}
      </p>
      <div style={{ marginTop: 10 }}>
        <SceneBtn
          href={cta.href}
          variant="dark"
          ink="light"
          hoverFill="peach"
          style={{ padding: '8px 14px', fontSize: '0.78rem' }}>
          {cta.label} <Arrow />
        </SceneBtn>
      </div>
    </div>
  )
}
