/**
 * Company teams — the second facet (alongside topic) for browsing the shared
 * library. A bookmark's team is assigned deterministically per URL, so a topic
 * like "Tech" ends up shared across Finance, Design, Web3, … — which is the
 * cross-team interaction the breadcrumb navigation surfaces.
 */
export interface Team {
  id: string
  label: string
  color: string
}

export const TEAMS: Team[] = [
  { id: 'eng', label: 'Engineering', color: '#3b82f6' },
  { id: 'design', label: 'Design', color: '#ec4899' },
  { id: 'web3', label: 'Web3', color: '#22c55e' },
  { id: 'finance', label: 'Finance', color: '#f59e0b' },
  { id: 'marketing', label: 'Marketing', color: '#8b5cf6' },
  { id: 'research', label: 'Research', color: '#06b6d4' },
  { id: 'ops', label: 'Ops', color: '#94a3b8' },
]

export const TEAM_MAP: Record<string, Team> = Object.fromEntries(
  TEAMS.map((t) => [t.id, t]),
)

export function teamFor(url: string): string {
  let h = 2166136261
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return TEAMS[h % TEAMS.length].id
}
