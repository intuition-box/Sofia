/**
 * `@site/src/components/docs/StatBox` — API-compatible with the old
 * Docusaurus component (`value`, `label`). Migrated MDX uses it
 * unchanged. Restyled on the design tokens (content.css).
 */
interface StatBoxProps {
  value: string
  label: string
}

export default function StatBox({ value, label }: StatBoxProps) {
  return (
    <div className="mdoc-stat">
      <div className="mdoc-stat-value">{value}</div>
      <div className="mdoc-stat-label">{label}</div>
    </div>
  )
}
