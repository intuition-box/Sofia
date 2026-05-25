import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TREE } from '~/data/tree'
import { docPath } from '~/lib/paths'
import type { TreeItem } from '~/lib/types'
import { ChevronIcon } from './icons'

/**
 * Left sidebar nav — ported from the design `Tree`, driven by the
 * REAL Sofia content tree (`~/data/tree`, 1:1 with the Docusaurus
 * sidebars.ts), wired to React Router. Sections collapse; the
 * predicate color makes "which section am I in?" answerable in one
 * glance. Nested `items` render as an indented sub-tree.
 */
function TreeItemLink({
  item,
  activeId,
  sectionColor,
  onNavigate,
}: {
  item: TreeItem
  activeId?: string
  sectionColor: string
  onNavigate?: () => void
}) {
  const tagC = item.tag ? `var(--${item.tag})` : sectionColor
  const isActive = item.id === activeId

  return (
    <>
      <Link
        to={docPath(item.id)}
        onClick={onNavigate}
        className={`tree-item ${isActive ? 'active' : ''}`}
        aria-current={isActive ? 'page' : undefined}
        style={{ ['--ti-c' as string]: tagC }}>
        {item.tag && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 50,
              background: tagC,
              flexShrink: 0,
            }}
          />
        )}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
          {item.label}
        </span>
        {item.badge && (
          <span className={`badge ${item.badge}`}>{item.badge}</span>
        )}
      </Link>
      {item.items && item.items.length > 0 && (
        <div className="tree-sub">
          {item.items.map((sub) => (
            <TreeItemLink
              key={sub.id}
              item={sub}
              activeId={activeId}
              sectionColor={sectionColor}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </>
  )
}

function TreeSectionBlock({
  sectionId,
  title,
  color,
  items,
  activeId,
  onNavigate,
}: {
  sectionId: string
  title: string
  color: string
  items: TreeItem[]
  activeId?: string
  onNavigate?: () => void
}) {
  const containsActive = items.some(
    (it) =>
      it.id === activeId || it.items?.some((s) => s.id === activeId),
  )
  const [open, setOpen] = useState(true)
  const c = `var(--${color})`

  return (
    <div className="tree-section">
      <button
        type="button"
        className={`tree-title ${open ? 'open' : ''}`}
        style={{ ['--ts-c' as string]: c }}
        aria-expanded={open}
        aria-controls={`tree-sec-${sectionId}`}
        onClick={() => setOpen((v) => !v)}>
        <span className="dot" />
        <span>{title}</span>
        <span className="num">
          {String(items.length).padStart(2, '0')}
        </span>
        <ChevronIcon />
      </button>
      {(open || containsActive) && (
        <div id={`tree-sec-${sectionId}`}>
          {items.map((it) => (
            <TreeItemLink
              key={it.id}
              item={it}
              activeId={activeId}
              sectionColor={c}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Tree({
  activeId,
  onNavigate,
}: {
  activeId?: string
  onNavigate?: () => void
}) {
  return (
    <aside className="tree" aria-label="Documentation navigation">
      {TREE.map((section) => (
        <TreeSectionBlock
          key={section.id}
          sectionId={section.id}
          title={section.title}
          color={section.color}
          items={section.items}
          activeId={activeId}
          onNavigate={onNavigate}
        />
      ))}
    </aside>
  )
}
