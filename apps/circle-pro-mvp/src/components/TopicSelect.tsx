/**
 * TopicSelect — a custom dropdown over the real Sofia topic taxonomy (emoji +
 * accent color per topic), the same vocabulary the explorer uses. Built as a
 * popover (not a native <select>) so it can carry color + emoji and designed
 * hover/active states.
 */
import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, CATEGORY_MAP } from '../data/topics'
import { Icon } from './Icon'
import { TopicIcon } from './TopicIcon'

interface TopicSelectProps {
  value: string | null
  onChange: (id: string) => void
  placeholder?: string
}

export function TopicSelect({ value, onChange, placeholder = 'Pick a topic' }: TopicSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const sel = value ? CATEGORY_MAP[value] : null

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={`tsel${open ? ' open' : ''}`} ref={ref}>
      <button
        type="button"
        className={`tsel-btn${sel ? ' has-value' : ''}`}
        style={sel ? { ['--c' as string]: sel.color } : undefined}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {sel ? (
          <>
            <TopicIcon id={sel.id} size={16} />
            <span className="tsel-label">{sel.label}</span>
          </>
        ) : (
          <span className="tsel-ph">{placeholder}</span>
        )}
        <svg className="tsel-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="tsel-menu" role="listbox">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={value === c.id}
              className={`tsel-opt${value === c.id ? ' on' : ''}`}
              style={{ ['--c' as string]: c.color }}
              onClick={() => {
                onChange(c.id)
                setOpen(false)
              }}
            >
              <span className="tsel-dot" />
              <TopicIcon id={c.id} size={16} />
              <span className="tsel-label">{c.label}</span>
              {value === c.id ? <span className="tsel-check"><Icon name="check" /></span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
