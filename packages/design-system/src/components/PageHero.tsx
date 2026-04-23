import type { HTMLAttributes, ReactNode } from 'react'

export interface PageHeroProps extends HTMLAttributes<HTMLDivElement> {
  /** Big Fraunces title. */
  title: string
  /** Optional paragraph under the title. */
  description?: string
  /** Optional extra content rendered below the description (buttons, badges, …). */
  children?: ReactNode
  /** Background color override. Defaults to the peach `--ds-accent` token. */
  background?: string
  /** Drop the decorative rotated square. */
  hideDeco?: boolean
}

/**
 * `<PageHero>` — peach banner with big Fraunces title + short description,
 * topped with a subtle tilted square. Used at the top of major app pages
 * (Home, Profile, Compose, …).
 *
 * Requires the stylesheet:
 *   `@import "@0xsofia/design-system/styles/page-hero.css";`
 */
export function PageHero({
  title,
  description,
  children,
  background,
  hideDeco,
  className,
  style,
  ...rest
}: PageHeroProps) {
  const cls = className ? `ph-container ${className}` : 'ph-container'
  const resolvedStyle = background ? { ...style, background } : style
  return (
    <div className={cls} style={resolvedStyle} {...rest}>
      <h1 className="ph-title">{title}</h1>
      {description ? <p className="ph-description">{description}</p> : null}
      {children}
      {hideDeco ? null : <div className="ph-deco" aria-hidden="true" />}
    </div>
  )
}
