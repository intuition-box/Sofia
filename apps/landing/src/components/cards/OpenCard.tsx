import { Arrow } from '../Arrow'
import { PrimaryBtn } from '../buttons/PrimaryBtn'
import { SceneBtn } from '../buttons/SceneBtn'

interface OpenCardProps {
  tag: string
  title: string
  desc: string
  cta?: { href: string; label: string }
  /** When true, the CTA renders as a solid peach-on-ink primary
   *  button (matches Hero "Open Explorer") instead of the outlined
   *  SceneBtn. */
  ctaPrimary?: boolean
}

/**
 * OpenCard — uniform card for the four S.05 VISION cells (Open source /
 * DAO / Chronicles / Built in public). One component = one h-section
 * clamp + one button placement, so all four titles render at the same
 * size and the CTAs sit at the same vertical offset under the lede.
 */
export function OpenCard({ tag, title, desc, cta, ctaPrimary }: OpenCardProps) {
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
          lineHeight: 1.1,
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
      {cta && (
        <div style={{ marginTop: 12 }}>
          {ctaPrimary ? (
            <PrimaryBtn href={cta.href}>
              {cta.label} <Arrow />
            </PrimaryBtn>
          ) : (
            <SceneBtn
              href={cta.href}
              variant="dark"
              hoverFill="white"
              style={{ padding: '8px 14px', fontSize: '0.78rem' }}>
              {cta.label} <Arrow />
            </SceneBtn>
          )}
        </div>
      )}
    </div>
  )
}
