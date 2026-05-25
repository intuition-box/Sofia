/**
 * StatBox — a row of headline numbers. Ported from the design
 * `StatBox`. `value` may contain inline `<em>` markup (e.g.
 * "~120<em>ms</em>"), so it is rendered as HTML like the design.
 */
export function StatBox({
  stats,
}: {
  stats: { value: string; label: string }[]
}) {
  return (
    <div className="stat-row">
      {stats.map((s, i) => (
        <div key={`${s.label}-${i}`} className="stat-box">
          <div
            className="v"
            dangerouslySetInnerHTML={{ __html: s.value }}
          />
          <div className="l">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
