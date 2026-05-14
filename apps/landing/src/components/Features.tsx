import { useScrollAnim } from '../hooks/useScrollAnim'
import { Section } from './Section'
import { SectionHead } from './SectionHead'
import { Plate } from './Plate'
import { IsoStack } from './Instruments'
import styles from './Features.module.css'

/**
 * Vision (S.01) — Vision-only slide inside the HexDeck.
 */
export function Features() {
  return (
    <Section
      id="vision"
      code="S.01"
      label="VISION"
      meta="YOUR WEB → YOUR PEOPLE"
      variant="peach"
    >
      <SectionHead
        eyebrow="Vision"
        title={
          <>
            The web you browse becomes <em>a story you own.</em>
          </>
        }
        sub="Sofia turns your attention into a shared signal without renting it out. You sign what's worth keeping; it becomes permanent proof, and over time these proofs draw a map of who cares about what."
        variant="peach"
      />

      <VisionBlock />
    </Section>
  )
}

function VisionBlock() {
  const ref = useScrollAnim<HTMLElement>()
  return (
    <article ref={ref} className={`${styles.vision} anim anim-up`}>
      <div className={styles.visionLayout}>
        <div className={styles.visionCopy}>
          <p>
            Sofia isn't a new social network, nor another feed reader. It's an
            instrument that turns your attention into a shared signal without
            renting it out. You decide what's worth keeping, you sign it, and
            it becomes permanent proof nothing and no one can rewrite.
          </p>
          <p>
            Over time, these proofs draw a map of who cares about what, who
            discovers what, who validates what. A map built by people, for
            people. The more you use it, the more it gives back.
          </p>
        </div>
        <div className={styles.visionVisual}>
          <Plate
            tag="PLATE.D"
            title="Stack · from the pages you read to the circle that follows you"
            meta={['5 LAYERS', 'YOUR WEB → YOUR PEOPLE']}
            foot={['LOCAL → PUBLIC', 'YOU OWN THE FLOW']}
            instrument="iso"
            variant="on-peach"
            bodyClassName={styles.visionPlateBody}
            className={styles.visionPlate}
          >
            <IsoStack mode="light" />
          </Plate>
        </div>
      </div>
    </article>
  )
}

