import { Arrow } from '../Arrow'
import { SceneBtn } from '../buttons/SceneBtn'
import styles from './Card.module.css'

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
    <div className={styles.shell}>
      <span className="eyebrow">{tag}</span>
      <h3 className={`h-section ${styles.title}`}>{title}</h3>
      <p className={`lede ${styles.desc}`}>{desc}</p>
      <div className={styles.ctaCompact}>
        <SceneBtn
          href={cta.href}
          variant="dark"
          ink="light"
          hoverFill="peach"
          size="sm"
        >
          {cta.label} <Arrow />
        </SceneBtn>
      </div>
    </div>
  )
}
