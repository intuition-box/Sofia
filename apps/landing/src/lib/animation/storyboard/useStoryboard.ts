import { useEffect, useRef } from 'react'
import { Storyboard } from './Storyboard'
import type { Stage } from './Stage'

interface UseStoryboardOptions {
  vhPerStage?: number
  scrub?: number | boolean
}

/**
 * Initialise a {@link Storyboard} on the given container ref. The
 * factory returns the list of stages and their DOM roots; this
 * hook handles register/init/destroy lifecycle.
 *
 * Usage:
 *   const containerRef = useRef<HTMLDivElement>(null)
 *   const heroRef = useRef<HTMLElement>(null)
 *   useStoryboard(containerRef, () => [
 *     { stage: new HeroStage(), el: heroRef.current! },
 *   ])
 */
export function useStoryboard(
  containerRef: React.RefObject<HTMLElement | null>,
  buildStages: () => { stage: Stage; el: HTMLElement }[],
  opts: UseStoryboardOptions = {},
) {
  const sbRef = useRef<Storyboard | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const stages = buildStages()
    if (stages.some((s) => !s.el)) return

    const sb = new Storyboard(container, opts)
    stages.forEach(({ stage, el }) => sb.add(stage, el))
    sb.init()
    sbRef.current = sb

    return () => {
      sb.destroy()
      sbRef.current = null
    }
    // buildStages is intentionally not in deps — it should be stable
    // across renders. Container ref is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return sbRef
}
