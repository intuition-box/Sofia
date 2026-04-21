/**
 * WsStatusBadge — tiny pill in the top-right corner of the app, rendered
 * only when the realtime WS is not connected. Driven by useWsStatus which
 * reads the SW-side wsStatus snapshot via chrome.storage.onChanged.
 *
 * States:
 * - idle / connected → nothing rendered
 * - connecting       → amber "Connecting…"
 * - offline / error  → red "Offline — reconnecting…"
 */

import { useWsStatus } from "~/hooks"
import "../styles/WsStatusBadge.css"

const WsStatusBadge = () => {
  const { status, lastError } = useWsStatus()

  if (status === "idle" || status === "connected") return null

  const label =
    status === "connecting"
      ? "Connecting…"
      : "Offline — reconnecting…"

  const variant =
    status === "connecting" ? "connecting" : "offline"

  return (
    <div
      className={`ws-status-badge ws-status-badge--${variant}`}
      title={lastError ?? undefined}>
      <span className="ws-status-badge__dot" />
      <span className="ws-status-badge__label">{label}</span>
    </div>
  )
}

export default WsStatusBadge
