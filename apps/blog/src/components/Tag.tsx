import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Tag as TagModel } from '~/lib/types'
import { tagColorVar } from '~/lib/tags'
import styles from './Tag.module.css'

interface TagProps {
  tag: TagModel
  /** `xs` is the dense variant used inside post cards. */
  size?: 'xs'
  /** Optional post count rendered after the label (tag cloud). */
  count?: number
}

/**
 * Tag — the mono "scent" chip. Shows the short tag id (e.g. `ai-agents`)
 * tinted with the tag's intent color, linking to its filter page.
 * Safe to place inside a stretched-link card (it's an anchor that sits
 * above the card's ::after overlay via z-index).
 */
export function Tag({ tag, size, count }: TagProps) {
  const className = `${styles.tag} ${size === 'xs' ? styles.xs : ''}`
  const style = { '--tag-c': tagColorVar(tag.id) } as CSSProperties
  return (
    <Link to={`/tags/${tag.id}`} className={className} style={style}>
      <span className={styles.dot} aria-hidden="true" />
      {tag.id}
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </Link>
  )
}
