/**
 * TeamMembers — the circle's REAL members. Profile + role from the backend;
 * Skills + Tools are claimed by each member and endorsed (voted) by others —
 * the counts are real. "Expertise" stays as a derived hint from shared tags.
 */
import { useState } from 'react'
import { Avatar } from '../components/primitives'
import { SkillTag } from '../components/Tag'
import { topicHue } from '../data/tagStyles'
import { useAuth } from '../hooks/useAuth'
import { useCircle } from '../hooks/useCircle'
import { useCircleMembers } from '../hooks/useCircleMembers'
import {
  inviteMember,
  addAttribute,
  endorseAttribute,
  type CircleMember,
  type MemberAttr,
} from '../services/circleProApi'
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
    if (!authenticated) return login()
    setBusy(true)
    try {
      await inviteMember(await token(), circleId, w)
      setWallet('')
      onInvited()
      toast('Member invited')
    } catch (e) {
      toast(/403/.test((e as Error).message) ? 'Only members can invite' : 'Could not invite — check the address')
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

/** A skill/tool chip — click to endorse / un-endorse. */
function AttrChip({ a, onToggle }: { a: MemberAttr; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`mattr${a.endorsedByMe ? ' on' : ''}`}
      title={a.endorsedByMe ? 'Remove your endorsement' : 'Endorse'}
      onClick={onToggle}>
      <span className="mattr-dot" style={{ background: a.color || (a.kind === 'TOOL' ? '#06b6d4' : '#8b5cf6') }} />
      {a.name}
      {a.count > 0 ? <b className="tnum">{a.count}</b> : null}
    </button>
  )
}

/** Inline "add a skill/tool" on your own card. */
function AddAttr({ kind, onAdd }: { kind: 'SKILL' | 'TOOL'; onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  if (!open) {
    return (
      <button type="button" className="mattr mattr-add" onClick={() => setOpen(true)}>
        ＋ {kind === 'TOOL' ? 'tool' : 'skill'}
      </button>
    )
  }
  const submit = () => {
    const n = name.trim()
    if (n) onAdd(n)
    setName('')
    setOpen(false)
  }
  return (
    <input
      className="mattr-input"
      autoFocus
      placeholder={kind === 'TOOL' ? 'Tool…' : 'Skill…'}
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={submit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') submit()
        if (e.key === 'Escape') setOpen(false)
      }}
    />
  )
}

function MemberCard({ m, mine, onChanged }: { m: CircleMember; mine: boolean; onChanged: () => void }) {
  const { token } = useAuth()
  const { circleId } = useCircle()

  const toggle = async (a: MemberAttr) => {
    try {
      await endorseAttribute(await token(), circleId, a.memberAttributeId, !a.endorsedByMe)
      onChanged()
    } catch {
      toast('Could not endorse')
    }
  }
  const add = async (kind: 'SKILL' | 'TOOL', name: string) => {
    try {
      await addAttribute(await token(), circleId, kind, name)
      onChanged()
    } catch {
      toast('Could not add')
    }
  }

  const name = m.profile?.displayName ?? shortWallet(m.wallet)
  const handle = m.profile?.handle ?? shortWallet(m.wallet)

  return (
    <div className="ccard">
      <div className="cc-body">
        <div className="cc-head">
          <Avatar m={{ handle, grad: m.profile?.avatarSeed ?? 0 }} size={40} />
          <div className="cc-h-wrap">
            <div className="cc-h">
              <span className="cc-name">{name}</span>
              <span className="cc-role">{m.role.toLowerCase()}</span>
            </div>
            <div className="cc-sub mono">{m.shareCount} shared</div>
          </div>
        </div>

        <dl className="cc-attrs">
          <div className="cc-attr">
            <dt>Skills</dt>
            <dd className="mattr-row">
              {m.skills.map((a) => (
                <AttrChip key={a.memberAttributeId} a={a} onToggle={() => toggle(a)} />
              ))}
              {mine ? <AddAttr kind="SKILL" onAdd={(n) => add('SKILL', n)} /> : null}
              {!m.skills.length && !mine ? <span className="cc-none">—</span> : null}
            </dd>
          </div>
          <div className="cc-attr">
            <dt>Tools</dt>
            <dd className="mattr-row">
              {m.tools.map((a) => (
                <AttrChip key={a.memberAttributeId} a={a} onToggle={() => toggle(a)} />
              ))}
              {mine ? <AddAttr kind="TOOL" onAdd={(n) => add('TOOL', n)} /> : null}
              {!m.tools.length && !mine ? <span className="cc-none">—</span> : null}
            </dd>
          </div>
          {m.expertise.length ? (
            <div className="cc-attr">
              <dt>Active in</dt>
              <dd>
                {m.expertise.map((c) => (
                  <SkillTag key={c.tagId} label={c.label} hue={topicHue(c.label)} count={c.count} />
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  )
}

export function TeamMembers() {
  const { wallet } = useAuth()
  const { members, loading, refresh } = useCircleMembers()
  const me = wallet?.toLowerCase() ?? null

  return (
    <div>
      <InviteBar onInvited={refresh} />
      {loading ? (
        <div className="tm-empty">Loading members…</div>
      ) : !members.length ? (
        <div className="tm-empty">No members in this circle yet.</div>
      ) : (
        <div className="ccard-grid tm-grid">
          {members.map((m) => (
            <MemberCard key={m.wallet} m={m} mine={m.wallet === me} onChanged={refresh} />
          ))}
        </div>
      )}
    </div>
  )
}
