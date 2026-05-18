import { type CSSProperties, type ReactNode } from 'react'
import { useSceneSubState } from './SceneStack'
import { ZONE_LABELS, ZONE_NODES } from './zones'
import styles from '../App.module.css'

/** Layout primitives a slide can request for its zone grid. */
export type SlideLayout =
  | 'single'
  | 'two-col'
  | 'two-col-narrow-left'
  | 'two-row'
  | 'left-stack-right'
  | 'stack-left-tall-right'
  | 'left-quad-right'
  | 'left-quintet-right'
  | 'left-banner-pair-right'
  | 'stack-pair-tall-right'
  | 'quad'
  | 'quad-tall-right'
  | 'quad-banner-tall-right'

export interface PlaceholderSlideProps {
  code: string
  label: string
  meta: string
  variant: 'peach' | 'dark'
  /** Optional ink variant that takes over while sub-state is ≥ 1.
   *  Lets the slide flip from peach ink (on a peach bg) to light ink
   *  when the reveal slab paints the bg dark, so text doesn't end up
   *  black-on-black. */
  revealVariant?: 'peach' | 'dark'
  /** First zone number on this slide (zones are numbered continuously
   *  across the whole deck). */
  zoneStart: number
  /** Grid shape for the slide's base (sub-state 0) zones. */
  layout: SlideLayout
  /** Optional swap-in layout for sub-state ≥ 1. The base zones fade
   *  out and these reveal zones fade in occupying the same content
   *  area. Their zone numbers continue after the base zones. */
  revealLayout?: SlideLayout
  /** Optional label that replaces `label` while the sub-state is ≥ 1
   *  — used e.g. to flip CONTRIBUTOR → COMMUNITY on the reveal. */
  revealLabel?: string
  /** Optional meta that replaces `meta` while sub-state is ≥ 1. */
  revealMeta?: string
  /** Which base-zone index gets the 60° diagonal colour wipe entrance
   *  animation. Default 0 (first zone). Set to -1 to disable on this
   *  slide. */
  wipeIndex?: number
  /** Which reveal-zone index gets the wipe entrance. Defaults to -1
   *  (no wipe on reveals — they all use scale-fade). */
  revealWipeIndex?: number
  /** Extra delay (ms) added to every non-wipe base zone. Lets the
   *  wipe zone land first, then the rest cascade in after a beat. */
  revealDelay?: number
  /** Per-revealIdx number override. Use to make a reveal zone display
   *  the same number/label as a base zone (e.g. S.01 reveal idx 0
   *  mirrors base zone 3 so the swap reads as "3 slides left"). */
  revealNumOverride?: Record<number, number>
  /** Optional banner rendered between the meta strip and the zones
   *  grid. Lets a slide carry a paragraph of intro copy ABOVE its
   *  zone layout without consuming a zone number. */
  headerContent?: ReactNode
  /** Hex colour applied to the section's diagonal wipe slab. When set,
   *  it overrides the default peach/dark mapping via inline
   *  `--zone-wipe-color` on the lead zone. Used to flag each slide
   *  with a distinct intention colour. */
  wipeColor?: string
}

export const LAYOUT_AREAS: Record<SlideLayout, string[]> = {
  /* a (single full-bleed zone) */
  single: ['a'],
  /* a | b */
  'two-col': ['a', 'b'],
  /* a | b   (left col narrow, right col wide — 1fr / 2fr) */
  'two-col-narrow-left': ['a', 'b'],
  /* a       (full-width top row, full-width bottom row) */
  /* b */
  'two-row': ['a', 'b'],
  /* a | b    (a spans both rows on the left,
   * a | c     b is top-right, c is bottom-right) */
  'left-stack-right': ['a', 'b', 'c'],
  /* a | c    (a top-left, b bottom-left — left column stacked;
   * b | c     c spans both rows on the right, full-height) */
  'stack-left-tall-right': ['a', 'b', 'c'],
  /* a a c    (a top-left, b middle-left, c right full-height,
   * b b c     d/e are a side-by-side pair below b — used for the
   * d e c     S.06 reveal where 19, 20 appear below 17) */
  'stack-pair-tall-right': ['a', 'b', 'c', 'd', 'e'],
  /* a | b c   (a spans both rows on the left,
   * a | d e    b/c top-right, d/e bottom-right — 2×2 quad on right) */
  'left-quad-right': ['a', 'b', 'c', 'd', 'e'],
  /* a | b b   (a spans both rows on the left,
   * a | c d    b banner across top-right, c/d pair at bottom-right) */
  'left-banner-pair-right': ['a', 'b', 'c', 'd'],
  /* a | b b   (a spans all rows on the left,
   * a | c d    b is the top banner spanning the right two columns,
   * a | e f    c/d + e/f form a 2×2 quad below it — 6 zones total) */
  'left-quintet-right': ['a', 'b', 'c', 'd', 'e', 'f'],
  /* a | b    (2x2 quadrants) */
  /* c | d */
  quad: ['a', 'b', 'c', 'd'],
  /* a | b | e   (2×2 quad on the left/middle cols, tall right col `e`
   * c | d | e    spanning both rows — used for S.05 VISION with Plate D
   *              graphic on the right). 5 zones total. */
  'quad-tall-right': ['a', 'b', 'c', 'd', 'e'],
  /* h h e   (banner across cols 1+2 top, 2×2 quad below, tall right
   * a b e    col `e` spans all 3 rows — Plate D goes full slide height
   * c d e    while the header lives inside the grid as the `h` row).
   *          `h` is not numbered (banner == headerContent slot). */
  'quad-banner-tall-right': ['a', 'b', 'c', 'd', 'e'],
}

function layoutClass(layout: SlideLayout) {
  return `layout_${layout.replace(/-/g, '_')}`
}

export function PlaceholderSlide({
  code,
  label,
  meta: _meta,
  variant,
  zoneStart,
  layout,
  revealLayout,
  revealLabel,
  revealMeta: _revealMeta,
  revealVariant,
  wipeIndex = 0,
  revealWipeIndex = -1,
  revealDelay = 0,
  revealNumOverride,
  headerContent,
  wipeColor,
}: PlaceholderSlideProps) {
  const baseAreas = LAYOUT_AREAS[layout]
  const revealAreas = revealLayout ? LAYOUT_AREAS[revealLayout] : []
  const { subState, isActive } = useSceneSubState()
  const revealed = subState >= 1
  const activeLabel = revealed && revealLabel ? revealLabel : label
  /* Applied to the placeholder (frame strips) so the meta/bottom
     strips flip ink with the active bg. The content zones use their
     own per-layer variant class on `.zones` so they stay stable. */
  const activeVariant = revealed && revealVariant ? revealVariant : variant
  const revealStart = zoneStart + baseAreas.length
  return (
    <section
      className={`${styles.placeholder} ${styles[activeVariant]}`}
      data-active={isActive ? 'true' : 'false'}
      data-deck-slide="true"
      data-variant={activeVariant}
    >
      <div className={styles.frame}>
        <div className={styles.metaStrip}>
          <span>
            <span className={styles.dot} />
            {code} · {activeLabel}
          </span>
        </div>

        {/* Layouts with a banner area `h` render the header INSIDE
            the .zones grid (see below). Otherwise the header lives
            in this slot, above the grid. */}
        {headerContent && layout !== 'quad-banner-tall-right' && (
          <div
            className={`${styles.header} ${variant === 'peach' ? 'on-peach' : ''}`}
          >
            {headerContent}
          </div>
        )}

        <div className={styles.contentArea}>
          <div
            className={`${styles.zones} ${styles[layoutClass(layout)]} ${styles[variant]} ${variant === 'peach' ? 'on-peach' : ''}`}
            data-hidden={revealed ? 'true' : 'false'}
          >
            {/* In-grid banner: layouts that declare an `h` grid area
                host headerContent as a normal grid cell so the tall
                right column ('e') keeps its full-slide span. */}
            {headerContent && layout === 'quad-banner-tall-right' && (
              <div className={styles.gridBanner} style={{ gridArea: 'h' }}>
                {headerContent}
              </div>
            )}
            {baseAreas.map((area, idx) => {
              const n = zoneStart + idx
              /* Mix of entrance animations: the zone at `wipeIndex`
                 gets the 60° diagonal colour wipe; the rest slide-up
                 + fade. wipeIndex = -1 disables the wipe entirely on
                 this slide. */
              const anim = idx === wipeIndex ? 'wipe' : 'slide-up'
              /* Lead zone (no extra delay) = the wipe zone if there is
                 one; otherwise the first zone. The other zones cascade
                 in after `revealDelay`. */
              const leadIdx = wipeIndex >= 0 ? wipeIndex : 0
              const extraDelay = idx === leadIdx ? 0 : revealDelay
              /* Use the BASE variant (not activeVariant) — base zones
                 fade out as a layer, they shouldn't flip palette mid
                 fade-out otherwise the catch phrase + partner logos
                 turn the wrong colour for a beat. */
              const customNode = ZONE_NODES[n]?.(variant)
              /* Apply the per-slide wipe colour only on the actual
                 wipe zone — the inline CSS var beats the default
                 peach/dark mapping in the cascade. */
              const zoneStyle: CSSProperties = {
                gridArea: area,
                ['--zone-i' as never]: idx,
                ['--zone-extra-delay' as never]: `${extraDelay}ms`,
              }
              if (anim === 'wipe' && wipeColor) {
                zoneStyle['--zone-wipe-color' as never] = wipeColor as never
              }
              return (
                <div
                  key={n}
                  className={styles.zone}
                  data-anim={anim}
                  data-custom={customNode ? 'true' : 'false'}
                  style={zoneStyle}
                >
                  {customNode ? (
                    <div className={styles.zoneContent}>{customNode}</div>
                  ) : (
                    <span className={styles.zoneInner}>
                      <span className={styles.zoneNum}>{n}</span>
                      <span className={styles.zoneRef}>
                        {ZONE_LABELS[n] ?? `ZONE ${n}`}
                      </span>
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {revealLayout && (
            <div
              className={`${styles.zones} ${styles[layoutClass(revealLayout)]} ${styles.revealZones} ${styles[revealVariant ?? variant]} ${(revealVariant ?? variant) === 'peach' ? 'on-peach' : ''}`}
              data-revealed={revealed ? 'true' : 'false'}
            >
              {revealAreas.map((area, idx) => {
                const n = revealStart + idx
                const displayN = revealNumOverride?.[idx] ?? n
                /* Reveal zones get their dedicated variant (e.g. dark
                   on the WHY SOFIA reveal of S.01) — stable across the
                   crossfade, no palette flip mid-transition. */
                const customNode = ZONE_NODES[displayN]?.(
                  revealVariant ?? variant,
                )
                /* Same lead/cascade pattern as the base layer: the
                   reveal-wipe zone (or idx 0 by default) lands first,
                   the rest cascade after `revealDelay` ms. Animation
                   is 'wipe' on the lead if revealWipeIndex ≥ 0,
                   otherwise the default 'scale' fade. */
                const isRevealWipe =
                  revealWipeIndex >= 0 && idx === revealWipeIndex
                const revealLeadIdx = revealWipeIndex >= 0 ? revealWipeIndex : 0
                const extraDelay = idx === revealLeadIdx ? 0 : revealDelay
                const anim = isRevealWipe ? 'wipe' : 'scale'
                const revealZoneStyle: CSSProperties = {
                  gridArea: area,
                  ['--zone-i' as never]: idx,
                  ['--zone-extra-delay' as never]: `${extraDelay}ms`,
                }
                if (anim === 'wipe' && wipeColor) {
                  revealZoneStyle['--zone-wipe-color' as never] =
                    wipeColor as never
                }
                return (
                  <div
                    key={n}
                    className={styles.zone}
                    data-anim={anim}
                    data-custom={customNode ? 'true' : 'false'}
                    style={revealZoneStyle}
                  >
                    {customNode ? (
                      <div className={styles.zoneContent}>{customNode}</div>
                    ) : (
                      <span className={styles.zoneInner}>
                        <span className={styles.zoneNum}>{displayN}</span>
                        <span className={styles.zoneRef}>
                          {ZONE_LABELS[displayN] ?? `ZONE ${displayN}`}
                        </span>
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ZONES bottom-strip removed — internal-only metadata that
            shouldn't surface on the public page. */}
      </div>
    </section>
  )
}
