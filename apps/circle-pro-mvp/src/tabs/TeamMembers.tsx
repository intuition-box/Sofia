/**
 * TeamMembers — the circle's REAL members (replaces the mock MEMBERS_V2 cards).
 * Profile + role come from the backend; "Expertise" is derived from the taxonomy
 * tags each member has shared in the circle. Trust/influence/tools had no real
 * source and were dropped until a backend exists for them.
 */
import { useState } from 'react'
import { Avatar } from '../components/primitives'
import { SkillTag } from '../components/Tag'
import { topicHue } from '../data/tagStyles'
import { useAuth } from '../hooks/useAuth'
import { useCircle } from '../hooks/useCircle'
import { useCircleMembers } from '../hooks/useCircleMembers'
import { inviteMember } from '../services/circleProApi'
import { toast } from '../lib/toast'

const shortWallet = (w: string) => `${w.slice(0, 6)}…${w.slice(-4)}`

function InviteBar({ onInvited }: { onInvited: () => void }) {
  const { authenticated, token, login } = useAuth()
  const { circleId } = useCircle()
  const [wallet, setWallet] = useState('')
  const [busy, setBusy] = useState(false)

  const invite = async () => {
    const w = wallet.trim()
    if (!w || busy) return
    if (!authenticated) {
      login()
      return
    }
    setBusy(true)
    try {
      await inviteMember(await token(), circleId, w)
      setWallet('')
      onInvited()
      toast('Member invited')
    } catch (e) {
      const msg = /403/.test((e as Error).message) ? 'Only members can invite' : 'Could not invite — check the address'
      toast(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="tm-invite">
      <input
        className="tm-invite-input"
        placeholder="Invite a wallet address (0x…)"
        value={wallet}
        onChange={(e) => setWallet(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') invite()
        }}
      />
      <button type="button" className="btn btn-sm btn-accent" disabled={busy} onClick={invite}>
        {busy ? '…' : 'Invite'}
      </button>
    </div>
  )
}

export function TeamMembers() {
  const { members, loading, refresh } = useCircleMembers()

  return (
    <div>
      <InviteBar onInvited={refresh} />
      {loading ? (
        <div className="tm-empty">Loading members…</div>
      ) : !members.length ? (
        <div className="tm-empty">No members in this circle yet.</div>
      ) : (
        <MemberGrid members={members} />
      )}
    </div>
  )
}

function MemberGrid({ members }: { members: ReturnType<typeof useCircleMembers>['members'] }) {
  return (
    <div className="ccard-grid tm-grid">
      {members.map((m) => {
        const name = m.profile?.displayName ?? shortWallet(m.wallet)
        const handle = m.profile?.handle ?? shortWallet(m.wallet)
        const grad = m.profile?.avatarSeed ?? 0
        return (
          <div className="ccard" key={m.wallet}>
            <div className="cc-body">
              <div className="cc-head">
                <Avatar m={{ handle, grad }} size={40} />
                <div className="cc-h-wrap">
                  <div className="cc-h">
                    <span className="cc-name">{name}</span>
                    <span className="cc-role">{m.role.toLowerCase()}</span>
                  </div>
                  <div className="cc-sub mono">{m.shareCount} shared</div>
                </div>
              </div>

              {m.expertise.length ? (
                <dl className="cc-attrs">
                  <div className="cc-attr">
                    <dt>Expertise</dt>
                    <dd>
                      {m.expertise.map((c) => (
                        <SkillTag key={c.tagId} label={c.label} hue={topicHue(c.label)} count={c.count} />
                      ))}
                    </dd>
                  </div>
                </dl>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
