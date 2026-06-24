/**
 * Localized gating + contextual join. The page is public by default; deeper
 * actions are gated. Joining once flips everything open — no hard paywall.
 *
 * Ported from the design's `circle-pro2/gate.jsx`, but the module-level flag
 * is exposed through `useSyncExternalStore` so React stays the source of
 * truth (instead of the original's `window` custom events).
 */
import {
  useSyncExternalStore,
  type ReactNode,
} from 'react'

let joined = false
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** Reason strings flow to the JoinModal via this callback (set by the modal). */
type GateHandler = (reason: string) => void
let gateHandler: GateHandler | null = null

export function onGate(handler: GateHandler): () => void {
  gateHandler = handler
  return () => {
    if (gateHandler === handler) gateHandler = null
  }
}

export function isJoined(): boolean {
  return joined
}

export function join(): void {
  joined = true
  emit()
}

/**
 * Run `onPass` if already joined, otherwise pop the contextual join modal
 * with `reason`. Returns whether the action was allowed through.
 */
export function requireJoin(reason: string, onPass?: () => void): boolean {
  if (joined) {
    onPass?.()
    return true
  }
  gateHandler?.(reason || 'go deeper')
  return false
}

/** Re-renders when the join state flips. */
export function useJoined(): boolean {
  return useSyncExternalStore(subscribe, isJoined, isJoined)
}

interface LockedProps {
  label?: string
  reason?: string
  minH?: number
  children: ReactNode
}

/** Blur-locks children behind a single "Join to unlock" veil until joined. */
export function Locked({ label, reason, minH, children }: LockedProps) {
  const isOpen = useJoined()
  if (isOpen) return <>{children}</>
  return (
    <div className="lk" style={minH ? { minHeight: minH } : undefined}>
      <div className="lk-blur" aria-hidden="true">
        {children}
      </div>
      <div className="lk-veil">
        <div className="lk-card">
          <span className="lk-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
              <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <span className="lk-label">{label || 'Members-only view'}</span>
          <button
            className="btn btn-accent btn-sm"
            onClick={() => requireJoin(reason || label || 'unlock this')}
          >
            Join to unlock
          </button>
        </div>
      </div>
    </div>
  )
}

interface GateBtnProps {
  reason: string
  className?: string
  onPass?: () => void
  children: ReactNode
}

/** A button that shows a lock chip until joined, then runs `onPass`. */
export function GateBtn({ reason, className, onPass, children }: GateBtnProps) {
  const isOpen = useJoined()
  return (
    <button
      className={`${className || 'btn btn-sm'}${isOpen ? '' : ' is-gated'}`}
      onClick={() => requireJoin(reason, onPass)}
    >
      {!isOpen ? (
        <span className="gate-lock" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
      ) : null}
      {children}
    </button>
  )
}
