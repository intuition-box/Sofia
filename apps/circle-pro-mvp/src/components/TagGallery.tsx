/**
 * TagGallery — a verification sheet that renders every tag family from the
 * local tag design system, mirroring the Claude Design "Tag Styles" sheet.
 * Mounted in dev via `?tags` (see App.tsx) so the palette can be eyeballed in
 * both light and dark themes. Not part of the product navigation.
 */
import type { ReactNode } from 'react'
import { DeptTag, RoleTag, DomainTag, SkillTag, ToolTag, TagIcon } from './Tag'
import { DEPTS, ROLES, DOMAINS, SKILLS, TOOLS } from '../data/tagStyles'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="tag-gallery-lab mono">{label}</span>
      <div className="tag-gallery-row">{children}</div>
    </>
  )
}

export function TagGallery() {
  return (
    <div className="tag-gallery">
      <div className="tag-gallery-card">
        <div className="tag-gallery-eyebrow mono">Sofia Pro · tags</div>
        <div className="tag-gallery-grid">
          <Row label="Depts">
            {DEPTS.map((d) => (
              <DeptTag key={d.id} {...d} />
            ))}
          </Row>
          <Row label="Roles">
            {ROLES.map((r) => (
              <RoleTag key={r.id} {...r} />
            ))}
          </Row>
          <Row label="Domains">
            {DOMAINS.map((d) => (
              <DomainTag
                key={d.id}
                label={d.label}
                hue={d.hue}
                count={d.count}
                icon={<TagIcon name={d.icon} color="currentColor" />}
              />
            ))}
          </Row>
          <Row label="Skills">
            {SKILLS.map((s) => (
              <SkillTag key={s.id} {...s} />
            ))}
          </Row>
          <Row label="Tools">
            {TOOLS.map((t) => (
              <ToolTag key={t.id} {...t} />
            ))}
          </Row>
        </div>
      </div>
    </div>
  )
}
