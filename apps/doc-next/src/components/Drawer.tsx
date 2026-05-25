import { useEffect } from 'react'
import { Tree } from './Tree'
import { CloseIcon } from './icons'

/**
 * Mobile nav drawer — wraps the Tree. Opened by the navbar burger
 * at narrow widths. Esc + backdrop click close it; focus is not
 * trapped (single short list) but Esc support + a real close
 * button cover the a11y baseline the brief asks for.
 */
export function Drawer({
  open,
  onClose,
  activeId,
}: {
  open: boolean
  onClose: () => void
  activeId?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <button
        className="drawer-bd"
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <div className="drawer-panel" role="dialog" aria-label="Navigation">
        <div className="drawer-head">
          <div className="dnv-name">
            Sofia <em>Docs</em>
          </div>
          <button
            className="drawer-close"
            aria-label="Close"
            onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <Tree activeId={activeId} onNavigate={onClose} />
      </div>
    </div>
  )
}
