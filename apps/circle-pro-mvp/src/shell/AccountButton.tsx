/**
 * AccountButton — the real connect / identity control (Privy). Guests see
 * "Connect"; signed-in users see their handle + avatar with a sign-out menu.
 * This is the primary login entry point for the app.
 */
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { avGrad, initials } from '../data/helpers'

export function AccountButton() {
  const { ready, authenticated, login, logout } = useAuth()
  const { profile, needsProfile } = useProfile()
  const [open, setOpen] = useState(false)

  if (!ready) return null

  if (!authenticated) {
    return (
      <button className="btn btn-accent" onClick={() => login()}>
        Connect
      </button>
    )
  }

  // Authenticated but the pseudo gate hasn't resolved yet.
  if (needsProfile || !profile) {
    return (
      <button className="btn btn-sm" disabled>
        Connecting…
      </button>
    )
  }

  return (
    <div className="acct">
      <button className="acct-chip" onClick={() => setOpen((o) => !o)}>
        <span className="acct-av" style={{ background: avGrad(profile.avatarSeed) }}>
          {initials(profile.displayName)}
        </span>
        <span className="acct-name">{profile.displayName}</span>
      </button>
      {open ? (
        <>
          <div className="acct-backdrop" onClick={() => setOpen(false)} />
          <div className="acct-menu">
            <div className="acct-menu-id">
              <span className="acct-menu-name">{profile.displayName}</span>
              <span className="acct-menu-handle mono">@{profile.handle}</span>
            </div>
            <button
              className="acct-menu-item"
              onClick={() => {
                setOpen(false)
                logout()
              }}
            >
              <Icon name="x" /> Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
