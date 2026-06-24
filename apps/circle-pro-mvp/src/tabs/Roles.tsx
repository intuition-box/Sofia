/**
 * Roles — the teams you belong to. The team overview grid is dropped (that
 * tree lives in the left rail now); instead each of your teams shows its own
 * tools + memory, stacked.
 */
import { Activity } from './Activity'
import { Memory } from './Memory'
import type { RoleId } from '../data/types'

/** The teams you're part of — each gets its tools + memory. */
const MY_TEAMS: RoleId[] = ['design', 'dev']

export function Roles() {
  return (
    <div className="role-teams">
      {MY_TEAMS.map((t) => (
        <div className="role-team" key={t}>
          <Activity role={t} />
          <Memory role={t} />
        </div>
      ))}
    </div>
  )
}
