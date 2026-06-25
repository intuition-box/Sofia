// Circle (workspace) picker for the share modal — chooses which circle the page
// is shared into. Lists the caller's memberships (GET /me/circles); the
// selection scopes the POST. Labels are the group atom term_id (truncated) for
// now — a human name needs an atom-label lookup, deferred.
import { useState } from "react"

import type { CircleMembership } from "~lib/circle-pro/types"

function shortId(id: string): string {
  return id.length <= 13 ? id : `${id.slice(0, 8)}…${id.slice(-4)}`
}

interface CirclePickerProps {
  circles: CircleMembership[]
  value: string | null
  onChange: (groupTermId: string) => void
}

export function CirclePicker({ circles, value, onChange }: CirclePickerProps) {
  const [open, setOpen] = useState(false)
  const current = circles.find((c) => c.groupTermId === value)

  return (
    <div className="sis-circle">
      <button
        type="button"
        className="sis-circle-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}>
        <span className="sis-circle-dot" />
        <span className="sis-circle-label">
          {current ? shortId(current.groupTermId) : "Select a workspace"}
        </span>
        {current?.role ? (
          <span className="sis-circle-role">{current.role.toLowerCase()}</span>
        ) : null}
        <span className="sis-circle-caret">▾</span>
      </button>

      {open ? (
        <div className="sis-circle-menu" role="listbox">
          {circles.map((c) => (
            <button
              key={c.groupTermId}
              type="button"
              role="option"
              aria-selected={c.groupTermId === value}
              className={`sis-circle-item${c.groupTermId === value ? " active" : ""}`}
              onClick={() => {
                onChange(c.groupTermId)
                setOpen(false)
              }}>
              <span className="sis-circle-dot" />
              <span className="sis-circle-item-label">{shortId(c.groupTermId)}</span>
              <span className="sis-circle-role">{c.role.toLowerCase()}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
