import type { gsap } from 'gsap'

/**
 * Read-only window into the master timeline assigned by the
 * Storyboard. A stage uses these to attach its own tweens at the
 * right slot of the master scroll progress.
 *
 * `slot.start` and `slot.end` are progress values in [0, 1] on the
 * master timeline duration. Each stage owns one contiguous slot.
 */
export interface StageContext {
  /** DOM root the stage renders into. */
  el: HTMLElement
  /** Position of this stage in the storyboard order, 0-indexed. */
  index: number
  /** Total number of stages in the storyboard. */
  total: number
  /** Master GSAP timeline. Stage adds tweens at `slot.start`. */
  master: gsap.core.Timeline
  /** Progress range owned by this stage on the master. */
  slot: { start: number; end: number; duration: number }
}

/**
 * Base class for every storyboard stage. Subclasses implement
 * {@link build} to register their tweens on the master timeline.
 *
 * Lifecycle:
 *   - constructor    — set id and any static config
 *   - mount(el)      — Storyboard hands a DOM root
 *   - build(ctx)     — Storyboard calls once with the master timeline
 *                      and a slot. Subclass wires its tweens here.
 *   - destroy()      — Storyboard calls on teardown.
 */
export abstract class Stage {
  abstract readonly id: string

  /** Stage label shown in the storyboard navigator (e.g. navbar). */
  abstract readonly label: string

  /** Relative weight of the stage on the master timeline.
   *  A stage with weight 2 takes twice as much scroll distance as a
   *  stage with weight 1. Defaults to 1. */
  readonly weight: number = 1

  protected el: HTMLElement | null = null
  protected ctx: StageContext | null = null

  mount(el: HTMLElement) {
    this.el = el
  }

  abstract build(ctx: StageContext): void

  destroy(): void {
    this.el = null
    this.ctx = null
  }
}
