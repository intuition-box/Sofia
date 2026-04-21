/**
 * WsStatusBadge — small discreet indicator shown in the bottom-right
 * when the realtime WebSocket has been offline for a grace period. The
 * HTTP fallback takes over around the same time, so this badge tells
 * the user "updates are slower than usual" rather than "the app is
 * broken".
 */

import { useSyncExternalStore, useEffect, useState } from 'react'
import { getWsStatus, subscribeWsStatus } from '@/lib/realtime/wsStatus'

const SHOW_AFTER_MS = 10_000

export default function WsStatusBadge() {
  const status = useSyncExternalStore(subscribeWsStatus, getWsStatus, getWsStatus)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (status.status === 'connected' || status.status === 'idle') {
      setVisible(false)
      return
    }
    const since = status.lastDisconnectedAt || Date.now()
    const elapsed = Date.now() - since
    if (elapsed >= SHOW_AFTER_MS) {
      setVisible(true)
      return
    }
    const t = setTimeout(() => setVisible(true), SHOW_AFTER_MS - elapsed)
    return () => clearTimeout(t)
  }, [status.status, status.lastDisconnectedAt])

  if (!visible) return null

  const label =
    status.status === 'error' ? 'Realtime error' :
    status.status === 'offline' ? 'Reconnecting…' :
    'Connecting…'

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 9999,
        padding: '6px 10px',
        borderRadius: 999,
        fontSize: 12,
        background: 'rgba(31, 31, 31, 0.9)',
        color: '#f0b36e',
        border: '1px solid rgba(240, 179, 110, 0.4)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        pointerEvents: 'none',
      }}
      title={status.lastError ?? label}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#f0b36e',
          boxShadow: '0 0 6px #f0b36e',
          animation: 'ws-badge-pulse 1.4s infinite',
        }}
      />
      {label}
      <style>{`
        @keyframes ws-badge-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  )
}
