/**
 * NavAuthChip — the real connect / identity control at the top-left of the rail
 * (replaces the hardcoded "Sam Chauché" mock). Guests get a Connect chip (Privy
 * login); signed-in users see their real avatar + @handle with a sign-out menu.
 */
import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { avGrad, initials } from '../data/helpers'

export function NavAuthChip() {
  const { ready, authenticated, login, logout } = useAuth()
  const { profile, needsProfile } = useProfile()
  const [open, setOpen] = useState(false)

  if (!ready) return null

  // Guest — the primary login entry point.
  if (!authenticated) {
    return (
      <button
        type="button"
        className="ns-auth-chip ns-auth-chip--top"
        onClick={() => login()}>
        <span className="ns-auth-avatar ns-auth-avatar--fallback" style={{ background: avGrad(0) }}>
          +
        </span>
        <span className="ns-auth-meta">
          <span className="ns-auth-name">Connect</span>
          <span className="ns-auth-sub">Sign in to your workspace</span>
        </span>
      </button>
    )
  }

  // Authenticated but the pseudo gate hasn't resolved yet.
  if (needsProfile || !profile) {
    return (
      <div className="ns-auth-chip ns-auth-chip--top">
        <span className="ns-auth-avatar ns-auth-avatar--fallback" style={{ background: avGrad(0) }} />
        <span className="ns-auth-meta">
          <span className="ns-auth-name">Connecting…</span>
        </span>
      </div>
    )
  }

  return (
    <div className="ns-auth-wrap">
      <button
        type="button"
        className="ns-auth-chip ns-auth-chip--top"
        onClick={() => setOpen((o) => !o)}>
        <span className="ns-auth-avatar" style={{ background: avGrad(profile.avatarSeed) }}>
          {initials(profile.displayName)}
        </span>
        <span className="ns-auth-meta">
          <span className="ns-auth-name">{profile.displayName}</span>
          <span className="ns-auth-sub mono">@{profile.handle}</span>
        </span>
      </button>
      {open ? (
        <>
          <div className="ns-auth-backdrop" onClick={() => setOpen(false)} />
          <div className="ns-auth-menu">
            <button
              type="button"
              className="ns-auth-menu-item"
              onClick={() => {
                setOpen(false)
                logout()
              }}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
