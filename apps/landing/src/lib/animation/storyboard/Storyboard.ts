import { gsap, ScrollTrigger } from '../gsap'
import type { Stage, StageContext } from './Stage'

interface StoryboardOptions {
  /** Total scroll distance to budget per stage, in viewport heights.
   *  Multiplied by each stage's weight. Default 1. */
  vhPerStage?: number
  /** Smoothing applied to the scrub. Default 0.5. */
  scrub?: number | boolean
}

interface RegisteredStage {
  stage: Stage
  el: HTMLElement
  start: number
  end: number
}

/**
 * Storyboard — a single pinned container that hosts a list of
 * stages and drives their animations with one master timeline.
 *
 * Scroll progress is mapped 1:1 onto the master timeline. The
 * pin reserves vertical space (`vhPerStage * totalWeight * 100vh`)
 * so the rest of the page flows naturally below.
 *
 * Each stage gets a contiguous slot on the master timeline based
 * on its declared weight. A stage with weight 2 occupies twice
 * the scroll distance of a stage with weight 1.
 */
export class Storyboard {
  private container: HTMLElement
  private opts: Required<StoryboardOptions>
  private master: gsap.core.Timeline
  private trigger?: ScrollTrigger
  private registered: RegisteredStage[] = []

  constructor(container: HTMLElement, opts: StoryboardOptions = {}) {
    this.container = container
    this.opts = {
      vhPerStage: opts.vhPerStage ?? 1,
      scrub: opts.scrub ?? 0.5,
    }
    this.master = gsap.timeline({ paused: true })
  }

  /** Register a stage with the DOM root it animates. Must be called
   *  for every stage before {@link init}. */
  add(stage: Stage, el: HTMLElement) {
    stage.mount(el)
    this.registered.push({ stage, el, start: 0, end: 0 })
  }

  /** Build all stage timelines and wire the master ScrollTrigger.
   *  Idempotent — calling twice tears down and rebuilds. */
  init() {
    this.teardown()

    const totalWeight = this.registered.reduce(
      (sum, r) => sum + r.stage.weight,
      0,
    )
    if (totalWeight === 0) return

    /* Allocate timeline slots proportional to each stage's weight.
       Master timeline duration is normalised to totalWeight so each
       slot's start/end is in seconds == "weight units". */
    let cursor = 0
    this.registered.forEach((r, i) => {
      const duration = r.stage.weight
      const slot = {
        start: cursor,
        end: cursor + duration,
        duration,
      }
      r.start = slot.start
      r.end = slot.end

      const ctx: StageContext = {
        el: r.el,
        index: i,
        total: this.registered.length,
        master: this.master,
        slot,
      }
      r.stage.build(ctx)
      cursor += duration
    })

    /* Pin the storyboard container for vhPerStage * totalWeight viewports.
       Scrub ties scroll progress to master.progress. */
    const totalVh = this.opts.vhPerStage * totalWeight
    this.trigger = ScrollTrigger.create({
      trigger: this.container,
      start: 'top top',
      end: () => `+=${window.innerHeight * totalVh}`,
      pin: true,
      pinSpacing: true,
      scrub: this.opts.scrub,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: ({ progress }) => {
        this.master.progress(progress)
      },
    })
  }

  /** Seek to the start of a stage by id. */
  goTo(id: string) {
    const r = this.registered.find((x) => x.stage.id === id)
    if (!r || !this.trigger) return
    const totalDuration = this.master.duration()
    const fraction = r.start / totalDuration
    const scroll =
      this.trigger.start + (this.trigger.end - this.trigger.start) * fraction
    window.scrollTo({ top: scroll, behavior: 'smooth' })
  }

  /** Returns the list of stages with their progress windows for
   *  building a stage navigator (e.g. navbar tabs). */
  manifest() {
    const totalDuration = this.master.duration() || 1
    return this.registered.map((r) => ({
      id: r.stage.id,
      label: r.stage.label,
      start: r.start / totalDuration,
      end: r.end / totalDuration,
    }))
  }

  destroy() {
    this.teardown()
    this.registered.forEach((r) => r.stage.destroy())
    this.registered = []
  }

  private teardown() {
    this.trigger?.kill()
    this.trigger = undefined
    this.master.kill()
    this.master = gsap.timeline({ paused: true })
  }
}
