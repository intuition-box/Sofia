/**
 * Tag — the local tag design system (see data/tagStyles.ts for the source of
 * truth). One component per family; Role/Domain/Skill/Tool can carry an optional
 * vote affordance (chevron + count) — pass `count` to show it, omit it for a
 * display-only tag.
 *
 * Colours come straight from tagStyles.ts (the app-local tag palette), NOT from
 * the shared design-system tokens — these tags must look identical on any page
 * background, light or dark.
 */
import { useState, type ReactNode } from 'react'
import {
  TAG_HUES,
  TAG_NEUTRAL,
  TAG_DOMAIN_INK,
  deptHue,
  topicHue,
  topicGlyph,
  type DomainIconName,
  type TagHueName,
} from '../data/tagStyles'

/* ── Inline glyphs (exact paths from the Tag Styles sheet) ─────────────── */
type GlyphName = 'users' | 'user' | 'award' | DomainIconName

export function TagIcon({ name, color, size = 14 }: { name: GlyphName; color: string; size?: number }) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (name) {
    case 'users':
      return (
        <svg {...p}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'user':
      return (
        <svg {...p}>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    case 'award':
      return (
        <svg {...p}>
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      )
    case 'growth':
      return (
        <svg {...p}>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      )
    case 'async':
      return (
        <svg {...p}>
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 16h5v5" />
        </svg>
      )
    case 'funding':
      return (
        <svg {...p}>
          <circle cx="8" cy="8" r="6" />
          <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
          <path d="M7 6h1v4" />
          <path d="m16.71 13.88.7.71-2.82 2.82" />
        </svg>
      )
  }
}

/* ── Shared vote affordance — chevron + count. Default: inline chevron+count in
   muted "off" colours. Voted: becomes a full-height segment attached to the
   right edge (rounded-left) with a solid `segBg` fill + `segInk` content, +1. ── */
function TagVote({
  count,
  on,
  onToggle,
  offChev,
  offNum,
  segBg,
  segInk,
}: {
  count: number
  on: boolean
  onToggle: () => void
  offChev: string
  offNum: string
  segBg: string
  segInk: string
}) {
  return (
    <button
      type="button"
      className={`tag-vote${on ? ' on' : ''}`}
      aria-pressed={on}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      style={on ? { background: segBg } : undefined}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill={on ? segInk : 'none'}
        stroke={on ? segInk : offChev}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
      <span className="tag-vote-n" style={{ color: on ? segInk : offNum }}>
        {count + (on ? 1 : 0)}
      </span>
    </button>
  )
}

/* ── The five families (vote is optional via `count`) ──────────────────── */

export function DeptTag({ label, hue }: { label: string; hue: TagHueName }) {
  const h = TAG_HUES[hue]
  // Dept = solid VIVID fill + white text + white icon (per the Tag Hierarchy
  // Nordic sheet: Marketing #B08968 on white). Square radius, no vote.
  return (
    <span className="tag tag--dept" style={{ background: h.vivid }}>
      <TagIcon name="users" color="#fff" />
      {label}
    </span>
  )
}

/** Dept tag from a free-text department name (resolves the hue). */
export function DeptTagByName({ name }: { name: string }) {
  return <DeptTag label={name} hue={deptHue(name)} />
}

export function RoleTag({ label, hue }: { label: string; hue: TagHueName }) {
  // Roles are no longer votable (updated Nordic sheet) — soft tint, display only.
  const h = TAG_HUES[hue]
  return (
    <span className="tag tag--role" style={{ background: h.tint, color: h.deep }}>
      <TagIcon name="user" color={h.vivid} />
      {label}
    </span>
  )
}

export function DomainTag({
  label,
  hue,
  icon,
  count,
}: {
  label: string
  hue: TagHueName
  icon?: ReactNode
  count?: number
}) {
  const h = TAG_HUES[hue]
  const [on, setOn] = useState(false)
  // Voted: the label keeps its vivid fill; only the vote chip becomes a dark
  // segment (`deep` + white) attached to the right edge.
  return (
    <span className={`tag tag--domain${on ? ' tag--voted' : ''}`} style={{ background: h.vivid, color: TAG_DOMAIN_INK }}>
      {icon}
      {label}
      {count != null ? (
        <TagVote
          count={count}
          on={on}
          onToggle={() => setOn((v) => !v)}
          offChev="rgba(0,0,0,.4)"
          offNum="rgba(0,0,0,.62)"
          segBg={h.deep}
          segInk="#fff"
        />
      ) : null}
    </span>
  )
}

/** Material Symbol glyph for a topic (always resolves, unlike the taxonomy). */
export function TopicGlyph({ id }: { id: string }) {
  return (
    <span className="topic-ms material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden="true">
      {topicGlyph(id)}
    </span>
  )
}

/** Domain tag from a topic id/label (always carries an icon + resolves the hue). */
export function DomainTagByTopic({ id, label, count }: { id: string; label: string; count?: number }) {
  return <DomainTag label={label} hue={topicHue(id)} count={count} icon={<TopicGlyph id={id} />} />
}

export function SkillTag({ label, hue, count }: { label: string; hue: TagHueName; count?: number }) {
  const h = TAG_HUES[hue]
  const [on, setOn] = useState(false)
  // Voted: pill stays white/outline; only the vote chip fills with the vivid hue.
  return (
    <span className={`tag tag--skill${on ? ' tag--voted' : ''}`} style={{ borderColor: h.soft, color: h.deep }}>
      <TagIcon name="award" color={h.vivid} />
      {label}
      {count != null ? (
        <TagVote count={count} on={on} onToggle={() => setOn((v) => !v)} offChev={h.soft} offNum={h.softNum} segBg={h.vivid} segInk="#fff" />
      ) : null}
    </span>
  )
}

export function ToolTag({ label, logo, count }: { label: string; logo: string; count?: number }) {
  const n = TAG_NEUTRAL
  const [on, setOn] = useState(false)
  // Voted: white pill stays; only the vote chip fills with the brand accent + ink.
  return (
    <span className={`tag tag--tool${on ? ' tag--voted' : ''}`}>
      <img className="tag-logo" src={logo} alt="" loading="lazy" />
      {label}
      {count != null ? (
        <TagVote count={count} on={on} onToggle={() => setOn((v) => !v)} offChev={n.soft} offNum={n.softNum} segBg="var(--ds-accent)" segInk="#02000e" />
      ) : null}
    </span>
  )
}
