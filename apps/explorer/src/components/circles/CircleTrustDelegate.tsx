/**
 * CircleTrustDelegate — the Pro "delegate trust" control (circle/Expertise.jsx
 * TrustDelegate, 29-78). Pick one or more of a member's domains, choose a TRUST
 * stake, confirm. The on-chain per-domain staking flow isn't defined yet, so
 * confirm fires `onStake` (optimistic backing bump) + a toast.
 */
import { useState } from 'react'
import { Icon, toast } from '@0xsofia/design-system'
import type { MemberDomain } from '@/types/circlePro'

const PRESETS = [25, 50, 100, 250]

interface CircleTrustDelegateProps {
  handle: string
  /** The member's trustable domains (label/color/level resolved). */
  domains: MemberDomain[]
  /** Pre-selected domain slug (the currently-scoped topic), if any. */
  activeDomain?: string | null
  /** Fired on confirm with the chosen domain slugs + stake amount. */
  onStake?: (slugs: string[], amount: number) => void
  onDone?: () => void
}

export default function CircleTrustDelegate({
  handle,
  domains,
  activeDomain,
  onStake,
  onDone,
}: CircleTrustDelegateProps) {
  const [sel, setSel] = useState<string[]>(activeDomain ? [activeDomain] : [])
  const [stake, setStake] = useState(50)

  const toggle = (slug: string) =>
    setSel((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]))

  const confirm = () => {
    if (!sel.length) return
    const names = sel
      .map((s) => domains.find((d) => d.slug === s)?.label ?? s)
      .join(', ')
    onStake?.(sel, stake)
    toast(`Staked ${stake} TRUST · you now trust ${handle} in ${names}`)
    setSel(activeDomain ? [activeDomain] : [])
    setStake(50)
    onDone?.()
  }

  return (
    <div className="mem-trust">
      <p className="drill-col-title">Delegate trust — pick one or more domains</p>
      <div className="trust-chips">
        {domains.map((d) => {
          const on = sel.includes(d.slug)
          return (
            <button
              key={d.slug}
              type="button"
              className={on ? 'trust-chip on' : 'trust-chip'}
              style={
                on
                  ? {
                      background: `color-mix(in srgb, ${d.color} 22%, transparent)`,
                      borderColor: d.color,
                      color: 'var(--ds-ink)',
                    }
                  : undefined
              }
              onClick={() => toggle(d.slug)}>
              <i className="dot" style={{ background: d.color }} />
              {d.label}
              <b className="tnum trust-chip-lvl">{d.level}</b>
              {on ? <span className="chk">✓</span> : null}
            </button>
          )
        })}
      </div>
      <div className="trust-stake">
        <span className="trust-stake-lab">Stake</span>
        <div className="stake-steps">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={stake === p ? 'stake-step on' : 'stake-step'}
              onClick={() => setStake(p)}>
              {p}
            </button>
          ))}
        </div>
        <span className="trust-stake-unit">TRUST</span>
      </div>
      <button
        type="button"
        className="btn btn-accent trust-confirm"
        onClick={confirm}
        disabled={!sel.length}
        style={!sel.length ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
        <Icon name="bolt" />{' '}
        {sel.length
          ? `Trust in ${sel.length} domain${sel.length > 1 ? 's' : ''} · ${stake} TRUST`
          : 'Select a domain to trust'}
      </button>
    </div>
  )
}
