import { useScrollAnim } from '../hooks/useScrollAnim'
import { Section } from './Section'
import { SectionHead } from './SectionHead'
import styles from './ValueProps.module.css'

interface Prop {
  num: string
  name: string
  desc: string
}

const PROPS: Prop[] = [
  {
    num: '01',
    name: 'Personal upside',
    desc: "What you do online has value. Sofia lets you turn it into an asset — share without sharing: you publish the proof, you keep the details.",
  },
  {
    num: '02',
    name: 'Group momentum',
    desc: 'Find the people who think like you, follow their finds, give weight to the ones that matter. The group forms from what you actually do.',
  },
  {
    num: '03',
    name: 'Tech watch',
    desc: "Filter the noise. See what's rising among the people you follow before it shows up everywhere. A radar driven by people, not algorithms.",
  },
  {
    num: '04',
    name: 'Collective intelligence',
    desc: 'What thousands of people watch, read, and certify becomes a shared signal. A living map of what deserves attention, built together.',
  },
]

/**
 * ValueProps (S.0A) — "Why Sofia" slide inside the HexDeck.
 *
 * Two-column layout. The left column is reserved as a placeholder
 * for the shared Plate A, which is rendered once by the HexDeck and
 * animated from the right of the Hero to the left of this slide as
 * the horizontal track scrolls. The right column owns the copy +
 * the 2x2 angles grid.
 */
export function ValueProps() {
  return (
    <Section
      id="value-props"
      code="S.0A"
      label="WHY SOFIA"
      meta="04 ANGLES"
      variant="peach"
    >
      <div className={styles.layout}>
        {/* Reserved column overlaid by the shared Plate A floating in
            from the Hero. No DOM content here — the Plate is animated
            by the HexDeck so it can survive the slide boundary. */}
        <div className={styles.plateZone} aria-hidden="true" />

        <div className={styles.contentZone}>
          <SectionHead
            eyebrow="Why Sofia"
            title={
              <>
                Four angles, <em>one promise.</em>
              </>
            }
            sub="Sofia answers four real needs — personal, group, watch, and collective intelligence. No jargon, no posturing: what you actually get from using it."
            variant="peach"
          />
          <div className={`${styles.grid} stagger`}>
            {PROPS.map((p, i) => (
              <PropCard key={p.num} prop={p} index={i} />
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}

function PropCard({ prop, index }: { prop: Prop; index: number }) {
  const ref = useScrollAnim<HTMLElement>()
  return (
    <article
      ref={ref}
      className={`${styles.card} anim anim-up`}
      style={{ ['--i' as never]: index }}
    >
      <span className={styles.num}>VALUE.{prop.num}</span>
      <h3 className={styles.name}>{prop.name}</h3>
      <p className={styles.desc}>{prop.desc}</p>
    </article>
  )
}
