import { PREDICATES } from '~/data/predicates'

/**
 * The 8 predicates as a chip grid — Sofia's structural vocabulary,
 * shown as a real motif rather than decoration. Ported from the
 * design `PredGrid`.
 */
export function PredGrid() {
  return (
    <div className="preds">
      {PREDICATES.map((p) => (
        <div
          key={p.name}
          className="pred"
          style={{ ['--p-c' as string]: `var(--${p.name})` }}>
          <span
            className="dot"
            style={{ background: `var(--${p.name})` }}
          />
          <span className="name">{p.name}</span>
          <span className="hex">{p.hex}</span>
          <span className="desc">{p.desc}</span>
        </div>
      ))}
    </div>
  )
}
