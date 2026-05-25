import { Link } from 'react-router-dom'

export interface PagerLink {
  label: string
  to: string
}

/**
 * Prev / next pager — ported from the design `Pager`, wired to
 * React Router so it walks the real tree's reading order.
 */
export function Pager({
  prev,
  next,
}: {
  prev?: PagerLink
  next?: PagerLink
}) {
  return (
    <nav className="pager" aria-label="Pagination">
      {prev ? (
        <Link to={prev.to}>
          <span className="ki">← Previous</span>
          <span className="ti">{prev.label}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link to={next.to} className="next">
          <span className="ki">Next →</span>
          <span className="ti">{next.label}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
