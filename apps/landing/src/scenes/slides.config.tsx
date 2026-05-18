import type { PlaceholderSlideProps } from './PlaceholderSlide'

export type SlideConfig = Omit<PlaceholderSlideProps, 'variant' | 'zoneStart'>

export const SLIDES: SlideConfig[] = [
  /* S.01 — Cover + Why Sofia merged into one slide with a reveal
     sub-state. Base shows zones 1/2/3 (catch phrase + partners on the
     left stack, graphic vector right tall). On sub-scroll: zones 1, 2
     fade out, the reveal layer cross-fades in with zones 4–9 in a
     quintet — zone 4 takes the left-tall slot (mirrors zone 3's
     content "graphic vector" so the swap reads as a slide-left), and
     5–9 cascade in 700ms later. The background also wipes peach →
     dark on the same sub-scroll. Label flips COVER → WHY SOFIA. */
  {
    code: 'S.01',
    label: 'HERO',
    meta: 'COVER',
    layout: 'stack-left-tall-right',
    revealLayout: 'left-quintet-right',
    revealLabel: 'WHY SOFIA',
    revealMeta: '04 ANGLES',
    revealDelay: 700,
    revealVariant: 'dark',
    /* Reveal idx 0 (left-tall slot) mirrors base zone 3 — same number
       "3", same "graphic vector" label, so the swap reads as zone 3
       sliding from right to left, not as a brand-new zone 4. */
    revealNumOverride: { 0: 3 },
    /* wipeIndex 2 = grid area `c` = zone 3 = Fig V.06 (CirclesSequence
       right-tall). The diagonal slab balaie le graphic à l'entrée de
       slide, le catch phrase + partners cascadent en slide-up. */
    wipeIndex: 2,
    wipeColor: '#e4b95a' /* fun · jaune */,
  },
  {
    code: 'S.03',
    label: 'INSTRUMENT',
    meta: 'CAROUSEL',
    layout: 'single',
    wipeColor: '#6dd4a0' /* trusted · vert */,
  },
  /* S.04 — 11 (left tall) lands first with its diagonal wipe, then
     12/13/14 cascade in after a 700ms beat. */
  {
    code: 'S.04',
    label: 'PRODUCT',
    meta: 'PREVIEW',
    layout: 'left-banner-pair-right',
    revealDelay: 700,
    wipeColor: '#5cc4d6' /* learning · turquoise */,
  },
  /* S.05 — VISION. Quad of feature cards on the left/middle (15-18),
     Plate D vector graphic (IsoStack) on the right tall slot (19),
     which spans the full slide height. `headerContent` is rendered
     INSIDE the grid as the top banner cell `h` (spans cols 1+2,
     above the cards) so Plate D keeps its full vertical span.
     wipeIndex: 4 → the diagonal slab balaie Plate D (grid area `e`) en
     entrée de slide, en violet (--inspiration). */
  {
    code: 'S.05',
    label: 'VISION',
    meta: 'FEATURES',
    layout: 'quad-banner-tall-right',
    wipeIndex: 4,
    wipeColor: '#a78bdb' /* inspiration · violet */,
    headerContent: (
      <div style={{ width: '100%', textAlign: 'left' }}>
        <h2
          className="h-section"
          style={{
            margin: '0 0 8px',
            fontSize: 'clamp(1.4rem, 1rem + 1.4vw, 2rem)',
            lineHeight: 1.15,
          }}
        >
          You are the hero of your own story.{' '}
          <em>Sofia ensures you finally own the pen.</em>
        </h2>
        <p
          className="lede"
          style={{
            margin: 0,
            fontSize: 'clamp(0.82rem, 0.7rem + 0.4vw, 1rem)',
            maxWidth: 'none',
          }}
        >
          Sofia turns every meaningful action you take online — what you read,
          certify, back — into a verifiable proof only you own. Identity becomes
          lived, not declared.
        </p>
      </div>
    ),
  },
  /* S.06 — left-stack-right base: Core contributor on the left tall
     column, Backed by stacked on top of Advisors on the right. The
     diagonal wipe lands on Backed by (idx 1, top right); Core and
     Advisors cascade in after. Reveal flips CONTRIBUTOR → COMMUNITY
     using stack-left-tall-right for the three new zones. */
  {
    code: 'S.06',
    label: 'CONTRIBUTOR',
    meta: 'TEAM',
    layout: 'left-stack-right',
    revealLayout: 'stack-left-tall-right',
    revealLabel: 'COMMUNITY',
    wipeIndex: 1,
    revealDelay: 700,
    wipeColor: '#e4b95a' /* fun · jaune (cycle) */,
  },
  /* S.07 — 25 (left tall) lands first with its wipe, then the 2×2
     quad 26/27/28/29 cascade in after a beat. */
  {
    code: 'S.07',
    label: 'VALUES',
    meta: '04 PRINCIPLES',
    layout: 'left-quad-right',
    revealDelay: 700,
    wipeColor: '#7bade0' /* work · bleu (cycle) */,
  },
  {
    code: 'S.08',
    label: 'LOOKUPS',
    meta: 'Q&A',
    layout: 'two-col-narrow-left',
    wipeColor: '#6dd4a0' /* trusted · vert (cycle) */,
  },
  {
    code: 'S.09',
    label: 'CTA',
    meta: 'JOIN',
    layout: 'single',
    wipeColor: '#5cc4d6' /* learning · turquoise (cycle) */,
  },
]

/* subStates[i] = number of sub-triggers on slide i before forwarding
   to the next slide. A slide with a revealLayout gets 1 sub-state. */
export const SUB_STATES = SLIDES.map((s) => (s.revealLayout ? 1 : 0))

/* Alternating peach / dark — every trigger flips the slab colour so
   the 60° wipe between two slides is always a visible colour change.
   One entry per SLIDES element (the footer lives outside the deck). */
export const VARIANTS = [
  'peach', // S.01
  'peach', // S.03
  'dark', // S.04
  'peach', // S.05
  'dark', // S.06
  'peach', // S.07
  'dark', // S.08
  'peach', // S.09
] as const

/* Reveal-state background per slide. Index matches the SLIDES order
   (footer slide doesn't appear here — it's added separately). When
   set, the deck paints a wipe-in slab of this colour on top of the
   slide's base bg as soon as that slide's sub-state goes ≥ 1. */
export const REVEAL_BGS: ((typeof VARIANTS)[number] | undefined)[] = [
  'dark', // S.01 reveal → why-sofia is on dark
  undefined, // S.03
  undefined, // S.04
  undefined, // S.05
  undefined, // S.06 (reveal stays on same bg)
  undefined, // S.07
  undefined, // S.08
  undefined, // S.09
]
