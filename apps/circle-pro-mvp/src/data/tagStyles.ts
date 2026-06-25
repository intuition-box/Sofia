/**
 * Tag Styles — LOCAL source of truth for every tag rendered in Sofia Pro:
 * departments, roles, domains, skills, tools. Ported from the Claude Design
 * "Tag Styles" sheet.
 *
 * IMPORTANT: this lives in the app only. It deliberately does NOT touch the
 * shared @0xsofia/design-system package — the colours below are the canonical
 * tag palette for the app and are kept here until we decide to promote them.
 *
 * Five families, one shared vote affordance (chevron + count) on all but Depts:
 *   - Dept   — solid vivid fill, white text + `users` icon, no vote
 *   - Role   — pastel tint, deep text + `user` icon (vivid), vote
 *   - Domain — solid vivid fill, ink text + per-domain icon, vote (ink chevron)
 *   - Skill  — white pill, soft border + deep text + `award` icon (vivid), vote
 *   - Tool   — white pill, neutral border + real favicon, vote
 */

export interface TagHue {
  /** Primary text + active vote-count colour. */
  deep: string
  /** Icon + active chevron colour; also the solid fill for Dept/Domain. */
  vivid: string
  /** Pastel background fill for Role tags. */
  tint: string
  /** Inactive chevron colour. */
  soft: string
  /** Inactive vote-count colour. */
  softNum: string
}

/** The six canonical hues + a neutral used by Tool tags.
 * Nordic palette (muted: fog blue · pine · tan · mauve · gold · slate) — the
 * earlier electric tones read too neon, so each hue is a soft base with a
 * derived ramp (deep=text, vivid=fill, tint=role bg, soft/softNum=vote). */
export const TAG_HUES = {
  teal: { deep: '#4B6552', vivid: '#7FA088', tint: '#EBF0EC', soft: '#B3C7B8', softNum: '#93AF9A' },
  pink: { deep: '#495567', vivid: '#8593A8', tint: '#EAEDF0', soft: '#B2BAC8', softNum: '#919DB0' },
  amber: { deep: '#876A29', vivid: '#C9A24B', tint: '#F7F1E4', soft: '#E0CA99', softNum: '#D3B46E' },
  violet: { deep: '#684863', vivid: '#A47B9E', tint: '#F0EAEF', soft: '#C9B1C5', softNum: '#B28FAD' },
  indigo: { deep: '#435B6D', vivid: '#6B8BA4', tint: '#E9EEF1', soft: '#ADBFCD', softNum: '#8AA3B7' },
  orange: { deep: '#74563C', vivid: '#B08968', tint: '#F3EDE8', soft: '#D1BBA8', softNum: '#BE9E83' },
} as const

export type TagHueName = keyof typeof TAG_HUES

/** Tool tags share one neutral palette (logo carries the colour). */
export const TAG_NEUTRAL: TagHue = {
  deep: '#37322a',
  vivid: '#37322a',
  tint: '#ffffff',
  soft: '#cbc6bb',
  softNum: '#a8a399',
}

/** Dark text/chevron on the vivid Domain fills. */
export const TAG_DOMAIN_INK = '#1d271b'

export type DomainIconName = 'growth' | 'async' | 'funding'

export interface DeptDef {
  id: string
  label: string
  hue: TagHueName
}
export interface VoteTagDef {
  id: string
  label: string
  hue: TagHueName
  count: number
}
export interface DomainDef extends VoteTagDef {
  icon: DomainIconName
}
export interface ToolDef {
  id: string
  label: string
  logo: string
  count: number
}

/* ── Seed registries (mirror the design sheet) ─────────────────────────── */

export const DEPTS: DeptDef[] = [
  { id: 'marketing', label: 'Marketing', hue: 'orange' },
  { id: 'design', label: 'Design', hue: 'violet' },
  { id: 'sales', label: 'Sales', hue: 'indigo' },
]

/** Map any department label (free text) → a canonical hue, for surfaces that
 * carry a dept name as a string (tool cards, post headers, etc.). */
const DEPT_HUE: Record<string, TagHueName> = {
  marketing: 'orange',
  design: 'violet',
  sales: 'indigo',
  bd: 'indigo',
  development: 'teal',
  dev: 'teal',
  engineering: 'teal',
  product: 'amber',
  research: 'pink',
  growth: 'teal',
  data: 'indigo',
  community: 'pink',
  ops: 'amber',
  writer: 'indigo',
  designer: 'violet',
  pm: 'amber',
  analyst: 'pink',
}

export function deptHue(label: string): TagHueName {
  const key = label.toLowerCase().split(/[\s/]+/)[0]
  return DEPT_HUE[key] ?? 'indigo'
}

/** Map a taxonomy topic id/label → a canonical hue, for Domain tags. */
const TOPIC_HUE: Record<string, TagHueName> = {
  funding: 'teal',
  gov: 'violet',
  governance: 'violet',
  sec: 'pink',
  security: 'pink',
  ai: 'violet',
  'ai tooling': 'violet',
  devtool: 'indigo',
  'dev tooling': 'indigo',
  growth: 'teal',
  brand: 'pink',
  research: 'indigo',
  design: 'violet',
  async: 'pink',
  marketing: 'orange',
}

export function topicHue(key: string): TagHueName {
  return TOPIC_HUE[key.toLowerCase()] ?? 'amber'
}

/** Map a topic id/label → a Material Symbol glyph. Covers the app's mock topic
 * ids (which don't resolve in the Sofia taxonomy) so every Domain tag gets an
 * icon — like the Claude Design sheet where every tag carries one. */
const TOPIC_GLYPH: Record<string, string> = {
  funding: 'savings',
  gov: 'gavel',
  governance: 'gavel',
  sec: 'shield',
  security: 'shield',
  ai: 'smart_toy',
  'ai tooling': 'smart_toy',
  devtool: 'terminal',
  'dev tooling': 'terminal',
  growth: 'trending_up',
  design: 'brush',
  brand: 'auto_awesome',
  research: 'science',
  async: 'sync',
  marketing: 'campaign',
  pubgoods: 'volunteer_activism',
  qf: 'how_to_vote',
  defi: 'currency_exchange',
  zk: 'enhanced_encryption',
}

export function topicGlyph(key: string): string {
  return TOPIC_GLYPH[key.toLowerCase()] ?? 'sell'
}

export const ROLES: VoteTagDef[] = [
  { id: 'writer', label: 'Writer', hue: 'indigo', count: 8 },
  { id: 'designer', label: 'Designer', hue: 'orange', count: 8 },
  { id: 'pm', label: 'PM', hue: 'teal', count: 5 },
]

export const DOMAINS: DomainDef[] = [
  { id: 'growth', label: 'Growth', hue: 'teal', icon: 'growth', count: 61 },
  { id: 'async', label: 'Async', hue: 'pink', icon: 'async', count: 18 },
  { id: 'funding', label: 'Funding', hue: 'amber', icon: 'funding', count: 24 },
]

export const SKILLS: VoteTagDef[] = [
  { id: 'ai', label: 'AI', hue: 'violet', count: 17 },
  { id: 'brand', label: 'Brand', hue: 'pink', count: 12 },
  { id: 'research', label: 'Research', hue: 'indigo', count: 9 },
]

export const TOOLS: ToolDef[] = [
  { id: 'figma', label: 'Figma', logo: 'https://cdn.simpleicons.org/figma', count: 6 },
  { id: 'notion', label: 'Notion', logo: 'https://cdn.simpleicons.org/notion/0f0f0f', count: 9 },
  { id: 'asana', label: 'Asana', logo: 'https://cdn.simpleicons.org/asana', count: 7 },
  { id: 'linear', label: 'Linear', logo: 'https://cdn.simpleicons.org/linear/5e6ad2', count: 11 },
]
