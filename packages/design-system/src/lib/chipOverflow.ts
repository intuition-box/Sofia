// Single-line chip overflow — presentational layout infrastructure shared by
// the explorer feed card and the extension context pills. Headless on purpose:
// each app keeps its own markup/CSS classes and only borrows the measurement.
import { useLayoutEffect, useRef, useState } from 'react'
import type { DependencyList, RefObject } from 'react'

/**
 * Pure core of the overflow: given the vertical offset of every chip in a
 * hidden, wrap-allowed mirror, return how many chips fit on the FIRST line.
 *
 * One slot is reserved for the trailing "+N" badge whenever anything overflows,
 * so the badge itself always lands on the first line.
 *
 *   [0,0,0]        → 3   (all on one line, nothing hidden)
 *   [0,0,18,18]    → 1   (chip 3 wrapped → show 2-minus-1 = 1, badge takes a slot)
 *   [0,18,18]      → 1   (only the first chip fits; never drop below 1)
 *
 * @param offsetTops `offsetTop` of each chip, in document order.
 */
export function computeChipsShown(offsetTops: readonly number[]): number {
  const total = offsetTops.length
  if (total === 0) return 0
  const top0 = offsetTops[0]
  let firstLine = total
  for (let i = 1; i < total; i++) {
    // +1 tolerance for sub-pixel baseline jitter.
    if (offsetTops[i] > top0 + 1) {
      firstLine = i
      break
    }
  }
  return firstLine >= total ? total : Math.max(1, firstLine - 1)
}

/**
 * Glitch-free single-line chip overflow.
 *
 * Render TWO rows sharing the same chip set:
 *  - a hidden "mirror" row (`ref={mirrorRef}`, wrap allowed) whose chips each
 *    carry `data-chip="1"` and which holds ALL chips;
 *  - a visible row that renders only `chips.slice(0, shown)` followed by a
 *    "+N" badge for the remainder.
 *
 * The mirror is measured in `useLayoutEffect` (synchronously, before paint) and
 * re-measured on resize, so the visible row never flashes a wrapped line.
 *
 * @param total number of chips in the set.
 * @param deps  extra deps that should force a re-measure when the chip CONTENT
 *              changes without the count changing (e.g. labels differ).
 */
export function useChipOverflow(
  total: number,
  deps: DependencyList = [],
): { mirrorRef: RefObject<HTMLDivElement>; shown: number } {
  const mirrorRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(total)

  useLayoutEffect(() => {
    const el = mirrorRef.current
    if (!el || total === 0) return
    const measure = () => {
      const slots = Array.from(
        el.querySelectorAll<HTMLElement>('[data-chip="1"]'),
      )
      if (slots.length === 0) return
      setShown(computeChipsShown(slots.map((s) => s.offsetTop)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, ...deps])

  return { mirrorRef, shown }
}

export interface TooltipAnchor {
  top: number
  left: number
}

/**
 * Anchored hover tooltip state for the "+N" overflow badge. Returns the anchor
 * point (top-center of the badge, in viewport coords) plus open/close handlers;
 * the caller renders the tooltip itself (via a portal) with its own styling.
 */
export function useAnchoredTooltip(): {
  anchor: TooltipAnchor | null
  openFrom: (rect: DOMRect) => void
  close: () => void
} {
  const [anchor, setAnchor] = useState<TooltipAnchor | null>(null)
  return {
    anchor,
    openFrom: (rect: DOMRect) =>
      setAnchor({ left: rect.left + rect.width / 2, top: rect.top }),
    close: () => setAnchor(null),
  }
}
