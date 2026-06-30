/**
 * SocialLinks — renders a wallet's bot-verified social icons. Shared by the
 * circle members panel (`variant="member"`) and the public-profile aside
 * (`variant="aside"`); each variant maps to the existing `.cf-social*` /
 * `.ppa-social*` styles so the icon language stays consistent.
 *
 * Linkable platforms (YouTube/Spotify/X) render an <a>; non-addressable ones
 * (Discord/Twitch) render a non-clickable "verified" badge. Renders nothing
 * when the wallet has no verified social — callers can branch on
 * `socials.length` to hide a surrounding section title.
 */
import type { SocialLink, SocialPlatform } from '@/services/socialsService'

interface SocialLinksProps {
  socials: SocialLink[]
  variant: 'member' | 'aside'
  /** Name used in titles/aria, e.g. the member handle. */
  ownerLabel?: string
}

const PLATFORM_NAME: Record<SocialPlatform, string> = {
  twitter: 'X',
  discord: 'Discord',
  youtube: 'YouTube',
  spotify: 'Spotify',
  twitch: 'Twitch',
}

function Icon({
  platform,
  className,
}: {
  platform: SocialPlatform
  className: string
}) {
  switch (platform) {
    case 'twitter':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
        </svg>
      )
    case 'discord':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M20.317 4.369A19.79 19.79 0 0 0 15.43 2.85a.075.075 0 0 0-.079.038c-.21.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127c-.598.349-1.22.645-1.873.892a.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.056c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.08 0 12 0 12s0 3.92.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
        </svg>
      )
    case 'spotify':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0Zm5.5 17.32a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 1 1-.33-1.46c4.57-1.04 8.5-.59 11.66 1.34.35.22.46.68.25 1.03Zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.23-1.99-8.15-2.56-11.97-1.4a.94.94 0 1 1-.54-1.8c4.37-1.32 9.79-.68 13.5 1.6.44.27.58.85.3 1.29Zm.13-3.4C15.73 8.36 8.5 8.14 4.78 9.27a1.13 1.13 0 1 1-.65-2.16c4.27-1.3 12.26-1.05 16.55 1.5a1.13 1.13 0 0 1-1.16 1.94l.01.1Z" />
        </svg>
      )
    case 'twitch':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M4.27 0 1.5 5.55v17.18h6V24h3.36l3.18-3.27h4.9L24 14.55V0H4.27Zm17.45 13.64-3.55 3.54h-5.46l-3.18 3.18v-3.18H4.91V2.18h16.81v11.46ZM18.18 6.5v6.27h-2.18V6.5h2.18Zm-5.45 0v6.27h-2.19V6.5h2.19Z" />
        </svg>
      )
  }
}

export default function SocialLinks({
  socials,
  variant,
  ownerLabel,
}: SocialLinksProps) {
  if (socials.length === 0) return null

  const wrapClass = variant === 'aside' ? 'ppa-socials' : 'cf-socials'
  const itemClass = variant === 'aside' ? 'ppa-social' : 'cf-social'
  const iconClass = variant === 'aside' ? 'ppa-social-icon' : 'cf-social-icon'
  const suffix = ownerLabel ? ` · ${ownerLabel}` : ''

  return (
    <div
      className={wrapClass}
      aria-label={ownerLabel ? `${ownerLabel} socials` : 'Socials'}>
      {socials.map((s) => {
        const name = PLATFORM_NAME[s.platform]
        const icon = <Icon platform={s.platform} className={iconClass} />
        return s.url ? (
          <a
            key={s.platform}
            className={itemClass}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${name} · verified${suffix}`}
            aria-label={`${name} · verified${suffix}`}
            onClick={(e) => e.stopPropagation()}>
            {icon}
          </a>
        ) : (
          <span
            key={s.platform}
            className={`${itemClass} is-verified-badge`}
            title={`${name} · verified (no public profile)${suffix}`}
            aria-label={`${name} · verified${suffix}`}>
            {icon}
            <span className="social-verified-check" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M20 6 9 17l-5-5"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </span>
        )
      })}
    </div>
  )
}
