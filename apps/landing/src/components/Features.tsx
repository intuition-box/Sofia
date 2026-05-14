import type { ReactNode } from 'react'
import { Arrow } from './Arrow'
import { useScrollAnim } from '../hooks/useScrollAnim'
import { Section } from './Section'
import { SectionHead } from './SectionHead'
import { Plate } from './Plate'
import { IsoStack } from './Instruments'
import { URLS } from '../lib/config/urls'
import styles from './Features.module.css'

interface Pillar {
  tag: string
  name: string
  desc: string
  bullets: string[]
  icon: ReactNode
}

const PILLARS: Pillar[] = [
  {
    tag: 'P.01',
    name: 'Explorer',
    desc: "Sofia's web app. You see what you've certified, what your circle backs, and what's rising around you. Social sharing happens out in the open — every action counts for the people who follow you.",
    bullets: [
      'Your profile and your activity',
      'Your circle, their finds, their positions',
      'The claims rising — voted by people, not algorithms',
      'Rewards for contributions that hold up',
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
    ),
  },
  {
    tag: 'P.02',
    name: 'Extension',
    desc: "The browser extension. It holds the pen: it writes proof of what you find useful, never publishing the details you want to keep private. The line between 'browsing' and 'building value' disappears.",
    bullets: [
      'Lives in Chromium, local by default',
      'Capture, summarize, sign — you approve before anything is published',
      'Writes on-chain what you decide to keep',
      'Nothing leaves the machine without your OK',
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="3" y="4" width="18" height="14" rx="1.5" />
        <path d="M7 9h10M7 13h6" />
      </svg>
    ),
  },
]

interface ChronicleTeaser {
  date: string
  title: string
  link: string
}

const CHRONICLE_TEASERS: ChronicleTeaser[] = [
  {
    date: 'MARCH 20, 2026',
    title: 'Logbook 20/03 — Sofia Explorer & Beta Reward Program',
    link: URLS.blog.logbook2003,
  },
  {
    date: 'MARCH 13, 2026',
    title: 'Logbook #24 — Position Board & On-Chain Streaks',
    link: URLS.blog.logbook2403,
  },
]

/**
 * Vision (S.01) — Vision-only slide inside the HexDeck.
 *
 * The previous version of this slide rendered three blocks (pillars,
 * vision, open-source) which pushed Plate D to the very bottom of the
 * 100vh slide. The slide now shows only the Vision block: copy on the
 * left, Plate D (IsoStack) on the right, centred vertically.
 *
 * The Pillars and OpenBlock content + helpers are kept further down
 * in this file as inert code so the rédactionnel isn't lost — they
 * can be re-mounted in another section later, or cleaned up once we
 * decide not to reuse them.
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

function PillarCard({ pillar, index }: { pillar: Pillar; index: number }) {
  const ref = useScrollAnim<HTMLElement>()
  return (
    <article
      ref={ref}
      className={`${styles.pillar} anim anim-up`}
      style={{ ['--i' as never]: index }}
    >
      <header className={styles.pillarHead}>
        <span className={styles.pillarTag}>{pillar.tag}</span>
        <div className={styles.pillarIcon}>{pillar.icon}</div>
        <h3 className={styles.pillarName}>{pillar.name}</h3>
      </header>
      <p className={styles.pillarDesc}>{pillar.desc}</p>
      <ul className={styles.pillarBullets}>
        {pillar.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </article>
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

function OpenBlock({ teasers }: { teasers: ChronicleTeaser[] }) {
  const ref = useScrollAnim<HTMLElement>()
  return (
    <article ref={ref} className={`${styles.open} anim anim-up`}>
      <span className={styles.subEyebrow}>Open &amp; built in public</span>
      <h3 className={styles.subTitle}>
        What we build, <em>you can read.</em>
      </h3>
      <div className={styles.openGrid}>
        <div className={styles.openCell}>
          <span className={styles.openLabel}>O.01 · OPEN SOURCE</span>
          <p className={styles.openText}>
            The code, the contracts, the data shapes — all open. Fork it,
            audit it, contribute. What you see running is what's published.
          </p>
          <a
            href={URLS.external.github}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-secondary ${styles.openCta}`}
          >
            GitHub <Arrow />
          </a>
        </div>
        <div className={styles.openCell}>
          <span className={styles.openLabel}>O.02 · CHRONICLES</span>
          <p className={styles.openText}>
            A public build log — every two weeks, what was done, what was
            tried, what was scrapped. No pitch, no dressed-up roadmap — just
            what the team actually shipped.
          </p>
          <ul className={styles.openTeasers}>
            {teasers.map((t) => (
              <li key={t.link}>
                <a
                  href={t.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.openTeaserLink}
                >
                  <span className={styles.openTeaserDate}>{t.date}</span>
                  <span className={styles.openTeaserTitle}>{t.title}</span>
                </a>
              </li>
            ))}
          </ul>
          <a
            href={URLS.blog.index}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-secondary ${styles.openCta}`}
          >
            All entries <Arrow />
          </a>
        </div>
        <div className={styles.openCell}>
          <span className={styles.openLabel}>O.03 · BUILT IN PUBLIC</span>
          <p className={styles.openText}>
            We expose our decisions, our doubts, our trade-offs. What you read
            here is what we say internally. The community has a voice — and
            uses it.
          </p>
        </div>
      </div>
    </article>
  )
}
