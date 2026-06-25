/**
 * VoteButton — upvote control for a URL or tool, like the explorer's on-chain
 * vote (here mocked with local state). Up-chevron + count; stops propagation so
 * it works inside clickable rows/cards.
 */
import { useState } from 'react'

interface VoteButtonProps {
  base: number
  className?: string
}

export function VoteButton({ base, className }: VoteButtonProps) {
  const [on, setOn] = useState(false)
  return (
    <button
      type="button"
      className={`btn-vote btn-vote--sm${on ? ' on' : ''}${className ? ` ${className}` : ''}`}
      aria-pressed={on}
      aria-label={on ? 'Remove vote' : 'Vote'}
      onClick={(e) => {
        e.stopPropagation()
        setOn((v) => !v)
      }}
    >
      <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
      <span className="btn-vote-sep" />
      <span className="btn-vote-n">{base + (on ? 1 : 0)}</span>
    </button>
  )
}

/** Deterministic seed count so each item shows a stable vote tally. */
export function voteSeed(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return 3 + (h % 18)
}
