/**
 * Small shared UI primitives. Ported from `circle/components.jsx`.
 */
import type { ReactNode } from 'react'
import { avGrad, initials } from '../data/helpers'
import { TOPIC_MAP } from '../data/mock'
import type { Availability, MemberState } from '../data/types'

interface AvatarSource {
  handle: string
  grad: number
}

interface AvatarProps {
  m: AvatarSource
  size?: number
  sq?: boolean
}

export function Avatar({ m, size = 32, sq = false }: AvatarProps) {
  return (
    <span
      className={sq ? 'av av-sq' : 'av'}
      style={{
        width: size,
        height: size,
        background: avGrad(m.grad),
        fontSize: Math.round(size * 0.36),
      }}
      title={m.handle}
    >
      {initials(m.handle)}
    </span>
  )
}

export function ThemeTag({ id }: { id: string }) {
  const t = TOPIC_MAP[id]
  if (!t) return null
  return (
    <span
      className="pio-theme"
      style={{
        background: `color-mix(in srgb, ${t.color} 16%, transparent)`,
        color: t.color,
      }}
    >
      {t.label}
    </span>
  )
}

interface ModuleHeadProps {
  title: string
  desc?: string
  children?: ReactNode
}

export function ModuleHead({ title, desc, children }: ModuleHeadProps) {
  return (
    <div className="module-head">
      <div className="module-head-row">
        <h2 className="module-title">{title}</h2>
        {children}
      </div>
      {desc ? <p className="module-desc">{desc}</p> : null}
    </div>
  )
}

const STATE_META: Record<MemberState, { cls: string; label: string }> = {
  aligned: { cls: 'state-aligned', label: 'Signal-aligned' },
  active: { cls: 'state-active', label: 'Active' },
  low: { cls: 'state-low', label: 'Low-signal' },
}

export function StatePill({ state }: { state: MemberState }) {
  const s = STATE_META[state]
  return (
    <span className={`state-pill ${s.cls}`}>
      <i />
      {s.label}
    </span>
  )
}

const AVAIL_META: Record<Availability, { cls: string; label: string }> = {
  active: { cls: 'avail-active', label: 'Active' },
  quiet: { cls: 'avail-quiet', label: 'Quiet' },
  inactive: { cls: 'avail-inactive', label: 'Inactive' },
}

export function Avail({ a }: { a: Availability }) {
  const m = AVAIL_META[a]
  return (
    <span className={`avail ${m.cls}`}>
      <i />
      {m.label}
    </span>
  )
}
