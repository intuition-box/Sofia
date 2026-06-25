/**
 * TeamMembers — the circle's REAL members (replaces the mock MEMBERS_V2 cards).
 * Profile + role come from the backend; "Expertise" is derived from the taxonomy
 * tags each member has shared in the circle. Trust/influence/tools had no real
 * source and were dropped until a backend exists for them.
 */
import { Avatar } from '../components/primitives'
import { SkillTag } from '../components/Tag'
import { topicHue } from '../data/tagStyles'
import { useCircleMembers } from '../hooks/useCircleMembers'

const shortWallet = (w: string) => `${w.slice(0, 6)}…${w.slice(-4)}`

export function TeamMembers() {
  const { members, loading } = useCircleMembers()

  if (loading) return <div className="tm-empty">Loading members…</div>
  if (!members.length) {
    return <div className="tm-empty">No members in this circle yet.</div>
  }

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
