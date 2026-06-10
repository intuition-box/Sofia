/**
 * TopBar — persistent top-right account cluster: notifications bell + user menu.
 * Pinned above everything (independent of the page-specific right rails, which
 * come and go), so the account control is always reachable — the standard SaaS
 * placement. Hidden on mobile (MobileHeader owns that chrome).
 */
import NotificationsBell from './NotificationsBell'
import UserMenu from './UserMenu'
import './styles/group-join.css'

export default function TopBar() {
  return (
    <div className="gj-topbar">
      <NotificationsBell />
      <UserMenu />
    </div>
  )
}
