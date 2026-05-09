import { gsap } from '../../gsap'
import { Stage, type StageContext } from '../Stage'

/**
 * HeroStage — radar dive.
 *
 * Internal phases (measured in fraction of the stage's slot):
 *   0.00 → 0.20  copy + diagram fade in (stage entry)
 *   0.20 → 0.65  scale 1 → 3 + drift xPercent 0 → -28
 *                copy fades + drifts left
 *   0.65 → 0.95  punch scale 3 → 5 ("enter the target")
 *   0.95 → 1.00  diagram fades out, ready for next stage handoff
 */
export class HeroStage extends Stage {
  readonly id = 'hero'
  readonly label = 'Cover'
  readonly weight = 2

  private querySelectors = {
    diagram: '[data-hero-diagram]',
    copy: '[data-hero-copy]',
    readout: '[data-hero-readout]',
  }

  build(ctx: StageContext): void {
    if (!this.el) return
    this.ctx = ctx

    const diagram = this.el.querySelector<HTMLElement>(
      this.querySelectors.diagram,
    )
    const copy = this.el.querySelector<HTMLElement>(this.querySelectors.copy)
    const readout = this.el.querySelector<HTMLElement>(
      this.querySelectors.readout,
    )
    if (!diagram) return

    const t = ctx.master
    const start = ctx.slot.start
    const dur = ctx.slot.duration

    /* Initial state — stage hidden until its slot starts. */
    t.set(this.el, { autoAlpha: 0 }, start)
    t.set(diagram, { scale: 1, xPercent: 0, transformOrigin: '50% 50%' }, start)
    if (copy) t.set(copy, { opacity: 1, x: 0 }, start)

    /* Entry — fade the whole stage in. */
    t.to(this.el, { autoAlpha: 1, duration: dur * 0.2, ease: 'none' }, start)

    /* Phase A — radar grows and drifts toward viewport centre. */
    t.to(
      diagram,
      {
        scale: 3,
        xPercent: -28,
        duration: dur * 0.45,
        ease: 'none',
      },
      start + dur * 0.2,
    )
    if (copy)
      t.to(
        copy,
        { opacity: 0, x: -40, duration: dur * 0.4, ease: 'none' },
        start + dur * 0.2,
      )

    /* Phase B — punch into target. */
    t.to(
      diagram,
      { scale: 5, duration: dur * 0.3, ease: 'none' },
      start + dur * 0.65,
    )

    /* Phase C — fade out at the very end so the next stage takes
       over without overlap. */
    t.to(
      this.el,
      { autoAlpha: 0, duration: dur * 0.05, ease: 'none' },
      start + dur * 0.95,
    )

    /* Live readout — driven by an onUpdate tween so the text
       reflects the actual phase progress, not just stage progress. */
    if (readout) {
      const proxy = { z: 1 }
      t.to(
        proxy,
        {
          z: 5,
          duration: dur * 0.95,
          ease: 'none',
          onUpdate: () => {
            readout.textContent = `ZOOM ×${proxy.z.toFixed(2)}`
          },
        },
        start + dur * 0.0,
      )
    }
  }

  destroy(): void {
    if (this.el) gsap.set(this.el, { clearProps: 'all' })
    super.destroy()
  }
}
