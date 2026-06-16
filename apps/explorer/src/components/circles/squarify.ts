/**
 * squarify — squarified treemap layout (Bruls, Huizing & van Wijk).
 *
 * Pure, dependency-free port of the prototype's `squarify` from
 * `design_handoff_circle_free/circle/ExpertiseMap.jsx`. Lays out a list of
 * weighted items into rectangles that tile the box `(X, Y, W, H)` exactly,
 * each cell's area proportional to its `value`, keeping aspect ratios as
 * close to square as the algorithm allows.
 *
 * Items are expected to be pre-sorted by `value` descending for the best
 * (most square) layout — the algorithm is correct for any order, but the
 * classic squarified result assumes a descending feed.
 */

/** An input item: any object carrying a numeric `value` (the cell weight). */
export interface SquarifyItem {
  value: number
}

/** A laid-out cell: the original item fields plus its rectangle. */
export type SquarifiedCell<T extends SquarifyItem> = T & {
  x: number
  y: number
  w: number
  h: number
}

/** Internal working cell — the item with its scaled target area. */
type AreaItem<T extends SquarifyItem> = T & { area: number }

/**
 * Lay `items` out inside the box at `(X, Y)` sized `W × H`.
 *
 * @param items Weighted items (carry a numeric `value`); empty / non-positive
 *   total or a zero-area box yields `[]`.
 * @returns One cell per input item, in feed order, each with `x/y/w/h`.
 */
export function squarify<T extends SquarifyItem>(
  items: readonly T[],
  X: number,
  Y: number,
  W: number,
  H: number,
): SquarifiedCell<T>[] {
  const total = items.reduce((s, i) => s + i.value, 0)
  if (total <= 0 || W <= 0 || H <= 0 || items.length === 0) return []

  const scale = (W * H) / total
  const data: AreaItem<T>[] = items.map((i) => ({
    ...i,
    area: i.value * scale,
  }))
  // Working cells still carry `area`; it's stripped on return.
  const out: (AreaItem<T> & { x: number; y: number; w: number; h: number })[] =
    []

  let x = X
  let y = Y
  let w = W
  let h = H
  let row: AreaItem<T>[] = []
  let rowArea = 0
  const q = data.slice()

  const side = (): number => Math.min(w, h)

  // Worst aspect ratio of a row laid along the shorter side `s`.
  const worst = (r: AreaItem<T>[], area: number, s: number): number => {
    const max = Math.max(...r.map((it) => it.area))
    const min = Math.min(...r.map((it) => it.area))
    return Math.max(
      (s * s * max) / (area * area),
      (area * area) / (s * s * min),
    )
  }

  // Commit the current row as a column (when wide) or row (when tall),
  // then shrink the remaining box.
  const flush = (): void => {
    const s = rowArea
    if (w >= h) {
      const colW = s / h
      let cy = y
      for (const it of row) {
        const ch = it.area / colW
        out.push({ ...it, x, y: cy, w: colW, h: ch })
        cy += ch
      }
      x += colW
      w -= colW
    } else {
      const rowH = s / w
      let cx = x
      for (const it of row) {
        const cw = it.area / rowH
        out.push({ ...it, x: cx, y, w: cw, h: rowH })
        cx += cw
      }
      y += rowH
      h -= rowH
    }
    row = []
    rowArea = 0
  }

  while (q.length) {
    const it = q[0]
    if (row.length === 0) {
      row.push(it)
      rowArea += it.area
      q.shift()
      continue
    }
    const s = side()
    const cur = worst(row, rowArea, s)
    const nxt = worst(row.concat(it), rowArea + it.area, s)
    if (nxt <= cur) {
      row.push(it)
      rowArea += it.area
      q.shift()
    } else {
      flush()
    }
  }
  if (row.length) flush()

  // Strip the internal `area` field so callers see only their item + rect.
  return out.map(({ area: _area, ...rest }) => rest as SquarifiedCell<T>)
}
