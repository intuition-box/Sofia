/**
 * RadarHalfLabels — dashed horizontal divider + compass-style curved
 * kickers (`interests` on top, `intents` on bottom) rendered with SVG
 * `textPath` against a hidden arc so the text rides the rim.
 */
interface RadarHalfLabelsProps {
  cx: number
  cy: number
  outerR: number
  topLabel: string
  bottomLabel: string
}

export default function RadarHalfLabels({
  cx,
  cy,
  outerR,
  topLabel,
  bottomLabel,
}: RadarHalfLabelsProps) {
  const LABEL_R = outerR + 46
  // Both arcs run left→right: sweep=1 traces the top half, sweep=0 the
  // bottom half. At the mid-point the tangent points right, so glyphs
  // stand upright on the outside of the chart (`side="right"` on the
  // bottom textPath handles the otherwise-flipped orientation).
  const topArcPath =
    `M ${cx - LABEL_R} ${cy} ` +
    `A ${LABEL_R} ${LABEL_R} 0 0 1 ${cx + LABEL_R} ${cy}`
  const bottomArcPath =
    `M ${cx - LABEL_R} ${cy} ` +
    `A ${LABEL_R} ${LABEL_R} 0 0 0 ${cx + LABEL_R} ${cy}`
  const dividerX1 = cx - outerR - 18
  const dividerX2 = cx + outerR + 18
  return (
    <>
      <line
        x1={dividerX1}
        y1={cy}
        x2={dividerX2}
        y2={cy}
        stroke="currentColor"
        strokeOpacity={0.2}
        strokeDasharray="3 4"
        strokeWidth={1}
      />
      <defs>
        <path id="radar-arc-top" d={topArcPath} />
        <path id="radar-arc-bottom" d={bottomArcPath} />
      </defs>
      <text className="pc-radar-half-label">
        <textPath href="#radar-arc-top" startOffset="50%" textAnchor="middle">
          {topLabel}
        </textPath>
      </text>
      <text className="pc-radar-half-label">
        {/* `side="right"` is SVG 2 — supported in all evergreen browsers but
            not yet in @types/react's textPath props, hence the cast. */}
        <textPath
          href="#radar-arc-bottom"
          startOffset="50%"
          textAnchor="middle"
          {...({ side: 'right' } as { side: 'right' })}
        >
          {bottomLabel}
        </textPath>
      </text>
    </>
  )
}
