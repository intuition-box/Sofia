/**
 * ProfileGate — identity bootstrap. Appears once a user authenticates with no
 * profile yet (`needsProfile`).
 *
 * First it tries to AUTO-ADOPT the wallet's ENS: resolve `alice.eth`, derive a
 * handle, and create the profile silently — no typing. The manual form only
 * shows when there's no ENS, or the derived handle collides (then it's
 * pre-filled). So crypto-native users (all our first ones) sail straight in.
 */
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { resolveEnsName, handleFromEns } from '../lib/ens'
import { toast } from '../lib/toast'

const HANDLE_RE = /^[a-z0-9_]{3,20}$/

export function ProfileGate() {
  const { needsProfile, createProfile, creating, checkHandle } = useProfile()
  const { addresses, logout } = useAuth()

  // 'resolving' = trying ENS auto-adopt; 'form' = manual fallback.
  const [phase, setPhase] = useState<'resolving' | 'form'>('resolving')
  const [handle, setHandle] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avail, setAvail] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle')
  const [error, setError] = useState<string | null>(null)
  const checkSeq = useRef(0)
  const tried = useRef(false)

  const valid = HANDLE_RE.test(handle)

  // ── ENS auto-adopt (runs once when the gate becomes needed) ──
  useEffect(() => {
    if (!needsProfile || tried.current) return
    tried.current = true
    ;(async () => {
      const ens = addresses.length ? await resolveEnsName(addresses) : null
      if (!ens) {
        setPhase('form')
        return
      }
      const derived = handleFromEns(ens)
      try {
        const { available } = await checkHandle(derived)
        if (available && HANDLE_RE.test(derived)) {
          await createProfile({ handle: derived, displayName: ens })
          toast(`Welcome, ${ens}`)
          return // needsProfile flips false → the gate unmounts
        }
      } catch {
        /* fall through to the pre-filled form */
      }
      // No ENS handle available — let the user adjust.
      setHandle(derived)
      setDisplayName(ens)
      setPhase('form')
    })()
  }, [needsProfile, addresses, checkHandle, createProfile])

  // ── Debounced availability check for the manual form ──
  useEffect(() => {
    if (phase !== 'form') return
    if (!valid) {
      setAvail('idle')
      return
    }
    setAvail('checking')
    const seq = ++checkSeq.current
    const timer = setTimeout(async () => {
      try {
        const { available } = await checkHandle(handle)
        if (seq === checkSeq.current) setAvail(available ? 'ok' : 'taken')
      } catch {
        if (seq === checkSeq.current) setAvail('idle')
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [handle, valid, phase, checkHandle])

  if (!needsProfile) return null

  const submit = async () => {
    if (!valid || avail === 'taken' || creating) return
    setError(null)
    try {
      await createProfile({ handle, displayName: displayName.trim() || undefined })
      toast(`Welcome, @${handle}`)
    } catch (e) {
      setError((e as Error).message || 'Could not create your profile')
    }
  }

  return (
    <div className="dec-modal-overlay">
      <div className="dec-modal join-modal" onClick={(e) => e.stopPropagation()}>
        {phase === 'resolving' ? (
          <div className="pg-resolving">
            <span className="pg-spinner" aria-hidden="true" />
            <h3 className="join-title">Setting up your identity…</h3>
            <p className="join-sub">Checking your wallet for an ENS name.</p>
          </div>
        ) : (
          <>
            <span className="join-eyebrow mono">Acme workspace</span>
            <h3 className="join-title">Choose your handle</h3>
            <p className="join-sub">
              This is how the team sees you across bookmarks and comments — no
              wallet address, just a name.
            </p>

            <label className="pg-field">
              <span className="pg-lab mono">Handle</span>
              <div className="pg-input-wrap">
                <span className="pg-at">@</span>
                <input
                  className="pg-input"
                  value={handle}
                  autoFocus
                  placeholder="yourname"
                  onChange={(e) =>
                    setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                  }
                  maxLength={20}
                />
                {valid ? (
                  <span className={`pg-avail pg-avail--${avail}`}>
                    {avail === 'checking'
                      ? '…'
                      : avail === 'ok'
                        ? 'available'
                        : avail === 'taken'
                          ? 'taken'
                          : ''}
                  </span>
                ) : null}
              </div>
              <span className="pg-hint mono">3–20 chars · a–z, 0–9, _</span>
            </label>

            <label className="pg-field">
              <span className="pg-lab mono">Display name (optional)</span>
              <input
                className="pg-input pg-input--plain"
                value={displayName}
                placeholder="Your name or alice.eth"
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
              />
            </label>

            {error ? <p className="pg-error">{error}</p> : null}

            <div className="join-actions">
              <button
                className="btn btn-accent"
                disabled={!valid || avail === 'taken' || avail === 'checking' || creating}
                onClick={submit}
              >
                {creating ? 'Creating…' : 'Continue'}
              </button>
              <button className="btn" onClick={() => logout()}>
                <Icon name="x" /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
